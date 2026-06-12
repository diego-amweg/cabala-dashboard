// lib/montecarlo.ts
// simulación Monte Carlo del Mundial 2026. corre N torneos completos (grupos -> mejores
// terceros via matriz FIFA -> bracket R32..final) y promedia cuántas veces cada selección
// alcanza cada ronda. recibe los datos por parámetro (no lee Redis ni hace fetch).
// optimizado para correr 50k iteraciones en pocos segundos (ver poisson.ts: muestreo por CDF
// cacheado). incluye un presupuesto de tiempo: si se pasa, corta y devuelve lo acumulado con
// el conteo real de iteraciones, para nunca colgar la función serverless.

import { BRACKET, THIRD_SLOT_ORDER, THIRD_PLACE_MATRIX } from '@/data/thirdPlaceMatrix';
import { getInitialElo, eloWithHost, expectedScore, ELO_INITIAL } from './elo';
import { sampleScore } from './poisson';

export interface RealResult {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamOdds {
  team: string;
  champion: number;
  final: number;
  semi: number;
  quarter: number;
  r16: number;
  r32: number;
}

export interface SimulationResult {
  odds: TeamOdds[];
  iterations: number;        // iteraciones REALMENTE corridas (puede ser < pedidas si saltó el presupuesto)
  unmatchedTeams: string[];  // equipos sin Elo en ELO_INITIAL (debe ser [])
}

export const MC_ITERATIONS = 50000;
// presupuesto de tiempo de seguridad. el motor corre ~5s en hardware modesto; 8000ms deja
// margen y garantiza que nunca se llegue al corte de 10s de Vercel. si por lo que sea una
// corrida se ralentiza, devuelve lo acumulado en vez de tirar timeout.
export const MC_TIME_BUDGET_MS = 8000;
// cada cuántas iteraciones se chequea el reloj (chequear en cada una sería caro).
const TIME_CHECK_EVERY = 500;

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateTournament(
  groups: Record<string, string[]>,
  realResults: RealResult[],
  iterations: number = MC_ITERATIONS
): SimulationResult {
  const rng = mulberry32(2026);

  const unmatchedSet = new Set<string>();
  const allTeams: string[] = [];
  for (const group of Object.values(groups)) {
    for (const team of group) {
      if (!allTeams.includes(team)) {
        allTeams.push(team);
        if (ELO_INITIAL[team] === undefined) unmatchedSet.add(team);
      }
    }
  }
  const unmatchedTeams = Array.from(unmatchedSet);

  // resultados reales indexados en ambos órdenes para lookup O(1)
  const realMap = new Map<string, { homeScore: number; awayScore: number }>();
  for (const r of realResults) {
    realMap.set(`${r.home}|${r.away}`, { homeScore: r.homeScore, awayScore: r.awayScore });
    realMap.set(`${r.away}|${r.home}`, { homeScore: r.awayScore, awayScore: r.homeScore });
  }

  // Elo efectivo (con localía aplicada) precomputado una sola vez: no cambia entre iteraciones
  const eff: Record<string, number> = {};
  for (const t of allTeams) eff[t] = eloWithHost(t, getInitialElo(t));

  const reachCount: Record<string, { r32: number; r16: number; quarter: number; semi: number; final: number; champion: number }> = {};
  for (const t of allTeams) reachCount[t] = { r32: 0, r16: 0, quarter: 0, semi: 0, final: 0, champion: 0 };

  const groupKeys = Object.keys(groups).sort();

  const startedAt = Date.now();
  let done = 0;

  for (let iter = 0; iter < iterations; iter++) {
    // presupuesto de tiempo: cortar antes de acercarse al límite de la función serverless
    if (iter % TIME_CHECK_EVERY === 0 && Date.now() - startedAt > MC_TIME_BUDGET_MS) {
      break;
    }

    const iterReach: Record<string, number> = {};
    for (const t of allTeams) iterReach[t] = 0;

    const groupStandings: Record<string, { team: string; pts: number; gd: number; gf: number; rand: number }[]> = {};

    for (const g of groupKeys) {
      const gTeams = groups[g];
      const stats: Record<string, { pts: number; gd: number; gf: number; rand: number }> = {};
      for (const t of gTeams) stats[t] = { pts: 0, gd: 0, gf: 0, rand: rng() - 0.5 };

      for (let i = 0; i < gTeams.length; i++) {
        for (let j = i + 1; j < gTeams.length; j++) {
          const tA = gTeams[i];
          const tB = gTeams[j];
          let sA: number, sB: number;

          const rr = realMap.get(`${tA}|${tB}`);
          if (rr) {
            sA = rr.homeScore;
            sB = rr.awayScore;
          } else {
            const s = sampleScore(eff[tA], eff[tB], rng);
            sA = s.home;
            sB = s.away;
          }

          stats[tA].gf += sA;
          stats[tB].gf += sB;
          stats[tA].gd += (sA - sB);
          stats[tB].gd += (sB - sA);

          if (sA > sB) stats[tA].pts += 3;
          else if (sA < sB) stats[tB].pts += 3;
          else { stats[tA].pts += 1; stats[tB].pts += 1; }
        }
      }

      groupStandings[g] = gTeams
        .map(t => ({ team: t, ...stats[t] }))
        .sort((a, b) => (b.pts - a.pts) || (b.gd - a.gd) || (b.gf - a.gf) || (b.rand - a.rand));
    }

    // mejores 8 terceros -> clave de 8 grupos -> matriz FIFA asigna cada tercero a su llave
    const thirds = groupKeys
      .map(g => ({ group: g, ...groupStandings[g][2] }))
      .sort((a, b) => (b.pts - a.pts) || (b.gd - a.gd) || (b.gf - a.gf) || (b.rand - a.rand));
    const bestThirds = thirds.slice(0, 8);
    const bestThirdsGroups = bestThirds.map(t => t.group).sort().join('');

    const assignment = THIRD_PLACE_MATRIX[bestThirdsGroups];
    const slotToThird: Record<string, string> = {};
    if (assignment) {
      for (let i = 0; i < assignment.length; i++) {
        const groupLetter = assignment[i];
        const thirdTeam = bestThirds.find(t => t.group === groupLetter)?.team;
        if (thirdTeam) slotToThird[THIRD_SLOT_ORDER[i]] = thirdTeam;
      }
    }

    const winners: Record<string, string> = {};

    const resolveSlot = (slot: string): string | null => {
      if (slot.startsWith('1')) return groupStandings[slot.charAt(1)]?.[0]?.team ?? null;
      if (slot.startsWith('2')) return groupStandings[slot.charAt(1)]?.[1]?.team ?? null;
      if (slot.startsWith('W')) return winners[slot.substring(1)] ?? null;
      return null; // los slots "3[...]" se resuelven aparte desde slotToThird
    };

    for (const match of BRACKET) {
      let teamA = resolveSlot(match.slotA);
      let teamB = resolveSlot(match.slotB);

      if (match.slotB.startsWith('3[') && teamA) {
        teamB = slotToThird[match.slotA] ?? null;
      }

      if (teamA && teamB) {
        if (match.round === 'R32') {
          if (1 > iterReach[teamA]) iterReach[teamA] = 1;
          if (1 > iterReach[teamB]) iterReach[teamB] = 1;
        }

        const eloA = eff[teamA];
        const eloB = eff[teamB];

        let winner = teamA;
        const rr = realMap.get(`${teamA}|${teamB}`);
        if (rr) {
          if (rr.homeScore > rr.awayScore) winner = teamA;
          else if (rr.awayScore > rr.homeScore) winner = teamB;
          else winner = rng() < expectedScore(eloA, eloB) ? teamA : teamB;
        } else {
          const s = sampleScore(eloA, eloB, rng);
          if (s.home > s.away) winner = teamA;
          else if (s.away > s.home) winner = teamB;
          else winner = rng() < expectedScore(eloA, eloB) ? teamA : teamB;
        }

        winners[String(match.id)] = winner;

        let reachedRound = 0;
        if (match.round === 'R32') reachedRound = 2;
        else if (match.round === 'R16') reachedRound = 3;
        else if (match.round === 'QF') reachedRound = 4;
        else if (match.round === 'SF') reachedRound = 5;
        else if (match.round === 'F') reachedRound = 6;

        if (reachedRound > iterReach[winner]) iterReach[winner] = reachedRound;
      }
    }

    for (const t of allTeams) {
      const r = iterReach[t];
      if (r >= 1) reachCount[t].r32++;
      if (r >= 2) reachCount[t].r16++;
      if (r >= 3) reachCount[t].quarter++;
      if (r >= 4) reachCount[t].semi++;
      if (r >= 5) reachCount[t].final++;
      if (r >= 6) reachCount[t].champion++;
    }

    done++;
  }

  // promediar sobre las iteraciones REALMENTE corridas (done), no las pedidas
  const denom = done > 0 ? done : 1;
  const odds: TeamOdds[] = allTeams.map(t => ({
    team: t,
    r32: Math.round((reachCount[t].r32 / denom) * 10000) / 10000,
    r16: Math.round((reachCount[t].r16 / denom) * 10000) / 10000,
    quarter: Math.round((reachCount[t].quarter / denom) * 10000) / 10000,
    semi: Math.round((reachCount[t].semi / denom) * 10000) / 10000,
    final: Math.round((reachCount[t].final / denom) * 10000) / 10000,
    champion: Math.round((reachCount[t].champion / denom) * 10000) / 10000,
  }));

  odds.sort((a, b) => b.champion - a.champion);

  return { odds, iterations: done, unmatchedTeams };
}