'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Chat from '@/components/Chat';
import RoadToWorldCup from '@/components/RoadToWorldCup';
import FanJourney from '@/components/FanJourney';
import ImmersiveLayer from '@/components/ImmersiveLayer';
import Calendar from '@/components/Calendar';
import MemeCard from '@/components/MemeCard';
import StadiumModal from '@/components/StadiumModal';
import Ticker from '@/components/Ticker';
import TeamBadge from '@/components/TeamBadge';
import { MAP_VIEWBOX, COUNTRY_PATHS, STATE_PATHS, CITIES } from '@/data/mapData';

const CURRENT_MATCH = 'octavos · México 1-1 Países Bajos · MetLife';
const NEXT_MATCH = { teams: 'Brasil vs Croacia', date: 'vie 26 jun', time: '13:00 ART', venue: 'NRG · Houston' };

interface Team { code: string; name: string; sentiment: number; }

const INITIAL_TEAMS: Team[] = [
  { code: 'ARG', name: 'Argentina',      sentiment: 88 },
  { code: 'BRA', name: 'Brasil',         sentiment: 76 },
  { code: 'URU', name: 'Uruguay',        sentiment: 82 },
  { code: 'PAR', name: 'Paraguay',       sentiment: 70 },
  { code: 'COL', name: 'Colombia',       sentiment: 75 },
  { code: 'ECU', name: 'Ecuador',        sentiment: 68 },
  { code: 'MEX', name: 'México',         sentiment: 72 },
  { code: 'USA', name: 'Estados Unidos', sentiment: 60 },
  { code: 'CAN', name: 'Canadá',         sentiment: 55 },
  { code: 'FRA', name: 'Francia',        sentiment: 55 },
  { code: 'ESP', name: 'España',         sentiment: 65 },
  { code: 'JPN', name: 'Japón',          sentiment: 73 },
];

