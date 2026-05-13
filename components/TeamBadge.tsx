'use client';

import { useEffect, useState } from 'react';

interface TeamData {
  code: string;
  name: string;
  badgeUrl: string | null;
}

interface Props {
  code: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-16 w-16',
};

const cache = new Map<string, TeamData>();
const pending = new Map<string, Promise<TeamData | null>>();

async function loadTeam(code: string): Promise<TeamData | null> {
  if (cache.has(code)) return cache.get(code)!;
  if (pending.has(code)) return pending.get(code)!;

  const promise = fetch(`/api/national-team/${code}`)
    .then(r => (r.ok ? r.json() : null))
    .then((d: TeamData | null) => {
      if (d) cache.set(code, d);
      pending.delete(code);
      return d;
    })
    .catch(() => {
      pending.delete(code);
      return null;
    });

  pending.set(code, promise);
  return promise;
}

export default function TeamBadge({ code, size = 'sm' }: Props) {
  const [data, setData] = useState<TeamData | null>(cache.get(code) ?? null);

  useEffect(() => {
    let active = true;
    loadTeam(code).then(d => {
      if (active && d) setData(d);
    });
    return () => { active = false; };
  }, [code]);

  if (data?.badgeUrl) {
    return <img src={data.badgeUrl} alt={data.name} className={`${SIZES[size]} object-contain`} />;
  }

  return <div className={`${SIZES[size]} rounded bg-stone-100`} aria-hidden="true" />;
}
