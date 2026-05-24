import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { teamES } from '@/lib/teams';

const API_BASE = 'https://api.football-data.org/v4';
const STANDINGS_CACHE_KEY = 'standings:groups';
const STANDINGS_CACHE_TTL = 7 * 24 * 60 * 60; // 7d: último bueno conocido
const STANDINGS_MAX_AGE = 60 * 60 * 1000;     // 1h: si es más viejo, intenta refrescar

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

type Cached = { groups: Group[]; updatedAt: number };

export async function GET(req: Request) {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';
  const cached = await cacheGet<Cached>(STANDINGS_CACHE_KEY);

  if (cached && !forceRefresh && Date.now() - cached.updatedAt < STANDINGS_MAX_AGE) {
    return NextResponse.json({ groups: cached.groups, updatedAt: cached.updatedAt, cached: true });
  }

  const serveStaleOr = (fallback: Record<string, unknown>) => {
    if (cached && cached.groups.length > 0) {
      return NextResponse.json({ groups: cached.groups, updatedAt: cached.updatedAt, cached: true, stale: true });
    }
    return NextResponse.json({ groups: [], updatedAt: Date.now(), ...fallback });
  };

  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) return serveStaleOr({ error: 'falta la API key de football-data' });

  try {
    const res = await fetch(`${API_BASE}/competitions/WC/matches?season=2026`, { headers: { 'X-Auth-Token': key } });

    if (!res.ok) {
      return serveStaleOr({ error: 'football-data no respondió bien', debug: { httpStatus: res.status } });
    }

    const data = await res.json();

    if (!data.matches || !Array.isArray(data.matches)) {
      return serveStaleOr({ error: 'respuesta inesperada de football-data', debug: { httpStatus: res.status, apiMessage: data.message ?? null, keys: Object.keys(data) } });
    }

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
      return serveStaleOr({ count: 0, debug: { totalReceived: data.matches.length, stages } });
    }

    await cacheSet(STANDINGS_CACHE_KEY, { groups, updatedAt: Date.now() }, STANDINGS_CACHE_TTL);
    return NextResponse.json({ groups, updatedAt: Date.now(), count: groups.length });
  } catch {
    return serveStaleOr({ error: 'error al consultar football-data' });
  }
}
