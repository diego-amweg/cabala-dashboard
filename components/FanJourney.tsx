'use client';

import { useState, useEffect } from 'react';

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

const TAG_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  'vlog':         { bg: '#ffedd5', fg: '#9a3412', label: 'vlog' },
  'tour':         { bg: '#dbeafe', fg: '#1e3a8a', label: 'tour' },
  'preparacion':  { bg: '#fef3c7', fg: '#78350f', label: 'preparación' },
  'experiencia':  { bg: '#dcfce7', fg: '#14532d', label: 'experiencia' },
};

export default function FanJourney() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/journey');
        const data = await res.json();
        if (cancelled) return;

        if (data.items && data.items.length > 0) {
          setVideos(data.items);
          setError(null);
        } else {
          setError(data.error || 'sin videos por ahora');
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'unknown');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVideos();
    const refresh = setInterval(fetchVideos, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-xs text-stone-400">buscando vlogs de hinchas viajando...</p>
      </div>
    );
  }

  if (error || videos.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-xs text-stone-400">{error || 'sin videos por ahora'}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {videos.map(v => {
          const tc = v.tag ? TAG_COLORS[v.tag] : null;
          return (
            <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="flex gap-2 rounded-md p-2 transition-colors hover:bg-stone-50">
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  {tc && (
                    <span className="shrink-0 rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wider" style={{ backgroundColor: tc.bg, color: tc.fg }}>
                      {tc.label}
                    </span>
                  )}
                  <p className="line-clamp-2 text-xs leading-snug text-stone-900">{v.title}</p>
                </div>
                <p className="mt-1 text-[10px] text-stone-500">{v.channel}</p>
                <p className="text-[10px] text-stone-400">{v.when} · YouTube</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
