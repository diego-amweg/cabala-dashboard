import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';

const HEAT_CACHE_KEY = 'heat:teams';
const HEAT_CACHE_TTL = 7 * 24 * 60 * 60;   // 7d: último bueno conocido
const HEAT_MAX_AGE = 6 * 60 * 60 * 1000;   // 6h: si es más viejo, refresca (wikipedia es diaria)
const UA = 'CabalaDashboard/1.0 (https://cabala-dashboard.vercel.app; mundial 2026)';
const PROJECT = 'en.wikipedia.org';

// selección -> artículo del equipo nacional en wikipedia en inglés (medimos a todas con la
// misma vara, comparable y global). USA y Canadá usan "men's national soccer team"; el resto
// "national football team". si un título falla, el autodiagnóstico lo marca (sources got:false).
const TEAM_ARTICLE: { code: string; name: string; article: string }[] = [
  { code: 'ARG', name: 'Argentina',      article: 'Argentina national football team' },
  { code: 'BRA', name: 'Brasil',         article: 'Brazil national football team' },
  { code: 'URU', name: 'Uruguay',        article: 'Uruguay national football team' },
  { code: 'PAR', name: 'Paraguay',       article: 'Paraguay national football team' },
  { code: 'COL', name: 'Colombia',       article: 'Colombia national football team' },
  { code: 'ECU', name: 'Ecuador',        article: 'Ecuador national football team' },
  { code: 'MEX', name: 'México',         article: 'Mexico national football team' },
  { code: 'USA', name: 'Estados Unidos', article: "United States men's national soccer team" },
  { code: 'CAN', name: 'Canadá',         article: "Canada men's national soccer team" },
  { code: 'FRA', name: 'Francia',        article: 'France national football team' },
  { code: 'ESP', name: 'España',         article: 'Spain national football team' },
  { code: 'JPN', name: 'Japón',          article: 'Japan national football team' },
];

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

async function fetchViews(article: string, start: string, end: string): Promise<number | null> {
  const enc = encodeURIComponent(article.replace(/ /g, '_'));
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${PROJECT}/all-access/all-agents/${enc}/daily/${start}/${end}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.items)) return null;
    return data.items.reduce((s: number, it: { views?: number }) => s + (it.views ?? 0), 0);
  } catch {
    return null;
  }
}

interface TeamHeat { code: string; name: string; views: number; heat: number; }
type Cached = { teams: TeamHeat[]; updatedAt: number };

export async function GET(req: Request) {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';
  const cached = await cacheGet<Cached>(HEAT_CACHE_KEY);

  if (cached && !forceRefresh && Date.now() - cached.updatedAt < HEAT_MAX_AGE) {
    return NextResponse.json({ teams: cached.teams, updatedAt: cached.updatedAt, cached: true });
  }

  const serveStaleOr = (fallback: Record<string, unknown>) => {
    if (cached && cached.teams.length > 0) {
      return NextResponse.json({ teams: cached.teams, updatedAt: cached.updatedAt, cached: true, stale: true });
    }
    return NextResponse.json({ teams: [], updatedAt: Date.now(), ...fallback });
  };

  const end = new Date(Date.now() - 2 * 24 * 3600 * 1000);
  const start = new Date(end.getTime() - 6 * 24 * 3600 * 1000);
  const startStr = ymd(start);
  const endStr = ymd(end);

  try {
    const results = await Promise.all(
      TEAM_ARTICLE.map(async t => ({ ...t, views: await fetchViews(t.article, startStr, endStr) }))
    );

    const got = results.filter(r => r.views !== null);
    if (got.length === 0) {
      return serveStaleOr({ error: 'wikipedia no respondió', debug: { window: `${startStr}-${endStr}` } });
    }

    const maxViews = Math.max(...got.map(r => r.views as number));
    const teams: TeamHeat[] = results
      .map(r => ({
        code: r.code,
        name: r.name,
        views: r.views ?? 0,
        heat: maxViews > 0 && r.views ? Math.max(5, Math.round(Math.sqrt(r.views / maxViews) * 100)) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    const payload = {
      teams,
      updatedAt: Date.now(),
      debug: { window: `${startStr}-${endStr}`, sources: results.map(r => ({ code: r.code, got: r.views !== null })) },
    };
    await cacheSet(HEAT_CACHE_KEY, { teams, updatedAt: Date.now() }, HEAT_CACHE_TTL);
    return NextResponse.json(payload);
  } catch {
    return serveStaleOr({ error: 'error al consultar wikipedia' });
  }
}
