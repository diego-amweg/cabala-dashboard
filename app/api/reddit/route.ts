import { NextResponse } from 'next/server';

interface BlueskyPost {
  uri: string;
  cid: string;
  author: { did: string; handle: string; displayName?: string };
  record: { text: string; createdAt: string };
  indexedAt: string;
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
}

type Tag = 'meme' | 'polémica' | 'pelea' | 'viral';

interface FeedItem {
  tag: Tag;
  text: string;
  when: string;
  score: number;
  url: string;
  author: string;
  query: string;
}

let cachedJwt: { jwt: string; expiresAt: number } | null = null;

async function getJWT(): Promise<{ jwt: string | null; error?: string }> {
  if (cachedJwt && cachedJwt.expiresAt > Date.now()) {
    return { jwt: cachedJwt.jwt };
  }

  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!handle || !password) {
    return { jwt: null, error: 'env vars BLUESKY_HANDLE o BLUESKY_APP_PASSWORD faltantes en Vercel' };
  }

  try {
    const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return { jwt: null, error: `auth HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json();
    if (!data.accessJwt) {
      return { jwt: null, error: 'response sin accessJwt' };
    }

    cachedJwt = {
      jwt: data.accessJwt,
      expiresAt: Date.now() + 14 * 60 * 1000,
    };

    return { jwt: cachedJwt.jwt };
  } catch (e) {
    return { jwt: null, error: e instanceof Error ? e.message : 'unknown' };
  }
}

function classify(text: string): Tag {
  const t = text.toLowerCase();
  if (/😂|🤣|💀|🤡/.test(text) || t.includes('jaja') || t.includes(' lol') || t.includes('meme')) return 'meme';
  if (t.includes('var') || t.includes('árbitro') || t.includes('arbitro') || t.includes('penal') || t.includes('referee')) return 'polémica';
  if (t.includes('pelea') || t.includes('fight') || t.includes('insult')) return 'pelea';
  return 'viral';
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

async function searchQuery(query: string, jwt: string): Promise<{ items: FeedItem[]; status: number; error?: string }> {
  const url = `https://bsky.social/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=25&sort=top`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${jwt}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return { items: [], status: res.status, error: `HTTP ${res.status}: ${text.slice(0, 150)}` };
    }

    const data: { posts: BlueskyPost[] } = await res.json();
    const items: FeedItem[] = (data.posts || []).map(post => {
      const score = (post.likeCount || 0) + (post.repostCount || 0) * 2 + (post.replyCount || 0);
      return {
        tag: classify(post.record.text),
        text: post.record.text,
        when: timeAgo(post.indexedAt || post.record.createdAt),
        score,
        url: postToUrl(post),
        author: post.author.handle,
        query,
      };
    });

    return { items, status: 200 };
  } catch (e) {
    return { items: [], status: 0, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function GET() {
  const { jwt, error: authError } = await getJWT();

  if (!jwt) {
    return NextResponse.json({
      items: [],
      updatedAt: Date.now(),
      debug: [{ step: 'auth', error: authError }],
    });
  }

  const queries = ['mundial 2026', 'world cup 2026', 'fifa worldcup'];
  const all: FeedItem[] = [];
  const debug: Array<{ step: string; query?: string; status?: number; count?: number; error?: string }> = [
    { step: 'auth', status: 200 },
  ];

  for (const q of queries) {
    const result = await searchQuery(q, jwt);
    debug.push({
      step: 'search',
      query: q,
      status: result.status,
      count: result.items.length,
      error: result.error,
    });
    all.push(...result.items);
  }

  const seen = new Set<string>();
  const unique = all.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  unique.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    items: unique.slice(0, 12),
    updatedAt: Date.now(),
    debug,
  });
}
