'use client';

import { useEffect, useState } from 'react';

interface TeamRow {
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface Group {
  letter: string;
  table: TeamRow[];
}

export default function GroupStage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const MAX_TRIES = 4;
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    (async () => {
      for (let attempt = 1; attempt <= MAX_TRIES && !cancelled; attempt++) {
        try {
          const res = await fetch('/api/standings');
          const data = await res.json();
          if (cancelled) return;
          if (Array.isArray(data.groups) && data.groups.length > 0) {
            setGroups(data.groups);
            setError(false);
            setLoading(false);
            return;
          }
        } catch {
          // sin conexión o error: caemos al reintento
        }
        if (attempt < MAX_TRIES && !cancelled) await wait(attempt * 2000); // 2s, 4s, 6s
      }
      if (!cancelled) { setError(true); setLoading(false); }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="rounded-md border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">cargando los grupos…</div>;
  }

  if (error || groups.length === 0) {
    return <div className="rounded-md border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">los grupos no están disponibles por ahora.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {groups.map(group => (
        <div key={group.letter} className="rounded-md border border-stone-200 bg-white p-3">
          <div className="mb-2 flex items-baseline justify-between border-b border-stone-100 pb-1.5">
            <span className="text-xs font-semibold tracking-wider text-stone-900">GRUPO {group.letter}</span>
            <span className="text-[9px] text-stone-400">6 partidos</span>
          </div>
          <div className="mb-1 flex items-center gap-2 text-[8px] uppercase tracking-wider text-stone-300">
            <span className="w-4" />
            <span className="flex-1">equipo</span>
            <span>pj</span>
            <span className="w-5 text-right">pts</span>
          </div>
          <div className="space-y-1">
            {group.table.map((row, i) => (
              <div key={row.team} className="flex items-center gap-2 text-[11px]">
                <span className="w-4 font-mono text-stone-400">{i + 1}</span>
                <span className="flex-1 truncate text-stone-800">{row.team}</span>
                <span className="font-mono tabular-nums text-stone-400">{row.played}</span>
                <span className="w-5 text-right font-mono font-semibold tabular-nums text-stone-700">{row.points}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
