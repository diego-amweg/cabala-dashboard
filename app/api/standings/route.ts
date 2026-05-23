import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { teamES } from '@/lib/teams';

const API_BASE = 'https://api.football-data.org/v4';
const STANDINGS_CACHE_KEY = 'standings:groups';
const STANDINGS_CACHE_TTL = 60 * 60; // 1h

interface TeamRow {
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface Group {
  letter: string;
  table: TeamRow[];
}

function emptyRow(team: string): TeamRow {
  return { team, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

export async function GET(req: Request) {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';

  if (!forceRefresh) {
    const cached = await cacheGet<{ groups: Group[]; updatedAt: number }>(STANDINGS_CACHE_KEY);
    if (cached) {
      return NextResponse.json({ groups: cached.groups, updatedAt: cached.updatedAt, cached: true });
    }
  }

  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) {
    return NextResponse.json({ groups: [], updatedAt: Date.now(), error: 'falta la API key de football-data' });
  }

  try {
    const res = await fetch(`${API_BASE}/competitions/WC/matches?season=2026`, { headers: { 'X-Auth-Token': key } });
    const data = await res.json();

    if (!data.matches || !Array.isArray(data.matches)) {
      return NextResponse.json({
        groups: [], updatedAt: Date.now(), error: 'respuesta inesperada de football-data',
        debug: { httpStatus: res.status, apiMessage: data.message ?? null, keys: Object.keys(data) },
      });
    }

    // armamos una tabla por grupo desde los partidos de fase de grupos: los equipos
    // salen de los partidos, los puntos se calculan de los que estén finalizados.
    const groupsMap = new Map<string, Map<string, TeamRow>>();
    const ensure = (letter: string, team: string): TeamRow => {
      if (!groupsMap.has(letter)) groupsMap.set(letter, new Map());
      const g = groupsMap.get(letter)!;
      if (!g.has(team)) g.set(team, emptyRow(team));
      return g.get(team)!;
    };

    for (const m of data.matches) {
      if (m.stage !== 'GROUP_STAGE' || !m.group?.startsWith('GROUP_')) continue;
      const letter = m.group.split('_')[1];
      const home = teamES(m.homeTeam?.name ?? 'por definir');
      const away = teamES(m.awayTeam?.name ?? 'por definir');
      const rowH = ensure(letter, home);
      const rowA = ensure(letter, away);

      const finished = m.status === 'FINISHED' || m.status === 'AWARDED';
      const hs = m.score?.fullTime?.home;
      const as = m.score?.fullTime?.away;
      if (finished && hs !== null && hs !== undefined && as !== null && as !== undefined) {
        rowH.played++; rowA.played++;
        rowH.goalsFor += hs; rowH.goalsAgainst += as;
        rowA.goalsFor += as; rowA.goalsAgainst += hs;
        if (hs > as) { rowH.won++; rowH.points += 3; rowA.lost++; }
        else if (hs < as) { rowA.won++; rowA.points += 3; rowH.lost++; }
        else { rowH.draw++; rowA.draw++; rowH.points++; rowA.points++; }
      }
    }

    const groups: Group[] = Array.from(groupsMap.entries())
      .map(([letter, teams]) => ({
        letter,
        table: Array.from(teams.values()).sort((a, b) =>
          b.points - a.points ||
          (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
          b.goalsFor - a.goalsFor ||
          a.team.localeCompare(b.team)
        ),
      }))
      .sort((a, b) => a.letter.localeCompare(b.letter));

    if (groups.length === 0) {
      const stages = Array.from(new Set(data.matches.map((m: any) => m.stage)));
      return NextResponse.json({ groups: [], updatedAt: Date.now(), count: 0, debug: { totalReceived: data.matches.length, stages } });
    }

    await cacheSet(STANDINGS_CACHE_KEY, { groups, updatedAt: Date.now() }, STANDINGS_CACHE_TTL);

    return NextResponse.json({ groups, updatedAt: Date.now(), count: groups.length });
  } catch {
    return NextResponse.json({ groups: [], updatedAt: Date.now(), error: 'error al consultar football-data' });
  }
}