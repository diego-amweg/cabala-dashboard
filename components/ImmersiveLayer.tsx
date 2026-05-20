'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImmersiveOption {
  id: string;
  service: string;
  category: 'streaming' | 'social' | 'vr' | 'xr' | 'dome';
  accessibility: 'today' | 'with-gear';
  device: string;
  description: string;
  url: string;
  cost: string;
  coverImage: string;
}

interface ImmersiveData {
  recommendation: string;
  options: ImmersiveOption[];
  cached?: boolean;
  error?: string;
}

interface ImmersiveLayerProps {
  match: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  'streaming': { bg: '#dcfce7', fg: '#14532d', label: 'streaming' },
  'social':    { bg: '#ede9fe', fg: '#4c1d95', label: 'social' },
  'vr':        { bg: '#dbeafe', fg: '#1e3a8a', label: 'VR' },
  'xr':        { bg: '#dbeafe', fg: '#1e3a8a', label: 'XR' },
  'dome':      { bg: '#fef3c7', fg: '#78350f', label: 'domo' },
};

const GROUP_LABELS: Record<'today' | 'with-gear', string> = {
  'today': 'desde tu casa hoy',
  'with-gear': 'con equipo dedicado',
};

const GROUPS: Array<'today' | 'with-gear'> = ['today', 'with-gear'];

export default function ImmersiveLayer({ match }: ImmersiveLayerProps) {
  const [data, setData] = useState<ImmersiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/immersive?match=${encodeURIComponent(match)}`);
        const json = await res.json();
        if (cancelled) return;
        setData(json);
      } catch {
        if (!cancelled) setData({ recommendation: '', options: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
  }, [match]);

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-xs text-stone-400">Claude está pensando la mejor forma de vivir el partido...</p>
      </div>
    );
  }

  if (!data || data.options.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-xs text-stone-400">{data?.error || 'sin opciones disponibles'}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      {data.recommendation && (
        <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs italic leading-relaxed text-orange-950">
          {data.recommendation}
        </div>
      )}

      {GROUPS.map(group => {
        const options = data.options.filter(o => o.accessibility === group);
        if (options.length === 0) return null;

        return (
          <div key={group} className="mb-4 last:mb-0">
            <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-stone-500">{GROUP_LABELS[group]}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map(opt => {
                const cc = CATEGORY_COLORS[opt.category];
                const cardContent = (
                  <>
                    <div className="relative aspect-video w-full overflow-hidden bg-stone-100">
                      <Image src={opt.coverImage} alt={opt.service} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                    </div>
                    <div className="p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-stone-900">{opt.service}</span>
                        <span className="shrink-0 rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wider" style={{ backgroundColor: cc.bg, color: cc.fg }}>{cc.label}</span>
                      </div>
                      <p className="mb-1.5 text-[11px] leading-relaxed text-stone-600">{opt.description}</p>
                      <div className="flex items-center justify-between gap-2 text-[10px] text-stone-500">
                        <span className="truncate">{opt.device}</span>
                        <span className="shrink-0">{opt.cost}</span>
                      </div>
                    </div>
                  </>
                );

                if (opt.url) {
                  return (
                    <a key={opt.id} href={opt.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-stone-100 transition-colors hover:bg-stone-50">{cardContent}</a>
                  );
                }

                return (
                  <div key={opt.id} className="block overflow-hidden rounded-md border border-stone-100">{cardContent}</div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}