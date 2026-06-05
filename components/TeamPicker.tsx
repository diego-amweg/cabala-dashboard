'use client';

import { useState } from 'react';

interface TeamHeat { code: string; name: string; crest: string | null; views: number; heat: number; }

export default function TeamPicker({ teams, onPick, onClose }: { teams: TeamHeat[]; onPick: (name: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');

  const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="picker-enter relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl max-[800px]:max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <style dangerouslySetInnerHTML={{ __html: `@media (prefers-reduced-motion: no-preference) { .picker-enter { animation: picker-pop 0.2s ease-out; } } @keyframes picker-pop { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }` }} />
        <div className="flex items-center justify-between border-b border-stone-200 p-4">
          <input type="text" placeholder="buscar selección…" value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-transparent text-lg outline-none placeholder:text-stone-400" autoFocus />
          <button onClick={onClose} className="ml-4 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
        <div className="overflow-y-auto p-4">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {filtered.map(t => (
                <button key={t.code} onClick={() => onPick(t.name)} className="flex flex-col items-center justify-center rounded-lg border border-stone-200 p-3 transition-colors hover:border-orange-300 hover:bg-orange-50">
                  {t.crest && <img src={t.crest} alt="" className="mb-2 h-10 w-10 object-contain" />}
                  <span className="text-[10px] font-bold text-stone-400">{t.code.toLowerCase()}</span>
                  <span className="text-xs font-medium text-stone-700">{t.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-stone-500">no se encontraron selecciones.</div>
          )}
        </div>
      </div>
    </div>
  );
}
