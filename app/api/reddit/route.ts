import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';

interface BlueskyEmbedImages {
  $type: 'app.bsky.embed.images#view';
  images: Array<{ thumb: string; fullsize: string; alt?: string }>;
}

interface BlueskyEmbedExternal {
  $type: 'app.bsky.embed.external#view';
  external: { uri: string; title: string; description: string; thumb?: string };
}

type BlueskyEmbed = BlueskyEmbedImages | BlueskyEmbedExternal | { $type: string };

interface BlueskyPost {
  uri: string;
  cid: string;
  author: { did: string; handle: string; displayName?: string };
  record: { text: string; createdAt: string };
  indexedAt: string;
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
  embed?: BlueskyEmbed;
}

type Tag = 'meme' | 'polémica' | 'pelea' | 'viral' | 'noticia';

interface FeedItem {
  tag: Tag;
  text: string;
  originalText?: string;
  when: string;
  score: number;
  relevance?: number;
  url: string;
  author: string;
  query: string;
  imageUrl?: string;
}

// el token de bluesky se cachea en redis (persiste entre cold starts). el enhancementCache
// queda en memoria a propósito: son muchas claves por url y el costo en redis no rinde.
const enhancementCache = new Map<string, { keep: boolean; tag: Tag; text: string; relevance: number }>();

async function getJWT(): Promise<{ jwt: string | null; error?: string }> {
  const cached = await cacheGet<string>('bluesky:jwt');
  if (cached) return { jwt: cached };

  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) return { jwt: null, error: 'env vars BLUESKY_HANDLE o BLUESKY_APP_PASSWORD faltantes' };

  try {
    const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password }),
      cache: 'no-store',
    });

    if (!res.ok) return { jwt: null, error: `auth HTTP ${res.status}` };
    const data = await res.json();
    if (!data.accessJwt) return { jwt: null, error: 'response sin accessJwt' };

    // ttl 13 min, un poco menos que la expiración real del token para tener margen
    await cacheSet('bluesky:jwt', data.accessJwt, 13 * 60);
    return { jwt: data.accessJwt };
  } catch (e) {
    return { jwt: null, error: e instanceof Error ? e.message : 'unknown' };
  }
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

