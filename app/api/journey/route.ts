import { NextResponse } from 'next/server';

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    channelTitle: string;
  };
}

interface VideoItem {
  id: string;
  title: string;
  channel: string;
  channelId: string;
  publishedAt: string;
  when: string;
  thumbnail: string;
  url: string;
  query: string;
  tag?: string;
  keepReason?: string;
}

const cache = new Map<string, { data: VideoItem[]; cachedAt: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000;     // 6h para resultados con videos (search.list cuesta 100u; cuota diaria 10k)
const EMPTY_CACHE_TTL = 10 * 60 * 1000;   // 10min para vacíos: reintenta pronto sin martillar la api

const QUERIES = [
  'rumbo al mundial 2026 vlog',
  'viaje al mundial 2026 hincha',
  'visite ciudad mundial 2026',
  'argentinos en mundial 2026',
];

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

async function searchYouTube(query: string, apiKey: string): Promise<{ items: VideoItem[]; status: number; error?: string }> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    order: 'date',
    maxResults: '15',
    relevanceLanguage: 'es',
    key: apiKey,
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text();
      return { items: [], status: res.status, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    const data: { items: YouTubeSearchItem[] } = await res.json();
    const items: VideoItem[] = (data.items || []).map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      when: timeAgo(item.snippet.publishedAt),
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      query,
    }));

    return { items, status: 200 };
  } catch (e) {
    return { items: [], status: 0, error: e instanceof Error ? e.message : 'unknown' };
  }
}

interface ClaudeClassification {
  i: number;
  keep: boolean;
  tag?: string | null;
  reason: string;
}

const VALID_TAGS = new Set(['vlog', 'tour', 'preparacion', 'experiencia']);

