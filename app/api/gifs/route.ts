import { NextResponse } from 'next/server';

// query de Giphy por código de selección. en inglés y con "soccer" porque Giphy
// (US-centric) indexa mucho más contenido así que con "football" o "futbol".
// si los gifs de alguna selección salen flojos, se tunea la query acá.
const TEAM_QUERIES: Record<string, string> = {
  ARG: 'argentina soccer',
  BRA: 'brazil soccer',
  URU: 'uruguay soccer',
  PAR: 'paraguay soccer',
  COL: 'colombia soccer',
  ECU: 'ecuador soccer',
  MEX: 'mexico soccer',
  USA: 'usa soccer',
  CAN: 'canada soccer',
  FRA: 'france soccer',
  ESP: 'spain soccer',
  JPN: 'japan soccer',
};

interface GiphyRendition { url: string; width: string; height: string; mp4?: string; }
interface GiphyImages { fixed_height?: GiphyRendition; fixed_height_still?: GiphyRendition; }
interface GiphyGif { id: string; title: string; images: GiphyImages; }

interface Gif { id: string; title: string; mp4: string; poster: string; width: number; height: number; team: string; }

// cache por selección (no por tribu): cualquier combinación de tribu se arma
// combinando entradas ya cacheadas, así nunca pasamos de ~12 búsquedas por ventana.
// nota: cache en memoria, igual que el endpoint de bluesky; se pierde en cold start
// de vercel. migración a vercel kv está en el backlog técnico.
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas
const PER_TEAM = 6; // gifs que pedimos a giphy por selección
const teamCache = new Map<string, { gifs: Gif[]; expiresAt: number }>();

async function fetchTeamGifs(code: string, apiKey: string): Promise<{ gifs: Gif[]; error?: string }> {
  const query = TEAM_QUERIES[code];
  if (!query) return { gifs: [] };

  const url = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${PER_TEAM}&rating=pg`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { gifs: [], error: `giphy HTTP ${res.status}` };

    const data: { data: GiphyGif[] } = await res.json();
    const gifs: Gif[] = (data.data || [])
      .map(g => {
        const fh = g.images?.fixed_height;
        const still = g.images?.fixed_height_still;
        if (!fh?.mp4) return null;
        return { id: g.id, title: g.title || '', mp4: fh.mp4, poster: still?.url || '', width: Number(fh.width) || 0, height: Number(fh.height) || 200, team: code };
      })
      .filter((g): g is Gif => g !== null);
    return { gifs };
  } catch (e) {
    return { gifs: [], error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function GET(req: Request) {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ gifs: [], updatedAt: Date.now(), error: 'falta GIPHY_API_KEY' });
  }

  const { searchParams } = new URL(req.url);
  const teamsParam = searchParams.get('teams') || '';
  const refresh = searchParams.get('refresh') === 'true';
  const codes = teamsParam.split(',').map(c => c.trim().toUpperCase()).filter(c => TEAM_QUERIES[c]);
  const targetCodes = codes.length ? codes : Object.keys(TEAM_QUERIES);

  const now = Date.now();
  const debug: Array<{ team: string; source: string; count: number; error?: string }> = [];

  for (const code of targetCodes) {
    const cached = teamCache.get(code);
    if (!refresh && cached && cached.expiresAt > now) {
      debug.push({ team: code, source: 'cache', count: cached.gifs.length });
      continue;
    }
    const { gifs, error } = await fetchTeamGifs(code, apiKey);
    if (gifs.length) teamCache.set(code, { gifs, expiresAt: now + CACHE_TTL });
    debug.push({ team: code, source: 'giphy', count: gifs.length, error });
  }

  // round-robin: intercalamos selecciones para que no queden todas juntas, cap a 20
  const buckets = targetCodes.map(code => (teamCache.get(code)?.gifs ?? []).slice());
  const mixed: Gif[] = [];
  let added = true;
  while (added && mixed.length < 20) {
    added = false;
    for (const bucket of buckets) {
      const next = bucket.shift();
      if (next) { mixed.push(next); added = true; if (mixed.length >= 20) break; }
    }
  }

  return NextResponse.json({ gifs: mixed, updatedAt: now, debug });
}