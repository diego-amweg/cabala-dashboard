import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { simulateTournament, SimulationResult, RealResult } from '@/lib/montecarlo';

export const dynamic = 'force-dynamic';

const PREDICTOR_CACHE_KEY = 'predictor:simulation';
const FIXTURES_CACHE_KEY = 'fixtures:groups';
const PREDICTOR_CACHE_TTL = 7 * 24 * 60 * 60;   // 7d: último bueno
const PREDICTOR_MAX_AGE = 60 * 60 * 1000;       // 1h normal
const MATCH_DAY_MAX_AGE = 5 * 60 * 1000;        // 5min día de partido

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
interface FixturesCached { items: FixtureItem[]; updatedAt: number; isMatchDay: boolean; }
interface PredictorCached { result: SimulationResult; updatedAt: number; isMatchDay: boolean; }

export async function GET(req: Request) {
  try {
    const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';
    const cached = await cacheGet<PredictorCached>(PREDICTOR_CACHE_KEY);

    const maxAge = cached?.isMatchDay ? MATCH_DAY_MAX_AGE : PREDICTOR_MAX_AGE;
    if (cached && !forceRefresh && Date.now() - cached.updatedAt < maxAge) {
      return NextResponse.json({
        odds: cached.result.odds,
        iterations: cached.result.iterations,
        updatedAt: cached.updatedAt,
        cached: true,
        debug: { unmatchedTeams: cached.result.unmatchedTeams }
      });
    }

    const fixturesCached = await cacheGet<FixturesCached>(FIXTURES_CACHE_KEY);
    if (!fixturesCached || !fixturesCached.items || fixturesCached.items.length === 0) {
      if (cached) {
        return NextResponse.json({
          odds: cached.result.odds,
          iterations: cached.result.iterations,
          updatedAt: cached.updatedAt,
          cached: true,
          stale: true,
          debug: { unmatchedTeams: cached.result.unmatchedTeams }
        });
      }
      return NextResponse.json({ odds: [], error: 'sin datos de fixtures todavía', debug: { unmatchedTeams: [], realResultsCount: 0 } });
    }

    const groups: Record<string, string[]> = {};
    const realResults: RealResult[] = [];

    for (const item of fixturesCached.items) {
      const matchPhase = item.phase.match(/^grupo ([A-L])$/);
      if (matchPhase) {
        const gLetter = matchPhase[1];
        if (!groups[gLetter]) groups[gLetter] = [];
        if (!groups[gLetter].includes(item.home)) groups[gLetter].push(item.home);
        if (!groups[gLetter].includes(item.away)) groups[gLetter].push(item.away);
      }

      if (item.status === 'finished' && item.homeScore !== undefined && item.awayScore !== undefined) {
        realResults.push({ home: item.home, away: item.away, homeScore: item.homeScore, awayScore: item.awayScore });
      }
    }

    const groupKeys = Object.keys(groups);
    let validGroups = true;
    const sizes: Record<string, number> = {};

    if (groupKeys.length !== 12) validGroups = false;
    for (const k of groupKeys) {
      sizes[k] = groups[k].length;
      if (groups[k].length !== 4) validGroups = false;
    }

    if (!validGroups) {
      if (cached) {
        return NextResponse.json({
          odds: cached.result.odds,
          iterations: cached.result.iterations,
          updatedAt: cached.updatedAt,
          cached: true,
          stale: true,
          debug: { unmatchedTeams: cached.result.unmatchedTeams, groupsFound: groupKeys.length, sizes }
        });
      }
      return NextResponse.json({ odds: [], error: 'datos de grupos incompletos', debug: { unmatchedTeams: [], realResultsCount: realResults.length, groupsFound: groupKeys.length, sizes } });
    }

    const result = simulateTournament(groups, realResults);

    await cacheSet(PREDICTOR_CACHE_KEY, { result, updatedAt: Date.now(), isMatchDay: fixturesCached.isMatchDay }, PREDICTOR_CACHE_TTL);

    return NextResponse.json({
      odds: result.odds,
      iterations: result.iterations,
      updatedAt: Date.now(),
      cached: false,
      debug: { unmatchedTeams: result.unmatchedTeams, realResultsCount: realResults.length }
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'error desconocido';
    const cached = await cacheGet<PredictorCached>(PREDICTOR_CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        odds: cached.result.odds,
        iterations: cached.result.iterations,
        updatedAt: cached.updatedAt,
        cached: true,
        stale: true,
        debug: { unmatchedTeams: cached.result.unmatchedTeams, error: message }
      });
    }
    return NextResponse.json({ odds: [], error: message, debug: { unmatchedTeams: [], realResultsCount: 0 } });
  }
}
