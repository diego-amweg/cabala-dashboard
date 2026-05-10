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

  if (f.includes('meme') || f.includes('humor') || /😂|🤣|💀|🤡/.test(title)) return 'meme';
  if (f.includes('controvers') || t.includes('var') || t.includes('referee') || t.includes('penalty') || t.includes('disallowed')) return 'polémica';
  if (t.includes('fight') || t.includes('brawl') || t.includes('clash') || t.includes('argument')) return 'pelea';
  return 'viral';
}

function timeAgo(ts: number): string {
  const sec = Math.floor(Date.now() / 1000) - ts;
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

export async function GET() {
  try {
    const subs = ['soccer', 'worldcup'];
    const results: FeedItem[] = [];

    for (const sub of subs) {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=20`, {
        headers: {
          'User-Agent': 'cabala-dashboard/0.1 (https://github.com/diego-amweg/cabala-dashboard)',
        },
        next: { revalidate: 300 },
      });

      if (!res.ok) continue;

      const data: RedditResponse = await res.json();

      for (const post of data.data.children) {
        if (post.data.stickied || post.data.over_18) continue;
        results.push({
          tag: classify(post.data.title, post.data.link_flair_text),
          text: post.data.title,
          when: timeAgo(post.data.created_utc),
          score: post.data.score,
          comments: post.data.num_comments,
          url: `https://www.reddit.com${post.data.permalink}`,
          sub,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      items: results.slice(0, 8),
      updatedAt: Date.now(),
    });
  } catch {
    return NextResponse.json({ items: [], error: 'fetch failed' }, { status: 500 });
  }
}
