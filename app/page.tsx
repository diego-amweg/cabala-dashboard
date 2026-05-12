'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Chat from '@/components/Chat';
import RoadToWorldCup from '@/components/RoadToWorldCup';
import FanJourney from '@/components/FanJourney';
import ImmersiveLayer from '@/components/ImmersiveLayer';
import Calendar from '@/components/Calendar';
import MemeCard from '@/components/MemeCard';

const CURRENT_MATCH = 'octavos · México 1-1 Países Bajos · MetLife';
const NEXT_MATCH = { teams: 'Brasil vs Croacia', date: 'vie 26 jun', time: '13:00 ART', venue: 'NRG · Houston' };

const CITIES = [
  { id: 'van', name: 'Vancouver', x: 90, y: 30 },
  { id: 'sea', name: 'Seattle', x: 95, y: 75 },
  { id: 'sf', name: 'San Francisco', x: 75, y: 115 },
  { id: 'la', name: 'Los Ángeles', x: 105, y: 155 },
  { id: 'kc', name: 'Kansas City', x: 320, y: 100 },
  { id: 'dal', name: 'Dallas', x: 300, y: 155 },
  { id: 'hou', name: 'Houston', x: 320, y: 180 },
  { id: 'atl', name: 'Atlanta', x: 460, y: 145 },
  { id: 'mia', name: 'Miami', x: 495, y: 185 },
  { id: 'phi', name: 'Filadelfia', x: 535, y: 115 },
  { id: 'nyc', name: 'NY/NJ', x: 570, y: 95 },
  { id: 'bos', name: 'Boston', x: 600, y: 78 },
  { id: 'tor', name: 'Toronto', x: 455, y: 75 },
  { id: 'mty', name: 'Monterrey', x: 305, y: 215 },
  { id: 'gdl', name: 'Guadalajara', x: 265, y: 248 },
  { id: 'cdmx', name: 'CDMX', x: 320, y: 252 },
];

interface Team { code: string; name: string; sentiment: number; bg: string; fg: string; bar: string; }

const INITIAL_TEAMS: Team[] = [
  { code: 'ARG', name: 'Argentina', sentiment: 88, bg: '#dbeafe', fg: '#1e3a8a', bar: '#3b82f6' },
  { code: 'BRA', name: 'Brasil', sentiment: 76, bg: '#fef3c7', fg: '#78350f', bar: '#d97706' },
  { code: 'MAR', name: 'Marruecos', sentiment: 81, bg: '#fee2e2', fg: '#7f1d1d', bar: '#dc2626' },
  { code: 'JPN', name: 'Japón', sentiment: 73, bg: '#fce7f3', fg: '#831843', bar: '#db2777' },
  { code: 'MEX', name: 'México', sentiment: 70, bg: '#dcfce7', fg: '#14532d', bar: '#16a34a' },
  { code: 'ESP', name: 'España', sentiment: 65, bg: '#fef3c7', fg: '#78350f', bar: '#ea580c' },
  { code: 'FRA', name: 'Francia', sentiment: 52, bg: '#dbeafe', fg: '#1e3a8a', bar: '#1d4ed8' },
  { code: 'ENG', name: 'Inglaterra', sentiment: 38, bg: '#fee2e2', fg: '#7f1d1d', bar: '#ef4444' },
];

interface FeedItem { tag: 'meme' | 'polémica' | 'pelea' | 'viral' | 'noticia'; text: string; when: string; score?: number; url?: string; author?: string; query?: string; relevance?: number; imageUrl?: string; }
interface CalleItem { city: string; text: string; when?: string; }
interface SufItem { code: string; label: string; text: string; }

const CALLE: CalleItem[] = [
  { city: 'Kansas City', text: 'tailgate enorme afuera del Arrowhead. mexicanos cocinando pibil al lado de los gringos haciendo brisket' },
  { city: 'Toronto', text: 'marcha de croatas sobre Yonge St, 3km de bandera, comercios pararon' },
  { city: 'CDMX', text: 'Reforma cerrada por ola humana. policía calcula 200k personas a 4h del partido' },
  { city: 'Miami', text: 'Wynwood explotó tras el gol uruguayo. fiesta improvisada en plena calle' },
  { city: 'Los Ángeles', text: 'argentinos coparon Hollywood Blvd con bombos y banderas en autos' },
  { city: 'Boston', text: 'pub irlandés transmite con capacidad 200%, policía pidió controlar puerta' },
  { city: 'NY/NJ', text: 'banderazo brasileño improvisado en Central Park, samba a las 11am' },
  { city: 'Dallas', text: 'convoy de 40 autos japoneses con bandera saliendo del hotel rumbo al estadio' },
  { city: 'Vancouver', text: 'lluvia + cantos chilenos. hipotermia colectiva pero la fiesta no para' },
  { city: 'Houston', text: 'fan zone se quedó sin cerveza a las 14:00. envío de emergencia en camino' },
  { city: 'Atlanta', text: 'choque cultural lindo: portugueses y americanos compartiendo mesa en Buckhead' },
  { city: 'Filadelfia', text: 'caravana ecuatoriana sobre Broad St, percusión y tambores' },
  { city: 'Monterrey', text: 'fan fest del Macroplaza con pantalla gigante. asados privados en parques' },
  { city: 'Guadalajara', text: 'mariachis tocando para la selección japonesa que pasa por la ciudad' },
  { city: 'San Francisco', text: 'hinchas de Países Bajos pintaron Pier 39 de naranja, marejada cantando' },
  { city: 'Seattle', text: 'caravana ciclista pro-USMNT llegó hasta Pike Place, drum line incluido' },
];

