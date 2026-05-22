'use client';

import { useEffect, useRef, useState } from 'react';

interface Gif { id: string; title: string; mp4: string; poster: string; width: number; height: number; team: string; }

function GifTile({ gif }: { gif: Gif }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting) { setLoad(true); videoRef.current?.play().catch(() => {}); }
        else { videoRef.current?.pause(); }
      },
      { rootMargin: '300px', threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-44 shrink-0 snap-start overflow-hidden rounded-md border border-stone-100 bg-stone-100">
      <video ref={videoRef} src={load ? gif.mp4 : undefined} poster={gif.poster || undefined} autoPlay muted loop playsInline preload="none" className="h-32 w-full object-cover" />
    </div>
  );
}

export default function GifWall({ tribe }: { tribe: string[] }) {
  const teamsKey = [...tribe].sort().join(',');
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gifs?teams=${encodeURIComponent(teamsKey)}`);
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (cancelled) return;
        if (data.gifs && data.gifs.length > 0) { setGifs(data.gifs); setError(false); }
        else { setError(true); }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [teamsKey]);

  let content;
  if (loading) content = <p className="px-2 text-xs text-stone-400">trayendo gifs...</p>;
  else if (error) content = <p className="px-2 text-xs text-stone-400">no se pudieron traer gifs por ahora.</p>;
  else content = (
    <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 snap-x">
      {gifs.map(g => <GifTile key={g.id} gif={g} />)}
    </div>
  );

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      {content}
      <div className="mt-2 flex items-center justify-end gap-1.5 px-1"><span className="text-[10px] text-stone-400">powered by</span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/giphy-logo.svg" alt="GIPHY" className="h-3 w-auto" /></div>
    </div>
  );
}