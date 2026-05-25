'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import TeamBadge from '@/components/TeamBadge';

interface TeamHeat { code: string; name: string; views: number; heat: number; }
interface Rect { x: number; y: number; w: number; h: number; team: TeamHeat; }
type Scaled = { team: TeamHeat; area: number };

function heatColor(s: number): { bg: string; fg: string } {
  if (s < 35) return { bg: '#fecaca', fg: '#991b1b' };
  if (s < 50) return { bg: '#fed7aa', fg: '#9a3412' };
  if (s < 65) return { bg: '#fde68a', fg: '#78350f' };
  if (s < 80) return { bg: '#a7f3d0', fg: '#065f46' };
  return { bg: '#6ee7b7', fg: '#064e3b' };
}

// squarified treemap (Bruls et al.): tesela todo el área, área de cada rect proporcional al calor
function worstRatio(areas: number[], side: number, sumArea: number): number {
  const length = sumArea / side;
  let worst = 0;
  for (const a of areas) {
    const other = a / length;
    worst = Math.max(worst, Math.max(length / other, other / length));
  }
  return worst;
}

function squarify(teams: TeamHeat[], W: number, H: number): Rect[] {
  const total = teams.reduce((s, t) => s + t.heat, 0);
  if (total <= 0 || !teams.length || W <= 0 || H <= 0) return [];
  const area = W * H;
  const scaled: Scaled[] = teams.map(t => ({ team: t, area: (t.heat / total) * area }));
  const out: Rect[] = [];
  let rx = 0, ry = 0, rw = W, rh = H, i = 0;
  while (i < scaled.length) {
    const side = Math.min(rw, rh);
    const row: Scaled[] = [];
    let rowArea = 0, best = Infinity;
    while (i < scaled.length) {
      const ratio = worstRatio([...row.map(r => r.area), scaled[i].area], side, rowArea + scaled[i].area);
      if (ratio <= best) { row.push(scaled[i]); rowArea += scaled[i].area; best = ratio; i++; }
      else break;
    }
    const depth = rowArea / side;
    if (rw >= rh) {
      let oy = ry;
      for (const c of row) { const ch = (c.area / rowArea) * rh; out.push({ x: rx, y: oy, w: depth, h: ch, team: c.team }); oy += ch; }
      rx += depth; rw -= depth;
    } else {
      let ox = rx;
      for (const c of row) { const cw = (c.area / rowArea) * rw; out.push({ x: ox, y: ry, w: cw, h: depth, team: c.team }); ox += cw; }
      ry += depth; rh -= depth;
    }
  }
  return out;
}

const GAP = 4;

export default function Thermometer({ teams }: { teams: TeamHeat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => { for (const e of entries) setWidth(e.contentRect.width); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = width > 0 && width < 560 ? Math.round(width * 1.1) : 380;
  const rects = useMemo(() => (width > 0 ? squarify(teams, width, height) : []), [teams, width, height]);

  return (
    <div ref={ref} className="relative w-full overflow-hidden rounded-lg bg-white" style={{ height }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes thermo-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.055); } } @media (prefers-reduced-motion: reduce) { .thermo-beat { animation: none !important; } }` }} />
      {rects.map((r, idx) => {
        const c = heatColor(r.team.heat);
        const small = Math.min(r.w, r.h);
        const numSize = Math.max(13, Math.min(36, small * 0.24));
        const codeSize = Math.max(8, Math.min(14, small * 0.11));
        const showBadge = small > 46;
        const dur = (4.4 - (r.team.heat / 100) * 2.2).toFixed(2);
        const delay = ((idx % 6) * 0.19).toFixed(2);
        return (
          <div key={r.team.code} title={`${r.team.name} · ${r.team.views.toLocaleString('es-AR')} vistas en Wikipedia`} className="absolute flex flex-col items-center justify-center overflow-hidden rounded-md" style={{ left: r.x + GAP / 2, top: r.y + GAP / 2, width: Math.max(0, r.w - GAP), height: Math.max(0, r.h - GAP), backgroundColor: c.bg, color: c.fg }}>
            <div className="thermo-beat flex flex-col items-center justify-center" style={{ animation: `thermo-breathe ${dur}s ease-in-out ${delay}s infinite`, transformOrigin: 'center' }}>
              {showBadge && <TeamBadge code={r.team.code} size="sm" />}
              <span className="mt-0.5 font-medium tracking-wider" style={{ fontSize: codeSize }}>{r.team.code}</span>
              <span className="font-mono font-semibold tabular-nums leading-none" style={{ fontSize: numSize }}>{r.team.heat}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
