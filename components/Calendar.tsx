'use client';

import { useEffect, useState } from 'react';

interface FixtureItem {
  id: string;
  date: string;
  time: string;
  home: string;
  away: string;
  phase: string;
  venue: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  'live':      { bg: '#ffedd5', fg: '#9a3412', label: 'live' },
  'finished':  { bg: '#e7e5e4', fg: '#44403c', label: 'final' },
  'scheduled': { bg: '#f5f5f4', fg: '#78716c', label: 'programado' },
};

const DAY_COLORS = ['#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#f87171'];

function groupByDate(fixtures: FixtureItem[]): { date: string; items: FixtureItem[]; isLive: boolean }[] {
  const groups = new Map<string, FixtureItem[]>();
  fixtures.forEach(f => {
    if (!groups.has(f.date)) groups.set(f.date, []);
    groups.get(f.date)!.push(f);
  });
  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    items,
    isLive: items.some(i => i.status === 'live'),
  }));
}

export default function Calendar() {
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/fixtures');
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.items) && data.items.length > 0) {
          setFixtures(data.items);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">cargando el fixture…</div>;
  }

  if (error || fixtures.length === 0) {
    return <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">el fixture no está disponible por ahora. probá de nuevo en un rato.</div>;
  }

  const groups = groupByDate(fixtures);
  let colorIdx = 0;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
        {groups.map(group => {
          const dotColor = group.isLive ? '#fb923c' : DAY_COLORS[colorIdx % DAY_COLORS.length];
          if (!group.isLive) colorIdx++;

          return (
            <div key={group.date}>
              <div className="mb-1.5 flex items-center gap-2 border-b border-stone-100 pb-1">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${group.isLive ? 'text-orange-900' : 'text-stone-700'}`}>{group.date}</span>
                {group.isLive && <span className="text-[9px] uppercase tracking-wider text-orange-700">hoy</span>}
                <span className="ml-auto text-[10px] text-stone-400">{group.items.length} {group.items.length === 1 ? 'partido' : 'partidos'}</span>
              </div>
              <div className="space-y-0.5">
                {group.items.map(f => {
                  const st = STATUS_STYLES[f.status];
                  const showScore = f.status !== 'scheduled' && f.homeScore !== undefined && f.awayScore !== undefined;
                  return (
                    <div key={f.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-stone-50">
                      <div className="w-10 shrink-0 font-mono tabular-nums text-stone-600">{f.time}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-stone-900">
                          <span className="font-medium">{f.home}</span>
                          {showScore ? (<span className="mx-1.5 font-mono tabular-nums text-stone-700">{f.homeScore}-{f.awayScore}</span>) : (<span className="mx-1.5 text-stone-400">vs</span>)}
                          <span className="font-medium">{f.away}</span>
                        </div>
                        <div className="truncate text-[10px] text-stone-500">{f.phase}{f.venue ? ` · ${f.venue}` : ''}</div>
                      </div>
                      <span className="shrink-0 rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wider" style={{ backgroundColor: st.bg, color: st.fg }}>
                        {f.status === 'live' && <span className="mr-1 inline-block h-1 w-1 animate-pulse rounded-full" style={{ backgroundColor: st.fg }} />}
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[9px] italic text-stone-400">fixture oficial del mundial · los resultados se actualizan durante el torneo</p>
    </div>
  );
}