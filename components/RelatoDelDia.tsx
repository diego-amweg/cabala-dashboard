'use client';

import { useEffect, useState } from 'react';

export default function RelatoDelDia() {
  const [relato, setRelato] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/relato')
      .then(r => r.json())
      .then(d => {
        if (!cancelled) {
          if (d.relato) setRelato(d.relato);
        }
      })
      .catch(() => {
        // Ignoramos errores, simplemente no mostramos el relato
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="mt-4 text-sm italic text-stone-400">escribiendo el relato del día…</p>;
  }

  if (!relato) return null;

  return (
    <p className="mt-4 text-sm italic text-stone-600 leading-relaxed max-w-3xl">
      {relato}
    </p>
  );
}
