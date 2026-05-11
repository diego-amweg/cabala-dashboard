'use client';

export interface MemeItem {
  tag: 'meme' | 'polémica' | 'pelea' | 'viral' | 'noticia';
  text: string;
  when: string;
  url?: string;
  author?: string;
  imageUrl?: string;
}

const TAG_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  'meme':     { bg: '#fef3c7', fg: '#78350f', label: 'meme' },
  'polémica': { bg: '#fee2e2', fg: '#7f1d1d', label: 'polémica' },
  'pelea':    { bg: '#fee2e2', fg: '#7f1d1d', label: 'pelea' },
  'viral':    { bg: '#ede9fe', fg: '#4c1d95', label: 'viral' },
  'noticia':  { bg: '#dbeafe', fg: '#1e3a8a', label: 'noticia' },
};

export default function MemeCard({ item }: { item: MemeItem }) {
  const tc = TAG_COLORS[item.tag] || TAG_COLORS.viral;
  const authorClean = item.author?.replace('.bsky.social', '');

  const cardContent = (
    <>
      {item.imageUrl ? (
        <div className="relative h-32 w-full overflow-hidden bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          <span className="absolute left-1.5 top-1.5 rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wider shadow-sm" style={{ backgroundColor: tc.bg, color: tc.fg }}>
            {tc.label}
          </span>
        </div>
      ) : (
        <div className="relative flex h-32 w-full items-center justify-center" style={{ backgroundColor: tc.bg }}>
          <span className="text-xl font-bold uppercase tracking-widest" style={{ color: tc.fg, opacity: 0.4 }}>
            {tc.label}
          </span>
          <span className="absolute left-1.5 top-1.5 rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wider" style={{ backgroundColor: tc.bg, color: tc.fg, border: `1px solid ${tc.fg}33` }}>
            {tc.label}
          </span>
        </div>
      )}
      <div className="p-2.5">
        <p className="line-clamp-5 text-xs leading-snug text-stone-900">{item.text}</p>
        <p className="mt-1.5 truncate text-[10px] text-stone-500">@{authorClean}</p>
        <p className="text-[10px] text-stone-400">{item.when} · Bluesky</p>
      </div>
    </>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-60 shrink-0 snap-start overflow-hidden rounded-md border border-stone-100 transition-colors hover:bg-stone-50">
        {cardContent}
      </a>
    );
  }

  return (
    <div className="w-60 shrink-0 snap-start overflow-hidden rounded-md border border-stone-100">
      {cardContent}
    </div>
  );
}
