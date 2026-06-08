'use client';

import { useEffect, useState } from 'react';
import { CABALAS } from '@/data/cabalas';

function CabalaDelDia() {
  const idx = Math.floor(Date.now() / 86400000) % CABALAS.length;
  const cabala = CABALAS[idx];
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-md border-l-4 border-l-orange-400 bg-orange-50 px-4 py-3">
      <span className="text-[10px] font-medium uppercase tracking-wider text-orange-900">la cábala del día</span>
      <p className="text-sm font-medium text-orange-950">{cabala.texto}</p>
      <div className="flex items-center gap-2">
        <span className="rounded bg-orange-200 px-2 py-0.5 text-[10px] text-orange-800">{cabala.categoria}</span>
        {cabala.seleccion && <span className="text-[10px] text-orange-700">· {cabala.seleccion}</span>}
      </div>
    </div>
  );
}

function CabalasColeccion() {
  const [miCabalaId, setMiCabalaId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cabala:miCabala');
    if (saved) setMiCabalaId(saved);
  }, []);

  const toggleCabala = (id: string) => {
    if (miCabalaId === id) {
      setMiCabalaId(null);
      localStorage.removeItem('cabala:miCabala');
    } else {
      setMiCabalaId(id);
      localStorage.setItem('cabala:miCabala', id);
    }
  };

  const myCabala = CABALAS.find(c => c.id === miCabalaId);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-3">
      {myCabala && (
        <div className="rounded-md border-2 border-orange-300 bg-orange-50 p-4">
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-orange-900">tu cábala</span>
          <p className="text-sm font-medium text-orange-950">{myCabala.texto}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded bg-orange-200 px-2 py-0.5 text-[10px] text-orange-800">{myCabala.categoria}</span>
            {myCabala.seleccion && <span className="text-[10px] text-orange-700">· {myCabala.seleccion}</span>}
            <button onClick={() => toggleCabala(myCabala.id)} className="ml-auto text-[10px] text-orange-700 hover:text-orange-900 underline">desmarcar</button>
          </div>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {CABALAS.map(c => {
          const isSelected = c.id === miCabalaId;
          return (
            <div key={c.id} className={`flex flex-col gap-2 rounded-md border p-3 transition-colors motion-reduce:transition-none ${isSelected ? 'border-orange-400 bg-orange-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
              <p className={`text-sm ${isSelected ? 'text-orange-950' : 'text-stone-800'}`}>{c.texto}</p>
              <div className="mt-auto flex items-center gap-2 pt-2">
                <span className={`rounded px-2 py-0.5 text-[10px] ${isSelected ? 'bg-orange-200 text-orange-800' : 'bg-stone-100 text-stone-600'}`}>{c.categoria}</span>
                {c.seleccion && <span className={`text-[10px] ${isSelected ? 'text-orange-700' : 'text-stone-500'}`}>· {c.seleccion}</span>}
                <button onClick={() => toggleCabala(c.id)} className={`ml-auto text-[10px] underline ${isSelected ? 'text-orange-700 hover:text-orange-900' : 'text-stone-400 hover:text-stone-600'}`}>{isSelected ? 'desmarcar' : 'marcar como mía'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Cabalas({ variant }: { variant: 'dia' | 'coleccion' }) {
  return variant === 'dia' ? <CabalaDelDia /> : <CabalasColeccion />;
}