function heatColor(s: number): { bg: string; fg: string } {
  if (s < 35) return { bg: '#fee2e2', fg: '#991b1b' };
  if (s < 50) return { bg: '#fed7aa', fg: '#9a3412' };
  if (s < 65) return { bg: '#fef3c7', fg: '#78350f' };
  if (s < 80) return { bg: '#d1fae5', fg: '#065f46' };
  return { bg: '#a7f3d0', fg: '#064e3b' };
}

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
  { code: 'ARG', label: 'Argentina',      text: '37 millones conteniendo la respiración. cuadras enteras vacías' },
  { code: 'BRA', label: 'Brasil',         text: 'rating histórico de TV: 78% de share nacional. Globo dispara' },
  { code: 'URU', label: 'Uruguay',        text: 'el país clausurado por 90 minutos. la celeste se siente en la nuca' },
  { code: 'PAR', label: 'Paraguay',       text: 'Asunción detenida. la albirroja vuelve después de 16 años' },
  { code: 'COL', label: 'Colombia',       text: 'Bogotá baila antes del pitazo. cumbia en cada cuadra' },
  { code: 'ECU', label: 'Ecuador',        text: 'Quito y Guayaquil paralizadas. tricolor desde el balcón hasta el techo' },
  { code: 'MEX', label: 'México',         text: 'CDMX paralizada. el Zócalo se transformó en estadio gigante' },
  { code: 'USA', label: 'Estados Unidos', text: 'sports bars al máximo. Coca-Cola dispara comerciales nuevos cada hora' },
  { code: 'CAN', label: 'Canadá',         text: 'Toronto y Vancouver con cola en los pubs. timbits agotados a las dos cuadras' },
  { code: 'FRA', label: 'Francia',        text: 'tensión mezclada con orgullo. la sombra de Qatar 2022 todavía pesa' },
  { code: 'ESP', label: 'España',         text: 'Madrid y Barcelona en pausa. los bares con pantalla copan las aceras' },
  { code: 'JPN', label: 'Japón',          text: 'cánticos sincronizados desde Tokio. 95k cantando como uno solo' },
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
  const [intensity, setIntensity] = useState<Record<string, number>>({});

  // Init aleatorio en cliente para evitar mismatch de hidratación (SSR vs CSR con Math.random)
  useEffect(() => {
    const obj: Record<string, number> = {};
    CITIES.forEach(c => { obj[c.id] = 30 + Math.random() * 60; });
    setIntensity(obj);
  }, []);
  const [memes, setMemes] = useState<FeedItem[]>([]);
  const [memesLoading, setMemesLoading] = useState(true);
  const [memesError, setMemesError] = useState(false);
  const [activeMods, setActiveMods] = useState<Set<ModuleId>>(new Set(ALL_MODULES));
  const [tribe, setTribe] = useState<Set<string>>(new Set(INITIAL_TEAMS.map(t => t.code)));
  const [selectedStadium, setSelectedStadium] = useState<string | null>(null);

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
      setTeams(prev => prev.map(t => ({ ...t, sentiment: Math.max(15, Math.min(95, t.sentiment + rand(-2.5, 2.8))) })));
      setIntensity(prev => {
        const next: Record<string, number> = {};
        for (const k in prev) next[k] = Math.max(10, Math.min(100, prev[k] + rand(-8, 10)));
        return next;
      });
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
  if (memesLoading) memesContent = <p className="px-2 text-xs text-stone-400">trayendo y procesando posts...</p>;
  else if (memesError) memesContent = <p className="px-2 text-xs text-stone-400">no se pudo conectar con bluesky.</p>;
  else if (memes.length === 0) memesContent = <p className="px-2 text-xs text-stone-400">sin posts por ahora.</p>;
  else {
    memesContent = (
      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 snap-x">
        {memes.map((m, i) => <MemeCard key={i} item={{ tag: m.tag, text: m.text, when: m.when, url: m.url, author: m.author, imageUrl: m.imageUrl }} />)}
      </div>
    );
  }

  let memesMeta;
  if (memesLoading) memesMeta = 'cargando...';
  else if (memesError) memesMeta = 'bluesky no respondió';
  else memesMeta = 'desde bluesky · clasificado';

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

        <Link href="/fixture" className="mt-3 flex items-center gap-3 rounded-md border-2 border-orange-300 bg-orange-50 px-4 py-2.5 text-xs transition-colors hover:bg-orange-100"><span className="font-medium text-orange-950">fixture completo del mundial</span><span className="text-orange-700">· 104 partidos · grupos + eliminatorias</span><span className="ml-auto rounded bg-orange-500 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">abrir →</span></Link>

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
              <span className="text-[10px] text-stone-400">click en una ciudad · tamaño = intensidad</span>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <svg viewBox={MAP_VIEWBOX} className="h-auto w-full">
                {COUNTRY_PATHS.map((d, i) => <path key={`country-${i}`} d={d} fill="#f5f5f4" stroke="#d6d3d1" strokeWidth={0.8} />)}
                {STATE_PATHS.map((d, i) => <path key={`state-${i}`} d={d} fill="none" stroke="#e7e5e4" strokeWidth={0.4} />)}
                {CITIES.map(c => {
                  const i = intensity[c.id] ?? 30;
                  return (
                    <g key={c.id} onClick={() => setSelectedStadium(c.id)} style={{ cursor: 'pointer' }}>
                      <circle cx={c.x} cy={c.y} r={14} fill="transparent" />
                      <circle cx={c.x} cy={c.y} r={3 + i / 12} fill="#f97316" opacity={0.18 + i / 220} />
                      <circle cx={c.x} cy={c.y} r={2.5} fill="#9a3412" />
                      <text x={c.x + 7} y={c.y + 3} fontSize="9" fill="#44403c" style={{ paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 2 }}>{c.name}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </section>
        )}

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {activeMods.has('senti') && (
            <section>
              <div className="mb-1.5 flex items-baseline justify-between">
                <h2 className="text-xs font-medium tracking-wide text-stone-700">sentimiento</h2>
                <span className="text-[10px] text-stone-400">mapa de calor · cariño</span>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-3">
                <div className="grid grid-cols-4 gap-1.5">
                  {sortedTeams.map(t => {
                    const c = heatColor(t.sentiment);
                    return (
                      <div key={t.code} className="flex flex-col items-center justify-center rounded-md p-2 transition-colors" style={{ backgroundColor: c.bg }}>
                        <TeamBadge code={t.code} size="sm" />
                        <span className="mt-1 text-[9px] font-medium tracking-wider" style={{ color: c.fg }}>{t.code}</span>
                        <span className="font-mono text-sm font-medium tabular-nums" style={{ color: c.fg }}>{Math.round(t.sentiment)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
          {activeMods.has('suf') && (
            <section>
              <div className="mb-1.5 flex items-baseline justify-between">
                <h2 className="text-xs font-medium tracking-wide text-stone-700">sufrimiento compartido</h2>
                <span className="text-[10px] text-stone-400">ansiedad en vivo</span>
              </div>
              <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3">
                {visibleSuf.map(s => {
                  const team = teams.find(tm => tm.code === s.code);
                  const anxiety = team ? Math.round(100 - team.sentiment) : 50;
                  return (
                    <div key={s.code} className="flex items-start gap-3 rounded-md bg-stone-50 p-2.5">
                      <TeamBadge code={s.code} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-700">{s.label}</span>
                          <span className="font-mono text-sm tabular-nums text-stone-900">{anxiety}<span className="ml-0.5 text-[9px] text-stone-400">ans</span></span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-stone-700">{s.text}</p>
                      </div>
                    </div>
                  );
                })}
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
            <div className="rounded-xl border border-stone-200 bg-white p-3">{memesContent}</div>
          </section>
        )}

        {activeMods.has('calle') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">en las calles</h2>
              <span className="text-[10px] text-stone-400">ambiente desde las sedes · arrastrá o usá ← →</span>
            </div>
            <Ticker items={CALLE} />
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
              <span className="text-[10px] text-stone-400">narrativa por selección</span>
            </div>
            <RoadToWorldCup tribe={tribeArray} />
          </section>
        )}

        {activeMods.has('immersive') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">inmersivo</h2>
              <span className="text-[10px] text-stone-400">cómo vivir el partido</span>
            </div>
            <ImmersiveLayer match={CURRENT_MATCH} />
          </section>
        )}

        <footer className="mt-12 border-t border-stone-200 pt-4 text-center text-[10px] text-stone-400">
          Cábala · construido por Diego
        </footer>
      </div>
      <Chat context={{ memes, tribe: tribeArray, activeMods: Array.from(activeMods) }} />
      <StadiumModal cityId={selectedStadium} onClose={() => setSelectedStadium(null)} />
    </main>
  );
}
