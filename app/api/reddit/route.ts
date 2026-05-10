import { NextResponse } from 'next/server';

interface RedditPost {
  data: {
    title: string;
    score: number;
    permalink: string;
    link_flair_text: string | null;
    created_utc: number;
    over_18: boolean;
    stickied: boolean;
    num_comments: number;
  };
}

interface RedditResponse {
  data: { children: RedditPost[] };
}

type Tag = 'meme' | 'polémica' | 'pelea' | 'viral';

interface FeedItem {
  tag: Tag;
  text: string;
  when: string;
  score: number;
  comments: number;
  url: string;
  sub: string;
}

function classify(title: string, flair: string | null): Tag {
  const t = title.toLowerCase();
  const f = (flair || '').toLowerCase();
  if (f.includes('meme') || f.includes('humor')) return 'meme';
  if (f.includes('controvers') || t.includes('var') || t.includes('referee') || t.includes('penalty') || t.includes('disallowed')) return 'polémica';
  if (t.includes('fight') || t.includes('brawl') || t.includes('clash')) return 'pelea';
  return 'viral';
}

function timeAgo(ts: number): string {
  const sec = Math.floor(Date.now() / 1000) - ts;
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

async function fetchSub(sub: string): Promise<{ items: FeedItem[]; status: number; error?: string; bodyPreview?: string }> {
  const url = `https://www.reddit.com/r/${sub}/hot.json?limit=20`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; cabala-dashboard/0.1; +https://github.com/diego-amweg/cabala-dashboard)',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return { items: [], status: res.status, error: `HTTP ${res.status}`, bodyPreview: text.slice(0, 200) };
    }
    const data: RedditResponse = await res.json();
    const items: FeedItem[] = [];
    for (const post of data.data.children) {
      if (post.data.stickied || post.data.over_18) continue;
      items.push({
        tag: classify(post.data.title, post.data.link_flair_text),
        text: post.data.title,
        when: timeAgo(post.data.created_utc),
        score: post.data.score,
        comments: post.data.num_comments,
        url: `https://www.reddit.com${post.data.permalink}`,
        sub,
      });
    }
    return { items, status: 200 };
  } catch (e) {
    return { items: [], status: 0, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function GET() {
  const subs = ['soccer', 'worldcup'];
  const all: FeedItem[] = [];
  const debug: Array<{ sub: string; status: number; count: number; error?: string; bodyPreview?: string }> = [];

  for (const sub of subs) {
    const result = await fetchSub(sub);
    debug.push({
      sub,
      status: result.status,
      count: result.items.length,
      error: result.error,
      bodyPreview: result.bodyPreview,
    });
    all.push(...result.items);
  }

  all.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    items: all.slice(0, 8),
    updatedAt: Date.now(),
    debug,
  });
}
