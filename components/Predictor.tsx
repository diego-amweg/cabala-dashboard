'use client';

import { useEffect, useState } from 'react';
import { getInitialElo, eloWithHost } from '@/lib/elo';
import { matchProbabilities } from '@/lib/poisson';

interface TeamOdds {
  team: string;
  champion: number;
  final: number;
  semi: number;
  quarter: number;
  r16: number;
  r32: number;
}

interface PredictorProps {
  highlightName?: string | null;
}

interface PredictorResponse {
  odds: TeamOdds[];
  iterations: number;
  updatedAt: number;
  cached: boolean;
  debug?: { unmatchedTeams: string[]; realResultsCount?: number };
  error?: string;
}

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

interface FixturesResponse {
  items: FixtureItem[];
}

const LOCAL_TEAMS = ['México', 'Estados Unidos', 'Canadá'] as const;

export default function Predictor({ highlightName }: PredictorProps) {
  const [odds, setOdds] = useState<TeamOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'title' | 'matches'>('title');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const MAX_TRIES = 3;
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    const fetchPredictor = async () => {
      for (let attempt = 1; attempt <= MAX_TRIES && !cancelled; attempt++) {
        try {
          const res = await fetch('/api/predictor');
          const data = await res.json() as PredictorResponse;
          if (cancelled) return;
          if (data.odds && data.odds.length > 0) {
            setOdds(data.odds);
            setError(false);
            setLoading(false);
            return;
          }
        } catch (err: unknown) {
          // iteramos si hay fallo
        }
        if (attempt < MAX_TRIES && !cancelled) await wait(attempt === 1 ? 2000 : 4000);
      }
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    };

    fetchPredictor();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchFix = async () => {
      try {
        const res = await fetch('/api/fixtures');
        const data = await res.json() as FixturesResponse;
        if (!cancelled && data.items && data.items.length > 0) {
          setFixtures(data.items);
        }
      } catch (err: unknown) { }
    };
    fetchFix();
    return () => { cancelled = true; };
  }, []);

  const pct = (x: number): string => (x * 100).toFixed(1) + '%';
  const pct0 = (x: number): string => Math.round(x * 100) + '%';

  if (loading) return <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">calculando las probabilidades…</div>;
  if (error || odds.length === 0) return <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">el cálculo no está disponible por ahora.</div>;

  const visibleOdds = showAll ? odds : odds.slice(0, 12);

  const finishedMatches = fixtures.filter(f => f.status === 'finished').slice(-4);
  const scheduledMatches = fixtures.filter(f => f.status === 'scheduled').slice(0, 15);
  const displayMatches = [...finishedMatches, ...scheduledMatches];

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="mb-4 flex gap-2">
        <button onClick={() => setView('title')} className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${view === 'title' ? 'border-orange-300 bg-orange-50 text-orange-950' : 'border-stone-200 text-stone-400 hover:border-stone-300'}`}>camino al título</button>
        <button onClick={() => setView('matches')} className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${view === 'matches' ? 'border-orange-300 bg-orange-50 text-orange-950' : 'border-stone-200 text-stone-400 hover:border-stone-300'}`}>partido por partido</button>
      </div>

      {view === 'title' ? (
        <div className="flex flex-col">
          <div className="space-y-1">
            {visibleOdds.map((o, idx) => {
              const isHighlight = o.team === highlightName;
              const isExpanded = expanded === o.team;
              let barColor = 'bg-emerald-300';
              if (o.r32 >= 0.6) barColor = 'bg-emerald-500';
              else if (o.r32 >= 0.4) barColor = 'bg-emerald-400';

              return (
                <div key={o.team} className="flex flex-col">
                  <div onClick={() => setExpanded(isExpanded ? null : o.team)} className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 transition-colors ${isHighlight ? 'border-l-2 border-orange-500 bg-orange-50' : 'hover:bg-stone-50'}`}>
                    <div className="flex w-1/2 items-center gap-2">
                      <span className="w-5 text-right text-[10px] text-stone-400">{idx + 1}.</span>
                      <span className="truncate text-xs font-medium text-stone-700">{o.team}</span>
                      {(LOCAL_TEAMS as readonly string[]).includes(o.team) && <span className="rounded bg-orange-100 px-1 text-[9px] text-orange-900">local</span>}
                    </div>
                    <div className="flex w-1/4 items-center">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                        <div className={`h-full ${barColor}`} style={{ width: `${Math.round(o.r32 * 100)}%` }}></div>
                      </div>
                    </div>
                    <div className={`w-1/4 text-right font-mono text-[11px] tabular-nums ${isHighlight ? 'text-orange-900' : 'text-stone-600'}`}>{pct(o.champion)}</div>
                  </div>

                  {isExpanded && (
                    <div className="mt-1 space-y-1 rounded bg-stone-50 px-3 py-2 motion-reduce:transition-none">
                      {[
                        { label: 'octavos', val: o.r16 },
                        { label: 'cuartos', val: o.quarter },
                        { label: 'semis', val: o.semi },
                        { label: 'final', val: o.final },
                        { label: 'campeón', val: o.champion },
                      ].map(r => (
                        <div key={r.label} className="flex items-center gap-2">
                          <span className="w-[52px] text-[10px] text-stone-500">{r.label}</span>
                          <div className="flex-1">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                              <div className="h-full bg-emerald-400" style={{ width: `${Math.round(r.val * 100)}%` }}></div>
                            </div>
                          </div>
                          <span className="w-8 text-right font-mono text-[10px] tabular-nums text-stone-600">{pct0(r.val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!showAll && odds.length > 12 && (
            <button onClick={() => setShowAll(true)} className="mt-2 text-center text-[11px] text-stone-500 hover:text-stone-700">ver las 48</button>
          )}
          {showAll && (
            <button onClick={() => setShowAll(false)} className="mt-2 text-center text-[11px] text-stone-500 hover:text-stone-700">ver menos</button>
          )}

          <div className="mt-4 text-[10px] text-stone-400">la barra verde es la probabilidad de pasar de grupos · tocá una selección para ver su camino completo</div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayMatches.map(f => {
            const pa = eloWithHost(f.home, getInitialElo(f.home));
            const pb = eloWithHost(f.away, getInitialElo(f.away));
            const probs = matchProbabilities(pa, pb);

            return (
              <div key={f.id} className="flex flex-col gap-1.5 rounded bg-stone-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-stone-700">{f.home} <span className="font-normal text-stone-400">vs</span> {f.away}</div>
                  <div className="text-right">
                    {f.status === 'finished' && f.homeScore !== undefined && f.awayScore !== undefined ? (
                      <span className="text-[10px] text-emerald-700">✓ jugado · {f.homeScore}-{f.awayScore}</span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-stone-400">{f.date.split(' ')[0]} {f.time}</span>
                        <span className="text-[10px] text-stone-500">más probable {probs.topScore.home}-{probs.topScore.away}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex h-[7px] w-full gap-[1.5px] overflow-hidden rounded ${f.status === 'finished' ? 'opacity-45' : ''}`}>
                  <div className="bg-emerald-500" style={{ width: `${Math.round(probs.pHome * 100)}%` }}></div>
                  <div className="bg-stone-300" style={{ width: `${Math.round(probs.pDraw * 100)}%` }}></div>
                  <div className="bg-orange-400" style={{ width: `${Math.round(probs.pAway * 100)}%` }}></div>
                </div>

                <div className="flex justify-between text-[10px] tabular-nums text-stone-600">
                  <span>{f.home} {pct0(probs.pHome)}</span>
                  <span>empate {pct0(probs.pDraw)}</span>
                  <span>{f.away} {pct0(probs.pAway)}</span>
                </div>
              </div>
            );
          })}
          {displayMatches.length === 0 && <div className="text-center text-xs text-stone-500">no hay partidos programados.</div>}
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-stone-400">un modelo estadístico (elo + poisson) estima estas probabilidades a partir de la fuerza de cada selección. no predice el futuro: lo calcula con la información de hoy y se recalcula con cada partido jugado.</p>
    </div>
  );
}