const SUF: SufItem[] = [
  { code: 'ARG', label: 'Argentina', text: '37 millones conteniendo la respiración. cuadras enteras vacías' },
  { code: 'BRA', label: 'Brasil', text: 'rating histórico de TV: 78% de share nacional. Globo dispara' },
  { code: 'MAR', label: 'Marruecos', text: 'rezo colectivo en Casablanca antes del segundo tiempo' },
  { code: 'ENG', label: 'Inglaterra', text: 'It\u2019s coming home trending por 14a vez consecutiva' },
  { code: 'MEX', label: 'México', text: 'CDMX paralizada. el Zócalo se transformó en estadio gigante' },
  { code: 'JPN', label: 'Japón', text: 'cánticos sincronizados desde Tokio hasta el MetLife. 95k cantando' },
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const fmtMin = (sec: number) => `${Math.floor(sec / 60)}' +${(sec % 60) < 10 ? '0' + (sec % 60) : (sec % 60)}''`;

function pickFresh<T>(pool: T[], current: T[], keyFn: (i: T) => string): T {
  const used = new Set(current.map(keyFn));
  const avail = pool.filter(i => !used.has(keyFn(i)));
  const source = avail.length ? avail : pool;
  return source[Math.floor(Math.random() * source.length)];
}

const ALL_MODULES = ['map', 'senti', 'suf', 'memes', 'calle', 'journey', 'calendar', 'road', 'immersive'] as const;
type ModuleId = typeof ALL_MODULES[number];

export default function CabalaDashboard() {
  const [pulse, setPulse] = useState(78);
  const [liveSec, setLiveSec] = useState(60);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [intensity, setIntensity] = useState<Record<string, number>>(() => {
    const obj: Record<string, number> = {};
    CITIES.forEach(c => { obj[c.id] = 30 + Math.random() * 60; });
    return obj;
  });
  const [memes, setMemes] = useState<FeedItem[]>([]);
  const [memesLoading, setMemesLoading] = useState(true);
  const [memesError, setMemesError] = useState(false);
  const [calleShown, setCalleShown] = useState<CalleItem[]>([
    { ...CALLE[0], when: 'ahora' },
    { ...CALLE[2], when: '30s' },
    { ...CALLE[4], when: '1m' },
    { ...CALLE[7], when: '3m' },
  ]);
  const [activeMods, setActiveMods] = useState<Set<ModuleId>>(new Set(ALL_MODULES));
  const [tribe, setTribe] = useState<Set<string>>(new Set(['ARG']));

  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const res = await fetch('/api/reddit');
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setMemes(data.items);
          setMemesError(false);
        } else {
          setMemesError(true);
        }
      } catch {
        setMemesError(true);
      } finally {
        setMemesLoading(false);
      }
    };
    fetchMemes();
    const refreshInterval = setInterval(fetchMemes, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => Math.max(40, Math.min(98, p + rand(-4, 5))));
      setLiveSec(s => (s + 2 >= 90 * 60 ? 60 : s + 2));
      setTeams(prev => prev.map(t => ({
        ...t,
        sentiment: Math.max(15, Math.min(95, t.sentiment + rand(-2.5, 2.8))),
      })));
      setIntensity(prev => {
        const next: Record<string, number> = {};
        for (const k in prev) next[k] = Math.max(10, Math.min(100, prev[k] + rand(-8, 10)));
        return next;
      });
      if (Math.random() > 0.5) {
        setCalleShown(prev => [
          { ...pickFresh(CALLE, prev, c => c.city + c.text), when: 'ahora' },
          ...prev.slice(0, 3),
        ]);
      }
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const toggleMod = (m: ModuleId) => {
    setActiveMods(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  };

  const toggleTribe = (code: string) => {
    setTribe(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const visibleTeams = tribe.size ? teams.filter(t => tribe.has(t.code)) : teams;
  const sortedTeams = [...visibleTeams].sort((a, b) => b.sentiment - a.sentiment);
  const visibleSuf = tribe.size ? SUF.filter(s => tribe.has(s.code)) : SUF;

  let memesContent;
  if (memesLoading) {
    memesContent = <p className="px-2 text-xs text-stone-400">trayendo y procesando posts...</p>;
  } else if (memesError) {
    memesContent = <p className="px-2 text-xs text-stone-400">no se pudo conectar con bluesky.</p>;
  } else if (memes.length === 0) {
    memesContent = <p className="px-2 text-xs text-stone-400">sin posts por ahora.</p>;
  } else {
    memesContent = (
      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 snap-x">
        {memes.map((m, i) => (
          <MemeCard
            key={i}
            item={{
              tag: m.tag,
              text: m.text,
              when: m.when,
              url: m.url,
              author: m.author,
              imageUrl: m.imageUrl,
            }}
          />
        ))}
      </div>
    );
  }

  let memesMeta;
  if (memesLoading) memesMeta = 'cargando...';
  else if (memesError) memesMeta = 'bluesky no respondió';
  else memesMeta = 'desde bluesky · clasificado por claude';

  const tribeArray = Array.from(tribe);
  const heartDuration = (180 - pulse) / 60;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 selection:bg-orange-200">
      <style dangerouslySetInnerHTML={{__html: `@keyframes cabala-heartbeat { 0%, 100% { transform: scale(1); } 25% { transform: scale(1.25); } 50% { transform: scale(0.95); } 75% { transform: scale(1.18); } }`}} />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-3 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl">Cábala</h1>
            <p className="mt-1 text-sm text-stone-500">la superstición se hizo software</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="font-mono text-xs text-stone-500">día 12 · jue 25 jun · 18:42 ART</div>
            <div className="flex items-center gap-2.5 rounded-md bg-stone-100 px-3 py-1.5">
              <span className="text-[10px] uppercase tracking-wider text-stone-500">pulso global</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#f97316" style={{ animation: `cabala-heartbeat ${heartDuration}s ease-in-out infinite`, transformOrigin: 'center' }}>
                <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10z" />
              </svg>
              <span className="font-mono text-sm font-medium tabular-nums text-stone-900">{Math.round(pulse)}</span>
            </div>
          </div>
        </header>

        <div className="mt-4 flex items-center gap-3 rounded-md bg-stone-100 px-4 py-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded bg-orange-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-orange-900">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
            live
          </span>
          <span>{CURRENT_MATCH}</span>
          <span className="ml-auto font-mono text-xs tabular-nums text-stone-500">{fmtMin(liveSec)}</span>
        </div>

        <div className="mt-2 flex items-center gap-3 rounded-md border border-stone-200 bg-white px-4 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone-600">próximo</span>
          <span className="font-medium text-stone-900">{NEXT_MATCH.teams}</span>
          <span className="text-stone-500">· {NEXT_MATCH.date} · {NEXT_MATCH.time}</span>
          <span className="ml-auto truncate text-[10px] text-stone-400">{NEXT_MATCH.venue}</span>
        </div>

        <Link href="/fixture" className="mt-3 flex items-center gap-3 rounded-md border-2 border-orange-300 bg-orange-50 px-4 py-2.5 text-xs transition-colors hover:bg-orange-100"><span className="font-medium text-orange-950">fixture completo del mundial</span><span className="text-orange-700">· 62 partidos · todas las eliminatorias</span><span className="ml-auto rounded bg-orange-500 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">abrir →</span></Link>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {[
            { id: 'map' as const, label: 'ojo de dios' },
            { id: 'senti' as const, label: 'sentimiento' },
            { id: 'suf' as const, label: 'sufrimiento' },
            { id: 'memes' as const, label: 'memes y polémicas' },
            { id: 'calle' as const, label: 'en las calles' },
            { id: 'journey' as const, label: 'viaje del hincha' },
            { id: 'calendar' as const, label: 'calendario' },
            { id: 'road' as const, label: 'camino al mundial' },
            { id: 'immersive' as const, label: 'inmersivo' },
          ].map(m => {
            const on = activeMods.has(m.id);
            return (
              <button key={m.id} onClick={() => toggleMod(m.id)} className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${on ? 'border-orange-300 bg-orange-50 text-orange-950' : 'border-stone-200 text-stone-400 hover:border-stone-300'}`}>
                {m.label}
              </button>
            );
          })}
        </div>

        <section className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xs font-medium tracking-wide text-stone-700">mi tribu</h2>
            <span className="text-[10px] text-stone-400">click para enfocar</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {teams.map(t => {
              const on = tribe.has(t.code);
              return (
                <button key={t.code} onClick={() => toggleTribe(t.code)} className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                  {t.name}
                </button>
              );
            })}
          </div>
        </section>

        {activeMods.has('map') && (
          <section className="mt-6">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">ojo de dios · 16 ciudades sede</h2>
              <span className="text-[10px] text-stone-400">tamaño = intensidad ahora</span>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <svg viewBox="0 0 660 280" className="h-auto w-full">
                <text x="20" y="18" fontSize="9" fill="#a8a29e" letterSpacing="0.5">CANADÁ</text>
                <text x="20" y="120" fontSize="9" fill="#a8a29e" letterSpacing="0.5">ESTADOS UNIDOS</text>
                <text x="20" y="240" fontSize="9" fill="#a8a29e" letterSpacing="0.5">MÉXICO</text>
                <line x1="20" y1="55" x2="640" y2="55" stroke="#e7e5e4" strokeDasharray="2 4" />
                <line x1="20" y1="195" x2="640" y2="195" stroke="#e7e5e4" strokeDasharray="2 4" />
                {CITIES.map(c => {
                  const i = intensity[c.id] ?? 30;
                  return (
                    <g key={c.id}>
                      <circle cx={c.x} cy={c.y} r={3 + i / 12} fill="#f97316" opacity={0.18 + i / 220} />
                      <circle cx={c.x} cy={c.y} r={2.5} fill="#9a3412" />
                      <text x={c.x + 7} y={c.y + 3} fontSize="9" fill="#78716c">{c.name}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {activeMods.has('senti') && (
            <section>
              <div className="mb-1.5 flex items-baseline justify-between">
                <h2 className="text-xs font-medium tracking-wide text-stone-700">sentimiento</h2>
                <span className="text-[10px] text-stone-400">índice de cariño</span>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-3.5">
                {sortedTeams.map(t => (
                  <div key={t.code} className="flex items-center gap-2 py-1 text-xs">
                    <span className="w-8 rounded py-0.5 text-center text-[9px] font-medium tracking-wider" style={{ backgroundColor: t.bg, color: t.fg }}>{t.code}</span>
                    <span className="flex-1">{t.name}</span>
                    <div className="h-1 w-14 overflow-hidden rounded bg-stone-100">
                      <div className="h-full transition-[width] duration-700" style={{ width: `${t.sentiment}%`, backgroundColor: t.bar }} />
                    </div>
                    <span className="w-6 text-right font-mono text-[10px] tabular-nums text-stone-500">{Math.round(t.sentiment)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
          {activeMods.has('suf') && (
            <section>
              <div className="mb-1.5 flex items-baseline justify-between">
                <h2 className="text-xs font-medium tracking-wide text-stone-700">sufrimiento compartido</h2>
                <span className="text-[10px] text-stone-400">en vivo</span>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-3.5">
                {visibleSuf.map(s => (
                  <div key={s.code} className="flex gap-2 py-1.5 text-xs leading-relaxed">
                    <span className="w-14 shrink-0 text-[10px] font-medium text-stone-600">{s.label}</span>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {activeMods.has('memes') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">memes, peleas y polémicas</h2>
              <span className="text-[10px] text-stone-400">{memesMeta}</span>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3">
              {memesContent}
            </div>
          </section>
        )}

        {activeMods.has('calle') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">en las calles</h2>
              <span className="text-[10px] text-stone-400">ambiente desde las sedes</span>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3.5">
              {calleShown.map((c, i) => (
                <div key={i} className="mb-1.5 rounded-md bg-stone-100 px-2.5 py-2 text-xs leading-relaxed last:mb-0">
                  <span className="float-right ml-2 font-mono text-[10px] tabular-nums text-stone-400">{c.when}</span>
                  <span className="mr-1.5 font-medium">{c.city}</span>
                  {c.text}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeMods.has('journey') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">viaje del hincha</h2>
              <span className="text-[10px] text-stone-400">vlogs recientes · desplazá ← →</span>
            </div>
            <FanJourney />
          </section>
        )}

        {activeMods.has('calendar') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">calendario del mundial</h2>
              <span className="text-[10px] text-stone-400">agrupado por día</span>
            </div>
            <Calendar />
          </section>
        )}

        {activeMods.has('road') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">camino al mundial</h2>
              <span className="text-[10px] text-stone-400">narrativa por selección · generada por claude</span>
            </div>
            <RoadToWorldCup tribe={tribeArray} />
          </section>
        )}

        {activeMods.has('immersive') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">inmersivo</h2>
              <span className="text-[10px] text-stone-400">cómo vivir el partido · recomendado por claude</span>
            </div>
            <ImmersiveLayer match={CURRENT_MATCH} />
          </section>
        )}

        <footer className="mt-12 border-t border-stone-200 pt-4 text-center text-[10px] text-stone-400">
          Cábala v1.0 · sprint 4d-1.7 · construido por Diego con asistencia de Claude
        </footer>
      </div>
      <Chat context={{ memes, tribe: tribeArray, activeMods: Array.from(activeMods) }} />
    </main>
  );
}