async function classifyWithClaude(videos: VideoItem[], anthropicKey: string): Promise<{ classifications: Map<string, { keep: boolean; tag?: string; reason: string }>; error?: string }> {
  if (videos.length === 0) return { classifications: new Map() };

  const videoList = videos.map((v, i) => `${i}. "${v.title}" — canal: ${v.channel}`).join('\n');

  const prompt = `Estás filtrando y etiquetando videos de YouTube para el módulo "Viaje del hincha" en Cábala, plataforma de Diego (argentino) para vivir el Mundial 2026 FIFA desde su casa.

OBJETIVO: dejar pasar videos que ayuden a Diego a vivir VICARIAMENTE el viaje al Mundial — sea de hinchas reales viajando, gente recorriendo las ciudades sede, o mostrando la experiencia de asistir.

DEJAR PASAR (keep: true) con su tag apropiado:
- "vlog" → un hincha real documentando su viaje al Mundial 2026 en primera persona
- "tour" → recorrido por una ciudad sede mostrando estadio, ambiente, lugares (aunque lo haga un youtuber de viajes, no un hincha)
- "preparacion" → comprar entradas, planear el viaje, logística, hospedaje, transporte
- "experiencia" → historias de hinchas (ganar viajes, despedidas, encuentros, anécdotas vinculadas al Mundial)

RECHAZAR (keep: false):
- Análisis táctico, predicciones, debates sobre selecciones, opiniones sobre jugadores
- Prelistas, convocatorias, anuncios de plantel
- Reacciones a partidos, eliminatorias, eliminaciones
- Abrir sobres, cromos, álbumes Panini, figuritas, stickers
- "Mundial 2026" de competencias que NO son fútbol FIFA (perros, robots, religioso, etc.)
- Canciones, himnos, dance challenges, contenido de hashtag/shorts sin sustancia
- Análisis económico, periodístico, arquitectónico sin viaje real involucrado
- Mundial de Clubes (es otro torneo distinto)
- Contenido en idiomas que no son español ni portugués

Lista de videos a evaluar:
${videoList}

Devolvé SOLO un array JSON (sin markdown, sin texto antes o después), una entrada por cada video, en orden:

[{"i": 0, "keep": true, "tag": "tour", "reason": "tour por Filadelfia sede"}, {"i": 1, "keep": false, "tag": null, "reason": "predicción de campeón"}]

Reglas estrictas:
- El campo "tag" SOLO cuando "keep" es true. Si keep es false, tag = null
- Los valores válidos de tag son: "vlog", "tour", "preparacion", "experiencia"
- "reason" siempre breve, máximo 8 palabras`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { classifications: new Map(), error: `claude HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json();
    const responseText: string = data.content[0].text.trim();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { classifications: new Map(), error: 'no se pudo extraer array json' };
    }

    let parsed: ClaudeClassification[];
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return { classifications: new Map(), error: 'json invalido en respuesta de claude' };
    }

    const result = new Map<string, { keep: boolean; tag?: string; reason: string }>();
    parsed.forEach(c => {
      if (typeof c.i === 'number' && c.i < videos.length) {
        const tag = c.tag && VALID_TAGS.has(c.tag) ? c.tag : undefined;
        result.set(videos[c.i].id, { keep: !!c.keep, tag, reason: c.reason || '' });
      }
    });

    return { classifications: result };
  } catch (e) {
    return { classifications: new Map(), error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get('refresh') === 'true';

const cacheKey = 'all';
const cached = cache.get(cacheKey);
 if (!forceRefresh && cached) {
   // un resultado con videos vale 6h; uno vacío (cuota agotada o fallo) caduca a los 10min
   // para reintentar pronto en vez de servir un vacío pegado
   const ttl = cached.data.length > 0 ? CACHE_TTL : EMPTY_CACHE_TTL;
   if (Date.now() - cached.cachedAt < ttl) {
     return NextResponse.json({ items: cached.data, updatedAt: cached.cachedAt, cached: true });
    }
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ items: [], error: 'env var YOUTUBE_API_KEY faltante en vercel' });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const all: VideoItem[] = [];
  const searchDebug: Array<{ query: string; status: number; raw: number; error?: string }> = [];

  for (const q of QUERIES) {
    const result = await searchYouTube(q, apiKey);
    searchDebug.push({ query: q, status: result.status, raw: result.items.length, error: result.error });
    all.push(...result.items);
  }

  const seen = new Set<string>();
  const unique = all.filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  let filtered: VideoItem[] = unique;
  let classificationDebug: { used: boolean; error?: string; total: number; kept: number; tagBreakdown: Record<string, number>; rejected: Array<{ title: string; reason: string }> } = {
    used: false,
    total: unique.length,
    kept: unique.length,
    tagBreakdown: {},
    rejected: [],
  };

  if (anthropicKey && unique.length > 0) {
    const { classifications, error } = await classifyWithClaude(unique, anthropicKey);
    if (error || classifications.size === 0) {
      classificationDebug = { ...classificationDebug, used: false, error: error || 'sin clasificaciones' };
    } else {
      const kept: VideoItem[] = [];
      const rejected: Array<{ title: string; reason: string }> = [];
      const tagBreakdown: Record<string, number> = {};
      for (const v of unique) {
        const c = classifications.get(v.id);
        if (c && c.keep) {
          kept.push({ ...v, tag: c.tag, keepReason: c.reason });
          const t = c.tag || 'sin tag';
          tagBreakdown[t] = (tagBreakdown[t] || 0) + 1;
        } else if (c) {
          rejected.push({ title: v.title, reason: c.reason });
        }
      }
      filtered = kept;
      classificationDebug = { used: true, total: unique.length, kept: kept.length, tagBreakdown, rejected };
    }
  }

  filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const top = filtered.slice(0, 12);
  cache.set(cacheKey, { data: top, cachedAt: Date.now() });

  return NextResponse.json({
    items: top,
    updatedAt: Date.now(),
    cached: false,
    debug: { search: searchDebug, classification: classificationDebug },
  });
}
