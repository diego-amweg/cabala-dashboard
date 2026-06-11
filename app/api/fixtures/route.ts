import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { teamES } from '@/lib/teams';

const API_BASE = 'https://api.football-data.org/v4';
const FIXTURES_CACHE_KEY = 'fixtures:groups';
const FIXTURES_CACHE_TTL = 7 * 24 * 60 * 60; // 7d en redis: guarda el último bueno conocido
const FIXTURES_MAX_AGE = 60 * 60 * 1000;     // 1h: si el cache es más viejo, intenta refrescar
const MATCH_DAY_MAX_AGE = 5 * 60 * 1000;   // 5min en día de partido

interface FixtureItem {
  id: string;
  date: string;
  time: string;
  home: string;
  away: string;
  phase: string;
  venue: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fmtAR(utcDate: string): { date: string; time: string } {
  const d = new Date(new Date(utcDate).getTime() - 3 * 3600 * 1000);
  const date = `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
  const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return { date, time };
}

function mapStatus(status: string): 'scheduled' | 'live' | 'finished' {
  if (['FINISHED', 'AWARDED'].includes(status)) return 'finished';
  if (['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT', 'SUSPENDED'].includes(status)) return 'live';
  return 'scheduled';
}

function phaseLabel(group: string | null): string {
  if (group && group.startsWith('GROUP_')) return `grupo ${group.split('_')[1]}`;
  return 'fase de grupos';
}

function isToday_ART(utcDate: string): boolean {
  const m = new Date(new Date(utcDate).getTime() - 3 * 3600 * 1000);
  const t = new Date(Date.now() - 3 * 3600 * 1000);
  return m.getUTCFullYear() === t.getUTCFullYear() && m.getUTCMonth() === t.getUTCMonth() && m.getUTCDate() === t.getUTCDate();
}

type Cached = { items: FixtureItem[]; updatedAt: number; isMatchDay: boolean };

export async function GET(req: Request) {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';
  const cached = await cacheGet<Cached>(FIXTURES_CACHE_KEY);

  // cache fresco (menos de 1h) y sin refresh forzado -> devolver directo
  const maxAge = cached?.isMatchDay ? MATCH_DAY_MAX_AGE : FIXTURES_MAX_AGE;
  if (cached && !forceRefresh && Date.now() - cached.updatedAt < maxAge) {
    return NextResponse.json({ items: cached.items, updatedAt: cached.updatedAt, cached: true });
  }

  // ante cualquier fallo, servir el último bueno conocido en vez de vacío
  const serveStaleOr = (fallback: Record<string, unknown>) => {
    if (cached && cached.items.length > 0) {
      return NextResponse.json({ items: cached.items, updatedAt: cached.updatedAt, cached: true, stale: true });
    }
    return NextResponse.json({ items: [], updatedAt: Date.now(), ...fallback });
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

    const groupMatches = data.matches
      .filter((m: any) => m.stage === 'GROUP_STAGE')
      .sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

    const items: FixtureItem[] = groupMatches.map((m: any) => {
      const { date, time } = fmtAR(m.utcDate);
      const status = mapStatus(m.status);
      const item: FixtureItem = {
        id: String(m.id),
        date, time,
        home: teamES(m.homeTeam?.name ?? 'por definir'),
        away: teamES(m.awayTeam?.name ?? 'por definir'),
        phase: phaseLabel(m.group),
        venue: m.venue ?? '',
        status,
      };
      const hs = m.score?.fullTime?.home;
      const as = m.score?.fullTime?.away;
      if (status !== 'scheduled' && hs !== null && hs !== undefined && as !== null && as !== undefined) {
        item.homeScore = hs;
        item.awayScore = as;
      }
      return item;
    });

    if (items.length === 0) {
      const stages = Array.from(new Set(data.matches.map((m: any) => m.stage)));
      return serveStaleOr({ count: 0, debug: { totalReceived: data.matches.length, stages, resultSet: data.resultSet ?? null } });
    }

    const isMatchDay = data.matches.some((m: any) => m.stage === 'GROUP_STAGE' && m.utcDate && isToday_ART(m.utcDate));

    // anti-retroceso: football-data sirve réplicas desincronizadas (11 jun: FINISHED y TIMED
    // alternados para el mismo partido). un estado nunca se degrada: scheduled < live < finished.
    // tampoco se pisa un finished con score por un finished sin score.
    const RANK = { scheduled: 0, live: 1, finished: 2 } as const;
    const prevById = new Map((cached?.items ?? []).map((p) => [p.id, p]));
    const merged: FixtureItem[] = items.map((it) => {
      const prev = prevById.get(it.id);
      if (!prev) return it;
      if (RANK[it.status] < RANK[prev.status]) return prev;
      if (prev.status === 'finished' && it.status === 'finished' && it.homeScore === undefined && prev.homeScore !== undefined) return prev;
      return it;
    });
    const held = merged.filter((x, i) => x !== items[i]).length;

    await cacheSet(FIXTURES_CACHE_KEY, { items: merged, updatedAt: Date.now(), isMatchDay }, FIXTURES_CACHE_TTL);
    return NextResponse.json({ items: merged, updatedAt: Date.now(), count: merged.length, isMatchDay, held });
  } catch {
    return serveStaleOr({ error: 'error al consultar football-data' });
  }
}
