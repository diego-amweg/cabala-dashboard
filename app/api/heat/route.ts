import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { teamES } from '@/lib/teams';

const API_BASE = 'https://api.football-data.org/v4';
const HEAT_CACHE_KEY = 'heat:teams';
const HEAT_CACHE_TTL = 7 * 24 * 60 * 60;
const HEAT_MAX_AGE = 6 * 60 * 60 * 1000;
const UA = 'CabalaDashboard/1.0 (https://cabala-dashboard.vercel.app; mundial 2026)';
const PROJECT = 'en.wikipedia.org';

// override solo donde el título derivado no es el artículo de la selección masculina actual.
// el resto de los desvíos (redirects) los resuelve solo resolveCanonical().
const EN_ARTICLE_OVERRIDE: Record<string, string> = {
  'United States': "United States men's national soccer team",
  'Canada': "Canada men's national soccer team",
  'Australia': "Australia men's national soccer team",
  'Sweden': "Sweden men's national football team",
  'New Zealand': "New Zealand men's national football team",
};

function enArticle(name: string): string {
  return EN_ARTICLE_OVERRIDE[name] ?? `${name} national football team`;
}

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

// concurrencia limitada: evita el burst de pedidos que hacía a wikipedia cortar algunos al azar
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const cur = idx++;
      out[cur] = await fn(items[cur]);
    }
  });
  await Promise.all(workers);
  return out;
}

// reintenta una vez ante un fallo intermitente de red (evita que un equipo caiga a 0 por un hipo suelto)
async function retryNull<T>(fn: () => Promise<T | null>, tries = 2): Promise<T | null> {
  for (let i = 0; i < tries; i++) {
    const r = await fn();
    if (r !== null) return r;
    if (i < tries - 1) await new Promise(res => setTimeout(res, 250));
  }
  return null;
}

async function resolveCanonical(title: string): Promise<string | null> {
  const url = `https://${PROJECT}/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(title)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as { title?: string; missing?: string };
    if (page?.missing !== undefined) return null;
    return page?.title ?? null;
  } catch {
    return null;
  }
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

interface FdTeam { name: string; tla: string | null; crest: string | null; }
interface TeamHeat { code: string; name: string; crest: string | null; views: number; heat: number; }
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

  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) return serveStaleOr({ error: 'falta la API key de football-data' });

  let fdTeams: FdTeam[];
  try {
    const res = await fetch(`${API_BASE}/competitions/WC/matches?season=2026`, { headers: { 'X-Auth-Token': key } });
    if (!res.ok) return serveStaleOr({ error: 'football-data no respondió bien', debug: { httpStatus: res.status } });
    const data = await res.json();
    if (!data.matches || !Array.isArray(data.matches)) {
      return serveStaleOr({ error: 'respuesta inesperada de football-data', debug: { apiMessage: data.message ?? null } });
    }
    const map = new Map<string, FdTeam>();
    for (const m of data.matches) {
      if (m.stage !== 'GROUP_STAGE' || !m.group?.startsWith('GROUP_')) continue;
      for (const t of [m.homeTeam, m.awayTeam]) {
        const name = t?.name;
        if (!name || name === 'por definir') continue;
        if (!map.has(name)) map.set(name, { name, tla: t?.tla ?? null, crest: t?.crest ?? null });
      }
    }
    fdTeams = Array.from(map.values());
  } catch {
    return serveStaleOr({ error: 'error al consultar football-data' });
  }

  if (fdTeams.length === 0) return serveStaleOr({ error: 'no se derivaron equipos de football-data' });

  const end = new Date(Date.now() - 2 * 24 * 3600 * 1000);
  const start = new Date(end.getTime() - 6 * 24 * 3600 * 1000);
  const startStr = ymd(start);
  const endStr = ymd(end);

  // resolver canónico + medir, de a 5 a la vez (no en burst)
  const results = await mapLimit(fdTeams, 5, async t => {
    const candidate = enArticle(t.name);
    const canonical = await retryNull(() => resolveCanonical(candidate));
    const views = canonical ? await retryNull(() => fetchViews(canonical, startStr, endStr)) : null;
    return { ...t, candidate, canonical, views };
  });

  const got = results.filter(r => r.views !== null);
  if (got.length === 0) {
    return serveStaleOr({ error: 'wikipedia no respondió', debug: { window: `${startStr}-${endStr}` } });
  }

  const maxViews = Math.max(...got.map(r => r.views as number));
  const teams: TeamHeat[] = results
    .map(r => ({
      code: r.tla ?? r.name.slice(0, 3).toUpperCase(),
      name: teamES(r.name),
      crest: r.crest,
      views: r.views ?? 0,
      heat: maxViews > 0 && r.views ? Math.max(5, Math.round(Math.sqrt(r.views / maxViews) * 100)) : 0,
    }))
    .sort((a, b) => b.views - a.views);

  const payload = {
    teams,
    updatedAt: Date.now(),
    debug: {
      window: `${startStr}-${endStr}`,
      count: teams.length,
      failed: results.filter(r => r.views === null).map(r => r.name),
      sources: results.map(r => ({ es: teamES(r.name), canonical: r.canonical, views: r.views })),
    },
  };
  await cacheSet(HEAT_CACHE_KEY, { teams, updatedAt: Date.now() }, HEAT_CACHE_TTL);
  return NextResponse.json(payload);
}
