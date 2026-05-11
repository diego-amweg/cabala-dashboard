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
}

const cache = new Map<string, { data: VideoItem[]; cachedAt: number }>();
const CACHE_TTL = 30 * 60 * 1000;

const QUERIES = [
  'vlog mundial 2026',
  'viaje al mundial 2026',
  'mundial 2026 hincha',
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
    maxResults: '10',
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

  const all: VideoItem[] = [];
  const debug: Array<{ query: string; status: number; count: number; error?: string }> = [];

  for (const q of QUERIES) {
    const result = await searchYouTube(q, apiKey);
    debug.push({ query: q, status: result.status, count: result.items.length, error: result.error });
    all.push(...result.items);
  }

  const seen = new Set<string>();
  const unique = all.filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });

  unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const top = unique.slice(0, 12);
  cache.set(cacheKey, { data: top, cachedAt: Date.now() });

  return NextResponse.json({ items: top, updatedAt: Date.now(), cached: false, debug });
}
