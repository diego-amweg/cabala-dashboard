'use client';

import { useState, useEffect } from 'react';

interface RoadMoment {
  date: string;
  title: string;
  narrative: string;
  tag: 'decisivo' | 'drama' | 'hito' | 'preocupación' | 'preocupacion';
}

interface RoadData {
  team: string;
  teamName: string;
  headline: string;
  status: 'clasificado' | 'repechaje' | 'en lucha' | 'eliminado';
  moments: RoadMoment[];
  outlook: string;
  cached?: boolean;
  error?: string;
}

interface RoadToWorldCupProps {
  tribe: string[];
}

const TEAM_NAMES: Record<string, string> = {
  ARG: 'Argentina', BRA: 'Brasil', MAR: 'Marruecos', JPN: 'Japón',
  MEX: 'México', ESP: 'España', FRA: 'Francia', ENG: 'Inglaterra',
};

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  'decisivo':     { bg: '#dcfce7', fg: '#14532d' },
  'drama':        { bg: '#fee2e2', fg: '#7f1d1d' },
  'hito':         { bg: '#dbeafe', fg: '#1e3a8a' },
  'preocupación': { bg: '#fef3c7', fg: '#78350f' },
  'preocupacion': { bg: '#fef3c7', fg: '#78350f' },
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  'clasificado': { bg: '#dcfce7', fg: '#14532d' },
  'repechaje':   { bg: '#fef3c7', fg: '#78350f' },
  'en lucha':    { bg: '#dbeafe', fg: '#1e3a8a' },
  'eliminado':   { bg: '#fee2e2', fg: '#7f1d1d' },
};

export default function RoadToWorldCup({ tribe }: RoadToWorldCupProps) {
  const [activeTeam, setActiveTeam] = useState<string | null>(tribe[0] || null);
  const [road, setRoad] = useState<RoadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tribe.length === 0) {
      setActiveTeam(null);
      setRoad(null);
      return;
    }
    if (!activeTeam || !tribe.includes(activeTeam)) {
      setActiveTeam(tribe[0]);
    }
  }, [tribe, activeTeam]);

  useEffect(() => {
    if (!activeTeam) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/road/${activeTeam}`)
      .then(res => res.json())
      .then((data: RoadData) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setRoad(null);
        } else {
          setRoad(data);
        }
      })
      .catch(e => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeTeam]);

  if (tribe.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-xs text-stone-500">Activá selecciones en &ldquo;mi tribu&rdquo; arriba para ver su camino al Mundial.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {tribe.map(t => (
          <button
            key={t}
            onClick={() => setActiveTeam(t)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              t === activeTeam
                ? 'border-orange-300 bg-orange-50 text-orange-950'
                : 'border-stone-200 text-stone-500 hover:border-stone-300'
            }`}
          >
            {TEAM_NAMES[t] || t}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-xs text-stone-400">Claude está armando el camino de {TEAM_NAMES[activeTeam || ''] || activeTeam}...</p>
      )}

      {error && !loading && (
        <p className="text-xs text-stone-400">No se pudo cargar: {error}</p>
      )}

      {road && !loading && (
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-stone-900">{road.teamName}</h3>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">{road.headline}</p>
            </div>
            <span
              className="shrink-0 rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: STATUS_COLORS[road.status]?.bg || '#f5f5f4',
                color: STATUS_COLORS[road.status]?.fg || '#57534e',
              }}
            >
              {road.status}
            </span>
          </div>

          <ol className="space-y-3">
            {road.moments.map((m, i) => {
              const tc = TAG_COLORS[m.tag] || TAG_COLORS.hito;
              return (
                <li key={i} className="relative border-l-2 border-stone-200 pl-4">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-stone-300" />
                  <div className="text-[10px] uppercase tracking-wider text-stone-400">{m.date}</div>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-xs font-medium text-stone-900">{m.title}</span>
                    <span
                      className="rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wider"
                      style={{ backgroundColor: tc.bg, color: tc.fg }}
                    >
                      {m.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">{m.narrative}</p>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 border-t border-stone-100 pt-3 text-xs italic leading-relaxed text-stone-500">
            {road.outlook}
          </div>

          {road.cached && (
            <div className="mt-2 text-right text-[9px] text-stone-400">cacheado · refresca en 24h</div>
          )}
        </div>
      )}
    </div>
  );
}
