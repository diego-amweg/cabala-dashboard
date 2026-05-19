'use client';

import { useEffect, useRef, useState } from 'react';

export interface TickerItem {
  city: string;
  text: string;
}

interface TickerProps {
  items: TickerItem[];
  speed?: number;
}

export default function Ticker({ items, speed = 40 }: TickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const touchStartRef = useRef<{ x: number; offset: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [touching, setTouching] = useState(false);

  const isPaused = hovered || touching;

  useEffect(() => {
    if (trackRef.current) {
      halfWidthRef.current = trackRef.current.scrollWidth / 2;
    }
  }, [items]);

  useEffect(() => {
    if (isPaused) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      offsetRef.current -= speed * dt;
      const half = halfWidthRef.current;
      if (half > 0 && offsetRef.current <= -half) {
        offsetRef.current += half;
      }
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPaused, speed]);

  const nudge = (deltaPx: number) => {
    offsetRef.current += deltaPx;
    const half = halfWidthRef.current;
    if (half > 0) {
      while (offsetRef.current <= -half) offsetRef.current += half;
      while (offsetRef.current > 0) offsetRef.current -= half;
    }
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${offsetRef.current}px)`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nudge(80);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nudge(-80);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, offset: offsetRef.current };
    setTouching(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const delta = e.touches[0].clientX - touchStartRef.current.x;
    let next = touchStartRef.current.offset + delta;
    const half = halfWidthRef.current;
    if (half > 0) {
      while (next <= -half) next += half;
      while (next > 0) next -= half;
    }
    offsetRef.current = next;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${next}px)`;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setTouching(false);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="touch-pan-y cursor-grab overflow-hidden rounded-xl border border-stone-200 bg-white py-2.5 outline-none focus:ring-2 focus:ring-orange-200 active:cursor-grabbing"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div ref={trackRef} className="flex whitespace-nowrap will-change-transform">
        {[...items, ...items].map((c, i) => (
          <span key={i} className="mr-8 inline-flex shrink-0 items-baseline gap-2 text-xs leading-relaxed">
            <span className="font-medium text-stone-700">{c.city}</span>
            <span className="text-stone-500">·</span>
            <span className="text-stone-600">{c.text}</span>
            <span className="ml-2 text-stone-300">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}