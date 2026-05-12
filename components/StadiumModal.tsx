'use client';

import { useEffect, useState } from 'react';

interface StadiumData {
  name: string;
  city: string;
  capacity: number;
  opened: number;
  description: string | null;
  imageUrl: string | null;
  wikiUrl: string;
}

interface Props {
  cityId: string | null;
  onClose: () => void;
}

export default function StadiumModal({ cityId, onClose }: Props) {
  const [data, setData] = useState<StadiumData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!cityId) { setData(null); return; }
    setLoading(true);
    setError(false);
    fetch(`/api/stadium/${cityId}`)
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d: StadiumData) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [cityId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (cityId) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [cityId]);

  if (!cityId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <p className="text-sm text-stone-400">cargando estadio...</p>
          </div>
        )}

        {error && (
          <div className="p-6">
            <p className="text-sm text-stone-500">no se pudo cargar la info del estadio.</p>
            <button onClick={onClose} className="mt-4 rounded-md bg-stone-100 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-200">cerrar</button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.name} className="h-56 w-full object-cover sm:h-64" />
            ) : (
              <div className="flex h-56 w-full items-center justify-center bg-stone-100 sm:h-64">
                <span className="text-xs text-stone-400">sin imagen disponible</span>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-medium text-stone-900">{data.name}</h3>
                  <p className="mt-0.5 text-xs text-stone-500">{data.city}</p>
                </div>
                <button
                  onClick={onClose}
                  className="-mr-1 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  aria-label="cerrar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-600">
                <span>capacidad <span className="font-mono tabular-nums text-stone-900">{data.capacity.toLocaleString('es-AR')}</span></span>
                <span className="text-stone-300">·</span>
                <span>inaugurado <span className="font-mono tabular-nums text-stone-900">{data.opened}</span></span>
              </div>

              {data.description ? (
                <p className="mt-4 text-xs leading-relaxed text-stone-700">{data.description}</p>
              ) : (
                <p className="mt-4 text-xs italic text-stone-400">sin descripción disponible</p>
              )}

              
                href={data.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-[11px] text-stone-500 underline-offset-2 hover:text-stone-900 hover:underline"
              >leer más en Wikipedia →</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
