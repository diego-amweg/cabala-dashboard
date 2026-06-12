'use client';

import { useEffect, useState, useRef } from 'react';

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
  minute?: string;
}

interface LiveItem {
  home: string;
  away: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
  minute?: string;
}

type PalpitoMap = Record<string, { h: number; a: number }>;

interface TopUser { alias: string; pts: number }
interface Identity { id: string; alias: string }

function normalize(s: string) { return s.toLowerCase().trim(); }

function mergeWithLive(fixtures: FixtureItem[], liveItems: LiveItem[]): FixtureItem[] {
  return fixtures.map(f => {
    const match = liveItems.find(
      l => normalize(l.home) === normalize(f.home) && normalize(l.away) === normalize(f.away)
    );
    if (!match) return f;
    return { ...f, status: match.status, homeScore: match.homeScore, awayScore: match.awayScore, minute: match.minute };
  });
}

export default function Palpito() {
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [palpitos, setPalpitos] = useState<PalpitoMap>({});
  const [shared, setShared] = useState(false);

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [serverPts, setServerPts] = useState<number | null>(null);
  const [serverRank, setServerRank] = useState<number | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [top, setTop] = useState<TopUser[]>([]);
  const [lockedBets, setLockedBets] = useState<Record<string, boolean>>({});

  const timerRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const hasSynced = useRef(false);
  const registering = useRef(false);

  useEffect(() => {
    return () => { Object.values(timerRefs.current).forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    let localIdent: Identity | null = null;
    const identStr = localStorage.getItem('cabala:palpito:id');
    if (identStr) {
      try {
        localIdent = JSON.parse(identStr) as Identity;
        setIdentity(localIdent);
      } catch { }
    }

  }, []);

  useEffect(() => {
    if (!identity || fixtures.length === 0) return;
    let cancelled = false;

    const syncServer = async () => {
      try {
        const res = await fetch(`/api/palpito?id=${identity.id}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.registered) {
          if (data.pts !== undefined) setServerPts(data.pts);
          if (data.rank !== undefined) setServerRank(data.rank);
          if (data.total !== undefined) setServerTotal(data.total);
          if (data.top) setTop(data.top);

          if (data.bets) {
            setPalpitos(prev => {
              const next = { ...prev, ...data.bets };
              localStorage.setItem('cabala:palpitos', JSON.stringify(next));
              return next;
            });
          }

          if (!hasSynced.current) {
            hasSynced.current = true;
            const currentLocal = JSON.parse(localStorage.getItem('cabala:palpitos') || '{}') as PalpitoMap;
            for (const mId of Object.keys(currentLocal)) {
              if (!data.bets || !data.bets[mId]) {
                const matchStatus = fixtures.find(f => f.id === mId)?.status;
                if (matchStatus === 'scheduled') {
                  const b = currentLocal[mId];
                  fetch('/api/palpito', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'bet', id: identity.id, matchId: mId, h: b.h, a: b.a }),
                    headers: { 'Content-Type': 'application/json' }
                  }).catch(() => { });
                }
              }
            }
          }
        }
      } catch { }
    };

    syncServer();
    const interval = setInterval(syncServer, 300000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [identity, fixtures.length]);

  useEffect(() => {
    const saved = localStorage.getItem('cabala:palpitos');
    if (saved) {
      try {
        setPalpitos(JSON.parse(saved) as PalpitoMap);
      } catch { }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const MAX_TRIES = 4;
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    (async () => {
      for (let attempt = 1; attempt <= MAX_TRIES && !cancelled; attempt++) {
        try {
          const res = await fetch('/api/fixtures');
          const data = await res.json();
          if (cancelled) return;
          if (Array.isArray(data.items) && data.items.length > 0) {
            setFixtures(data.items);
            setError(false);
            setLoading(false);
            return;
          }
        } catch { }
        if (attempt < MAX_TRIES && !cancelled) await wait(attempt * 2000);
      }
      if (!cancelled) { setError(true); setLoading(false); }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/live');
        const data = await res.json();
        if (!res.ok || !data.items || data.items.length === 0) return;
        if (!cancelled) {
          setFixtures(prev => mergeWithLive(prev, data.items));
        }
      } catch { }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fixtures.length]);

  const handleInput = (id: string, side: 'h' | 'a', value: string) => {
    const parsed = parseInt(value, 10);
    const finalVal = isNaN(parsed) ? 0 : Math.max(0, Math.min(20, parsed));
    let currentH = 0;
    let currentA = 0;

    setPalpitos(prev => {
      const current = prev[id] || { h: 0, a: 0 };
      const next = { ...prev, [id]: { ...current, [side]: finalVal } };
      currentH = next[id].h;
      currentA = next[id].a;
      localStorage.setItem('cabala:palpitos', JSON.stringify(next));
      return next;
    });

    if (!identity && !registering.current) {
      registering.current = true;
      fetch('/api/palpito', {
        method: 'POST',
        body: JSON.stringify({ action: 'register' }),
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json()).then(data => {
        if (data.id && data.alias) {
          const newIdent = { id: data.id, alias: data.alias };
          localStorage.setItem('cabala:palpito:id', JSON.stringify(newIdent));
          setIdentity(newIdent);
        }
      }).catch(() => { registering.current = false; });
    }

    if (identity) {
      if (timerRefs.current[id]) clearTimeout(timerRefs.current[id]);
      timerRefs.current[id] = setTimeout(() => {
        fetch('/api/palpito', {
          method: 'POST',
          body: JSON.stringify({ action: 'bet', id: identity.id, matchId: id, h: currentH, a: currentA }),
          headers: { 'Content-Type': 'application/json' }
        }).then(r => r.json()).then(data => {
          if (data.error === 'locked') {
            setLockedBets(prev => ({ ...prev, [id]: true }));
          }
        }).catch(() => { });
      }, 600);
    }
  };

  let pts = 0;
  let exactos = 0;
  let ganadores = 0;

  fixtures.forEach(f => {
    if (f.status === 'finished' && f.homeScore !== undefined && f.awayScore !== undefined && palpitos[f.id]) {
      const p = palpitos[f.id];
      if (p.h === f.homeScore && p.a === f.awayScore) {
        pts += 3;
        exactos++;
      } else if (Math.sign(p.h - p.a) === Math.sign(f.homeScore - f.awayScore)) {
        pts += 1;
        ganadores++;
      }
    }
  });

  const displayPts = serverPts !== null ? serverPts : pts;

  const shareProde = async () => {
    const text = serverRank !== null
      ? `voy #${serverRank} en el prode de Cábala como ${identity?.alias}: ${displayPts} pts (${exactos} exactos · ${ganadores} ganadores) · jugá el prode sin registrarte → https://cabala.futbol`
      : `mi pálpito en Cábala: ${displayPts} pts (${exactos} exactos · ${ganadores} ganadores) · jugá el prode sin registrarte → https://cabala.futbol`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text }); } catch { }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch { }
    }
  };

  if (loading) return <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">cargando los partidos…</div>;
  if (error || fixtures.length === 0) return <div className="rounded-xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">el fixture no está disponible por ahora.</div>;

  const scheduled = fixtures.filter(f => f.status === 'scheduled').slice(0, 12);
  const playedWithBet = fixtures.filter(f => (f.status === 'finished' || f.status === 'live') && palpitos[f.id]);
  const hasBets = Object.keys(palpitos).length > 0;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className={`${identity ? 'mb-2' : 'mb-4'} flex items-center justify-between border-b border-stone-100 pb-3`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-800">tu pálpito</span>
          <span className="font-mono text-sm tabular-nums text-stone-600">{displayPts} pts</span>
        </div>
        <button onClick={shareProde} className="inline-flex items-center gap-1.5 rounded-md border border-orange-300 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-900 transition-colors hover:bg-orange-100"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>{shared ? 'copiado' : 'compartir'}</button>
      </div>

      {identity && (
        <div className="mb-4 text-[11px] text-stone-500">
          jugás como <span className="font-medium text-stone-700">{identity.alias}</span>
          {serverRank !== null && serverTotal !== null ? ` · #${serverRank} de ${serverTotal}` : ''}
        </div>
      )}

      {!hasBets && (
        <p className="mb-4 text-xs text-stone-500">cargá tu pálpito antes del pitazo. exacto vale 3, embocar al ganador vale 1. sin registro: queda en tu navegador.</p>
      )}

      {scheduled.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {scheduled.map(f => {
            const valH = palpitos[f.id]?.h ?? '';
            const valA = palpitos[f.id]?.a ?? '';
            return (
              <div key={f.id} className="flex items-center justify-between rounded bg-stone-50 px-2 py-1.5 text-xs">
                <div className="flex items-center gap-2 text-stone-500">
                  <span className="w-6 text-right font-medium">{f.date.split(' ')[0]}</span>
                  <span className="font-mono">{f.time}</span>
                </div>
                <div className="flex flex-1 items-center justify-end gap-2 text-stone-800">
                  <span className="truncate text-right">{f.home}</span>
                  <input type="number" min="0" max="20" inputMode="numeric" value={valH} onChange={e => handleInput(f.id, 'h', e.target.value)} className="w-10 rounded border border-stone-200 bg-white px-1 py-0.5 text-center font-mono text-stone-900 outline-none focus:border-orange-400" />
                  <span className="text-stone-300">-</span>
                  <input type="number" min="0" max="20" inputMode="numeric" value={valA} onChange={e => handleInput(f.id, 'a', e.target.value)} className="w-10 rounded border border-stone-200 bg-white px-1 py-0.5 text-center font-mono text-stone-900 outline-none focus:border-orange-400" />
                  <span className="w-[60px] truncate">{f.away}</span>
                  {lockedBets[f.id] && <span className="text-[10px] text-stone-400">cerró</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {playedWithBet.length > 0 && (
        <div className="space-y-1.5 border-t border-stone-100 pt-3">
          {playedWithBet.map(f => {
            const p = palpitos[f.id];
            if (f.status === 'live') {
              return (
                <div key={f.id} className="flex items-center justify-between rounded px-2 py-1 text-xs">
                  <div className="text-stone-700">{f.home} {f.homeScore ?? 0}-{f.awayScore ?? 0} {f.away} <span className="mx-1 text-stone-400">· tu pálpito {p.h}-{p.a}</span></div>
                  <span className="rounded bg-orange-100 px-1.5 py-px text-[9px] uppercase tracking-wider text-orange-900">en juego</span>
                </div>
              );
            }

            let badgeClass = 'bg-stone-100 text-stone-600';
            let label = '+0';
            if (f.homeScore !== undefined && f.awayScore !== undefined) {
              if (p.h === f.homeScore && p.a === f.awayScore) {
                badgeClass = 'bg-[#dcfce7] text-[#14532d]';
                label = '+3';
              } else if (Math.sign(p.h - p.a) === Math.sign(f.homeScore - f.awayScore)) {
                badgeClass = 'bg-[#fef3c7] text-[#78350f]';
                label = '+1';
              }
            }

            return (
              <div key={f.id} className="flex items-center justify-between rounded px-2 py-1 text-xs">
                <div className="text-stone-700">{f.home} {f.homeScore}-{f.awayScore} {f.away} <span className="mx-1 text-stone-400">· tu pálpito {p.h}-{p.a}</span></div>
                <span className={`rounded px-1.5 py-px text-[9px] uppercase tracking-wider ${badgeClass}`}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {top.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <span className="mb-2 block text-[10px] text-stone-400">la tabla &middot; top 10</span>
          <div className="space-y-1">
            {top.map((u, i) => {
              const isMe = identity && u.alias === identity.alias;
              return (
                <div key={i} className={`flex justify-between px-2 py-1 text-xs ${isMe ? 'rounded bg-orange-50 text-orange-950' : 'text-stone-600'}`}>
                  <span>{i + 1}. {u.alias}</span>
                  <span className="font-mono tabular-nums">{u.pts}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
