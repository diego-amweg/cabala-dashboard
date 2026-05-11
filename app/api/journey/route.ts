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
  keepReason?: string;
}

const cache = new Map<string, { data: VideoItem[]; cachedAt: number }>();
const CACHE_TTL = 30 * 60 * 1000;

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
  reason: string;
}

async function classifyWithClaude(videos: VideoItem[], anthropicKey: string): Promise<{ classifications: Map<string, { keep: boolean; reason: string }>; error?: string }> {
  if (videos.length === 0) return { classifications: new Map() };

  const videoList = videos.map((v, i) => `${i}. "${v.title}" — canal: ${v.channel}`).join('\n');

  const prompt = `Estás filtrando videos de YouTube para un módulo llamado "Viaje del hincha" en Cábala, plataforma personal para Diego (argentino) que vive el Mundial 2026 de fútbol FIFA desde su casa.

OBJETIVO ESTRICTO: dejar pasar SOLO videos donde un hincha de fútbol está VIAJANDO al Mundial 2026 o documentando experiencias relacionadas con asistir presencialmente al torneo.

DEJAR PASAR (keep: true):
- Vlog real de un hincha que ya viajó o está viajando a EEUU, Canadá o México por el Mundial
- Recorrido (tour) de una ciudad sede del Mundial 2026 mostrando estadio, fan zones, ambiente
- Experiencia de comprar entradas, prepararse para el viaje, mostrar la logística
- Hincha hablando de su viaje futuro al Mundial 2026 con planes concretos

RECHAZAR (keep: false):
- Análisis táctico, opiniones sobre selecciones, debates sobre formaciones
- Predicciones de campeón, "quién va a ganar"
- Reacciones a partidos (de cualquier competencia)
- Abrir sobres, cromos, álbumes Panini, stickers (en cualquier idioma o forma)
- "Mundial 2026" de competencias que NO son fútbol FIFA (campeonatos de perros, robótica, etc.)
- Festivales o eventos que no son fútbol
- Dance challenges, shorts de hashtag spam sin contenido real
- Análisis de jugadores específicos sin viaje real
- Contenido en idiomas que no son español o portugués

Lista de videos a evaluar:
${videoList}

Devolvé SOLO un array JSON (sin markdown, sin texto antes o después) con una entrada por cada video, en orden:

[{"i": 0, "keep": true, "reason": "vlog real de viaje a Filadelfia"}, {"i": 1, "keep": false, "reason": "predicción de campeón"}, ...]

El campo "reason" tiene que ser muy breve (máximo 8 palabras).`;

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

    const result = new Map<string, { keep: boolean; reason: string }>();
    parsed.forEach(c => {
      if (typeof c.i === 'number' && c.i < videos.length) {
        result.set(videos[c.i].id, { keep: !!c.keep, reason: c.reason || '' });
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
  if (!forceRefresh && cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return NextResponse.json({ items: cached.data, updatedAt: cached.cachedAt, cached: true });
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
  let classificationDebug: { used: boolean; error?: string; total: number; kept: number; rejected: Array<{ title: string; reason: string }> } = {
    used: false,
    total: unique.length,
    kept: unique.length,
    rejected: [],
  };

  if (anthropicKey && unique.length > 0) {
    const { classifications, error } = await classifyWithClaude(unique, anthropicKey);
    if (error || classifications.size === 0) {
      classificationDebug = { ...classificationDebug, used: false, error: error || 'sin clasificaciones' };
    } else {
      const kept: VideoItem[] = [];
      const rejected: Array<{ title: string; reason: string }> = [];
      for (const v of unique) {
        const c = classifications.get(v.id);
        if (c && c.keep) {
          kept.push({ ...v, keepReason: c.reason });
        } else if (c) {
          rejected.push({ title: v.title, reason: c.reason });
        }
      }
      filtered = kept;
      classificationDebug = { used: true, total: unique.length, kept: kept.length, rejected };
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