function postToUrl(post: BlueskyPost): string {
  const rkey = post.uri.split('/').pop();
  return `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;
}

function extractImage(embed?: BlueskyEmbed): string | undefined {
  if (!embed) return undefined;
  if (embed.$type === 'app.bsky.embed.images#view') {
    const e = embed as BlueskyEmbedImages;
    return e.images?.[0]?.thumb;
  }
  if (embed.$type === 'app.bsky.embed.external#view') {
    const e = embed as BlueskyEmbedExternal;
    return e.external?.thumb;
  }
  return undefined;
}

async function searchQuery(query: string, jwt: string): Promise<{ items: FeedItem[]; status: number; error?: string }> {
  const url = `https://bsky.social/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=25&sort=top`;
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${jwt}` }, cache: 'no-store' });
    if (!res.ok) return { items: [], status: res.status, error: `HTTP ${res.status}` };

    const data: { posts: BlueskyPost[] } = await res.json();
    const items: FeedItem[] = (data.posts || []).map(post => {
      const score = (post.likeCount || 0) + (post.repostCount || 0) * 2 + (post.replyCount || 0);
      return {
        tag: 'viral',
        text: post.record.text,
        when: timeAgo(post.indexedAt || post.record.createdAt),
        score,
        url: postToUrl(post),
        author: post.author.handle,
        query,
        imageUrl: extractImage(post.embed),
      };
    });
    return { items, status: 200 };
  } catch (e) {
    return { items: [], status: 0, error: e instanceof Error ? e.message : 'unknown' };
  }
}

async function enhanceWithClaude(posts: FeedItem[]): Promise<{ enhanced: FeedItem[]; status: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { enhanced: posts, status: 'no api key' };
  if (posts.length === 0) return { enhanced: posts, status: 'no posts' };

  const toProcess = posts.filter(p => !enhancementCache.has(p.url));

  if (toProcess.length > 0) {
    const prompt = `Sos un editor que filtra, clasifica y traduce posts sobre el Mundial de Fútbol 2026 para Cábala, una plataforma argentina para vivirlo con pasión futbolera.

OBJETIVO: dejar pasar SOLO contenido del Mundial como FÚTBOL y FIESTA — memes, polémicas deportivas, peleas de hinchas, virales emocionales y noticias concretas del torneo.

Posts:
${toProcess.map((p, i) => `[${i}] ${p.text.slice(0, 400)}`).join('\n\n')}

Devolvé un array JSON (sin texto adicional, sin markdown), un objeto por post en el mismo orden:
{ "i": <índice>, "keep": true|false, "tag": "meme"|"polémica"|"pelea"|"viral"|"noticia", "es": "<traducción al español rioplatense, máximo 280 caracteres>", "rel": <0-100> }

DEJAR PASAR (keep: true) con su tag:
- "meme": humor, chistes, parodias, ironía sobre el fútbol del Mundial
- "polémica": SOLO polémica DEPORTIVA — árbitros, VAR, decisiones de juego, quejas futbolísticas
- "pelea": cruces entre hinchas o cuentas, peleas en redes por fútbol
- "viral": contenido masivo de impacto emocional futbolístico (festejos, hinchadas, momentos)
- "noticia": información concreta del torneo (plantel, fixture, sedes, fechas)

RECHAZAR (keep: false):
- Política y activismo: protestas, inmigración, ICE, crítica al país anfitrión, "el mundial no debería venir", geopolítica, derechos civiles
- Crítica institucional o política a la FIFA (corrupción, negocios, gobernanza, derechos humanos). OJO: las quejas DEPORTIVAS por arbitraje, VAR o decisiones de juego SÍ van, como "polémica"
- Posts vacíos, sin sustancia, que no dicen nada concreto
- Contenido no futbolístico, o que usa el hashtag del Mundial solo de relleno
- Promoción, venta de entradas, sorteos, spam
- Idiomas que no sean español, inglés ni portugués

Reglas:
- Si keep es false, igual completá tag/es/rel con cualquier valor: se descartan después
- "rel": qué tan imperdible es para vivir el Mundial con pasión (0-100)
- Si el post ya está en español, copialo en "es" igual o ligeramente acomodado, máximo 280 caracteres`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
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
        const errText = await res.text();
        return { enhanced: posts, status: `claude HTTP ${res.status}: ${errText.slice(0, 100)}` };
      }

      const data = await res.json();
      const text = data.content[0].text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return { enhanced: posts, status: 'no json in response' };

      const enhancements: Array<{ i: number; keep: boolean; tag: Tag; es: string; rel: number }> = JSON.parse(jsonMatch[0]);
      enhancements.forEach(e => {
        const post = toProcess[e.i];
        if (post) {
          enhancementCache.set(post.url, { keep: !!e.keep, tag: e.tag, text: e.es, relevance: e.rel });
        }
      });
    } catch (e) {
      return { enhanced: posts, status: e instanceof Error ? e.message : 'unknown' };
    }
  }

  // armamos el resultado desde el cache, descartando los keep:false
  const enhanced: FeedItem[] = [];
  let kept = 0, rejected = 0;
  for (const p of posts) {
    const c = enhancementCache.get(p.url);
    if (!c) { enhanced.push(p); continue; }   // si no se pudo clasificar, lo dejamos por las dudas
    if (!c.keep) { rejected++; continue; }
    kept++;
    enhanced.push({ ...p, tag: c.tag, originalText: p.text, text: c.text, relevance: c.relevance });
  }

  return { enhanced, status: `kept ${kept}, rejected ${rejected}` };
}

export async function GET() {
  const { jwt, error: authError } = await getJWT();
  if (!jwt) {
    return NextResponse.json({ items: [], updatedAt: Date.now(), debug: [{ step: 'auth', error: authError }] });
  }

  // texto + hashtags reales del mundial. los hashtags capturan posts tageados que las
  // queries de texto sueltas no agarran. ojo: en bluesky el volumen es menor que en x;
  // el array debug de la respuesta muestra el count de cada query para ver cuál rinde.
  const queries = ['mundial 2026', 'world cup 2026', 'fifa worldcup', '#Mundial2026', '#WorldCup2026', '#Somos26'];
  const all: FeedItem[] = [];
  const debug: Array<{ step: string; query?: string; status?: number | string; count?: number; error?: string }> = [
    { step: 'auth', status: 200 },
  ];

  // en paralelo para que sumar queries no alargue la latencia del módulo
  const results = await Promise.all(queries.map(q => searchQuery(q, jwt)));
  results.forEach((result, i) => {
    debug.push({ step: 'search', query: queries[i], status: result.status, count: result.items.length, error: result.error });
    all.push(...result.items);
  });

  const seen = new Set<string>();
  const unique = all.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // clasificamos un pool más grande (25): el filtro va a descartar varios (política, ruido),
  // y queremos que igual queden ~12 buenos
  const candidates = unique.sort((a, b) => b.score - a.score).slice(0, 25);

  const { enhanced, status: enhanceStatus } = await enhanceWithClaude(candidates);
  debug.push({ step: 'enhance', status: enhanceStatus });

  const top = enhanced.sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0)).slice(0, 12);

  return NextResponse.json({ items: top, updatedAt: Date.now(), debug });
}
