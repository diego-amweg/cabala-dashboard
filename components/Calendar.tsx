'use client';

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

const FIXTURES: FixtureItem[] = [
  { id: '1', date: 'jue 25 jun', time: '18:42', home: 'México', away: 'Países Bajos', phase: 'octavos', venue: 'MetLife · NY/NJ', status: 'live', homeScore: 1, awayScore: 1 },
  { id: '2', date: 'vie 26 jun', time: '13:00', home: 'Brasil', away: 'Croacia', phase: 'octavos', venue: 'NRG · Houston', status: 'scheduled' },
  { id: '3', date: 'vie 26 jun', time: '17:00', home: 'Argentina', away: 'Estados Unidos', phase: 'octavos', venue: 'Mercedes-Benz · Atlanta', status: 'scheduled' },
  { id: '4', date: 'vie 26 jun', time: '21:00', home: 'Francia', away: 'Senegal', phase: 'octavos', venue: 'SoFi · Los Ángeles', status: 'scheduled' },
  { id: '5', date: 'sáb 27 jun', time: '13:00', home: 'España', away: 'Japón', phase: 'octavos', venue: 'MetLife · NY/NJ', status: 'scheduled' },
  { id: '6', date: 'sáb 27 jun', time: '17:00', home: 'Inglaterra', away: 'Marruecos', phase: 'octavos', venue: 'BMO · Toronto', status: 'scheduled' },
  { id: '7', date: 'sáb 27 jun', time: '21:00', home: 'Alemania', away: 'Portugal', phase: 'octavos', venue: 'Lincoln · Filadelfia', status: 'scheduled' },
  { id: '8', date: 'dom 28 jun', time: '14:00', home: 'Por definir', away: 'Por definir', phase: 'cuartos', venue: 'AT&T · Dallas', status: 'scheduled' },
];

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  'live':      { bg: '#ffedd5', fg: '#9a3412', label: 'live' },
  'finished':  { bg: '#e7e5e4', fg: '#44403c', label: 'final' },
  'scheduled': { bg: '#f5f5f4', fg: '#78716c', label: 'programado' },
};

export default function Calendar() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <div className="space-y-0.5">
        {FIXTURES.map(f => {
          const st = STATUS_STYLES[f.status];
          const scoreText = f.status !== 'scheduled' && f.homeScore !== undefined && f.awayScore !== undefined
            ? `${f.homeScore}-${f.awayScore}`
            : 'vs';
          return (
            <div key={f.id} className="flex items-center gap-3 rounded-md px-2.5 py-2 text-xs transition-colors hover:bg-stone-50">
              <div className="w-20 shrink-0">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">{f.date}</div>
                <div className="font-mono tabular-nums text-stone-700">{f.time}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-stone-900">
                  {f.home} <span className="mx-1 text-stone-400">{scoreText}</span> {f.away}
                </div>
                <div className="truncate text-[10px] text-stone-500">{f.phase} · {f.venue}</div>
              </div>
              <span
                className="shrink-0 rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wider"
                style={{ backgroundColor: st.bg, color: st.fg }}
              >
                {f.status === 'live' && <span className="mr-1 inline-block h-1 w-1 animate-pulse rounded-full" style={{ backgroundColor: st.fg }} />}
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[9px] italic text-stone-400">fixture provisorio · Sprint 5 lo conecta a API-Football con resultados reales</p>
    </div>
  );
}
