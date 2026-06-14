'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
// import Chat from '@/components/Chat'; // chat escondido para el lanzamiento (reactivar a futuro)
import RoadToWorldCup from '@/components/RoadToWorldCup';
import FanJourney from '@/components/FanJourney';
import ImmersiveLayer from '@/components/ImmersiveLayer';
import Calendar from '@/components/Calendar';
import MemeCard from '@/components/MemeCard';
import GifWall from '@/components/GifWall';
import StadiumModal from '@/components/StadiumModal';
import Ticker from '@/components/Ticker';
import TeamBadge from '@/components/TeamBadge';
import Thermometer from '@/components/Thermometer';
import TeamPicker from '@/components/TeamPicker';
import RelatoDelDia from '@/components/RelatoDelDia';
import Cabalas from '@/components/Cabalas';
import Palpito from '@/components/Palpito';
import Predictor from '@/components/Predictor';
import Bubble from '@/components/Bubble';
import { MAP_VIEWBOX, COUNTRY_PATHS, STATE_PATHS, CITIES } from '@/data/mapData';

interface LiveItem {
  id: string;
  date: string;
  time: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'live' | 'finished';
  minute?: string;
  venue: string;
}

// la tribu fija de 12 selecciones (code + nombre). el calor de cada una sale real de /api/heat.
const TRIBE: { code: string; name: string }[] = [
  { code: 'ARG', name: 'Argentina' },
  { code: 'BRA', name: 'Brasil' },
  { code: 'URU', name: 'Uruguay' },
  { code: 'PAR', name: 'Paraguay' },
  { code: 'COL', name: 'Colombia' },
  { code: 'ECU', name: 'Ecuador' },
  { code: 'MEX', name: 'México' },
  { code: 'USA', name: 'Estados Unidos' },
  { code: 'CAN', name: 'Canadá' },
  { code: 'FRA', name: 'Francia' },
  { code: 'ESP', name: 'España' },
  { code: 'JPN', name: 'Japón' },
];

interface TeamHeat { code: string; name: string; crest: string | null; views: number; heat: number; }

interface FeedItem { tag: 'meme' | 'polémica' | 'pelea' | 'viral' | 'noticia'; text: string; when: string; score?: number; url?: string; author?: string; query?: string; relevance?: number; imageUrl?: string; }
interface CalleItem { city: string; text: string; when?: string; }

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

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const ALL_MODULES = ['palpito', 'predictor', 'map', 'senti', 'memes', 'calle', 'journey', 'calendar', 'gifs', 'road', 'immersive', 'cabalas'] as const;
type ModuleId = typeof ALL_MODULES[number];

export default function CabalaDashboard() {
  const [pulse, setPulse] = useState(78);
  const [pulseTrend, setPulseTrend] = useState<number | null>(null);
  const [live, setLive] = useState<LiveItem[]>([]);
  const [nowDate, setNowDate] = useState<string>('');
  const [heat, setHeat] = useState<TeamHeat[]>([]);
  const [myTeam, setMyTeam] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [intensity, setIntensity] = useState<Record<string, number>>({});

  // Init aleatorio en cliente para evitar mismatch de hidratación (SSR vs CSR con Math.random)
  useEffect(() => {
    const obj: Record<string, number> = {};
    CITIES.forEach(c => { obj[c.id] = 30 + Math.random() * 60; });
    setIntensity(obj);
  }, []);

  // pulso global real: atención mundial al mundial, vía wikipedia (se actualiza al cargar)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/pulse')
      .then(r => r.json())
      .then(d => { if (!cancelled && typeof d.pulse === 'number' && d.pulse > 0) { setPulse(d.pulse); setPulseTrend(typeof d.trendPct === 'number' ? d.trendPct : null); } })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // calor por selección real: atención por equipo, vía wikipedia (termómetro mundial)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/heat')
      .then(r => r.json())
      .then(d => { if (!cancelled && Array.isArray(d.teams)) setHeat(d.teams); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('cabala:miSeleccion');
    if (saved) setMyTeam(saved);
    // pre-calentar el road de toda la tribu en background: haiku tarda ~15s en frío,
    // así arrancamos las generaciones al montar la página antes de que el usuario abra
    // el módulo. si redis está fresco (24h), cada fetch vuelve en <100ms sin llamar a haiku.
    TRIBE.forEach(t => { fetch(`/api/road/${t.code}`).catch(() => { }); });
  }, []);

  const handlePick = (name: string) => {
    localStorage.setItem('cabala:miSeleccion', name);
    setMyTeam(name);
    setPickerOpen(false);
  };

  const [memes, setMemes] = useState<FeedItem[]>([]);
  const [memesLoading, setMemesLoading] = useState(true);
  const [memesError, setMemesError] = useState(false);
  const [activeMods, setActiveMods] = useState<Set<ModuleId>>(new Set(ALL_MODULES));
  const [tribe, setTribe] = useState<Set<string>>(new Set(TRIBE.map(t => t.code)));
  const [selectedStadium, setSelectedStadium] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

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
    let cancelled = false;
    const fetchLive = async () => {
      try {
        let res = await fetch('/api/live');
        let data = await res.json();
        if (!res.ok || !data.items || data.items.length === 0) {
          res = await fetch('/api/fixtures');
          data = await res.json();
        }
        if (!cancelled && data.items) {
          setLive(data.items);
        }
      } catch { }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    const f = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    setNowDate(f.format(new Date()).replace(',', ' ·').toLowerCase() + ' ART');
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
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

  const shareCabala = async () => {
    const url = 'https://cabala.futbol';
    const data = { title: 'Cábala', text: 'Cábala — el dashboard del Mundial 2026', url };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share(data); } catch { /* el usuario canceló */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch { /* sin permiso de clipboard */ }
    }
  };

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

  const liveMatches = live.filter(i => i.status === 'live');
  const nextMatch = live.find(i => i.status === 'scheduled');
  let immersiveMatchStr = 'mundial 2026';
  if (liveMatches.length > 0) immersiveMatchStr = `${liveMatches[0].home} vs ${liveMatches[0].away}`;
  else if (nextMatch) immersiveMatchStr = `${nextMatch.home} vs ${nextMatch.away}`;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 selection:bg-orange-200">
      <style dangerouslySetInnerHTML={{ __html: `@keyframes cabala-heartbeat { 0%, 100% { transform: scale(1); } 25% { transform: scale(1.25); } 50% { transform: scale(0.95); } 75% { transform: scale(1.18); } }` }} />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-3 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl">Cábala</h1>
            <p className="mt-1 text-sm text-stone-500">la superstición se hizo software</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-2">
              {myTeam === null ? (
                <button onClick={() => setPickerOpen(true)} className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600 transition-colors hover:bg-stone-50">elegí tu selección</button>
              ) : (
                <div className="flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-700">
                  {heat.find(t => t.name === myTeam)?.crest && <img src={heat.find(t => t.name === myTeam)!.crest!} alt="" className="h-3 w-3 object-contain" />}
                  <span className="font-medium">{myTeam}</span>
                  {heat.find(t => t.name === myTeam)?.heat !== undefined && <span className="text-stone-400">· calor {heat.find(t => t.name === myTeam)!.heat}</span>}
                  <button onClick={() => setPickerOpen(true)} className="ml-1 text-[10px] text-stone-400 underline hover:text-stone-600">cambiar</button>
                </div>
              )}
              <button onClick={shareCabala} className="inline-flex items-center gap-1.5 rounded-md border border-orange-300 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-900 transition-colors hover:bg-orange-100"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>{shared ? 'copiado' : 'compartir'}</button>
            </div>
            <div className="font-mono text-xs text-stone-500">{nowDate}</div>
            <div className="flex items-center gap-2.5 rounded-md bg-stone-100 px-3 py-1.5">
              <span className="text-[10px] uppercase tracking-wider text-stone-500">pulso global</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#f97316" style={{ animation: `cabala-heartbeat ${heartDuration}s ease-in-out infinite`, transformOrigin: 'center' }}>
                <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10z" />
              </svg>
              <span className="font-mono text-sm font-medium tabular-nums text-stone-900">{Math.round(pulse)}</span>
              {pulseTrend !== null && pulseTrend > 0 && <span className="text-[10px] font-medium text-emerald-600">↑{pulseTrend}%</span>}
            </div>
          </div>
        </header>

        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5">
          <p className="text-xs leading-snug text-orange-950">el Mundial 2026 en una sola pantalla: lo que pasa en la cancha, el pulso del mundo y tus cábalas. <span className="text-orange-800">sin cuenta — elegí tu selección y cargá tu pálpito.</span></p>
        </div>

        <RelatoDelDia />
        <Cabalas variant="dia" />

        {liveMatches.length > 0 && liveMatches.map(m => (
          <div key={m.id} className="mt-4 flex items-center gap-3 rounded-md bg-stone-100 px-4 py-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded bg-orange-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-orange-900">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
              live
            </span>
            <span>{m.home} {m.homeScore ?? 0}-{m.awayScore ?? 0} {m.away}</span>
            <span className="ml-auto font-mono text-xs tabular-nums text-stone-500">{m.minute ?? ''}</span>
          </div>
        ))}

        {nextMatch && (
          <div className={`flex items-center gap-3 rounded-md border border-stone-200 bg-white px-4 py-2 text-xs ${liveMatches.length > 0 ? 'mt-2' : 'mt-4'}`}>
            <span className="inline-flex items-center gap-1.5 rounded bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone-600">próximo</span>
            <span className="font-medium text-stone-900">{nextMatch.home} vs {nextMatch.away}</span>
            <span className="text-stone-500">· {nextMatch.date} · {nextMatch.time}</span>
            <span className="ml-auto truncate text-[10px] text-stone-400">{nextMatch.venue}</span>
          </div>
        )}

        <Link href="/fixture" className="mt-3 flex items-center gap-3 rounded-md border-2 border-orange-300 bg-orange-50 px-4 py-2.5 text-xs transition-colors hover:bg-orange-100"><span className="font-medium text-orange-950">fixture completo del mundial</span><span className="text-orange-700">· 104 partidos · grupos + eliminatorias</span><span className="ml-auto rounded bg-orange-500 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">abrir →</span></Link>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {[
            { id: 'palpito' as const, label: 'el pálpito' },
            { id: 'predictor' as const, label: 'la matemática mundialista' },
            { id: 'map' as const, label: 'ojo de dios' },
            { id: 'senti' as const, label: 'termómetro' },
            { id: 'memes' as const, label: 'memes y polémicas' },
            { id: 'calle' as const, label: 'en las calles' },
            { id: 'journey' as const, label: 'viaje del hincha' },
            { id: 'calendar' as const, label: 'calendario' },
            { id: 'gifs' as const, label: 'gifs' },
            { id: 'road' as const, label: 'camino al mundial' },
            { id: 'immersive' as const, label: 'inmersivo' },
            { id: 'cabalas' as const, label: 'cábalas' },
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
            {TRIBE.map(t => {
              const on = tribe.has(t.code);
              return (
                <button key={t.code} onClick={() => toggleTribe(t.code)} className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
                  {t.name}
                </button>
              );
            })}
          </div>
        </section>

        {activeMods.has('palpito') && (
          <section className="mt-6">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">el pálpito</h2>
              <span className="text-[10px] text-stone-400">exacto 3 · ganador 1 · sin registro</span>
            </div>
            <Palpito />
          </section>
        )}

        {activeMods.has('predictor') && (
          <section className="mt-6">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">la matemática mundialista</h2>
              <span className="text-[10px] text-stone-400">elo + poisson · quién la gana, según los números</span>
            </div>
            <Bubble id="predictor" variant="data">acá no jugás vos: la compu calcula las chances de cada selección.</Bubble>
            <Predictor highlightName={myTeam} />
          </section>
        )}

        {activeMods.has('map') && (
          <section className="mt-6">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">ojo de dios · 16 ciudades sede</h2>
              <span className="text-[10px] text-stone-400">click en una ciudad · tamaño = intensidad</span>
            </div>
            <Bubble id="map" variant="info">las 16 sedes del Mundial en el mapa — tocá una para conocerla.</Bubble>
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

        {activeMods.has('senti') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">termómetro mundial</h2>
              <span className="text-[10px] text-stone-400">cuánto mira el planeta a cada selección · inglés + idioma local · Wikipedia</span>
            </div>
            <Bubble id="senti" variant="info">cuánto mira el mundo a cada selección, ahora mismo. el más caliente, más grande.</Bubble>
            <div className="rounded-xl border border-stone-200 bg-white p-3">
              {heat.length === 0 ? (
                <p className="px-2 text-xs text-stone-400">midiendo el calor del mundo…</p>
              ) : (
                <Thermometer teams={heat} tribeNames={TRIBE.filter(t => tribe.has(t.code)).map(t => t.name)} highlightName={myTeam} />
              )}
            </div>
          </section>
        )}

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

        {activeMods.has('gifs') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">gifs del mundial</h2>
              <span className="text-[10px] text-stone-400">tu tribu en movimiento</span>
            </div>
            <GifWall tribe={tribeArray} />
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
            <ImmersiveLayer match={immersiveMatchStr} />
          </section>
        )}

        {activeMods.has('cabalas') && (
          <section className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="text-xs font-medium tracking-wide text-stone-700">cábalas</h2>
              <span className="text-[10px] text-stone-400">folklore del hincha</span>
            </div>
            <Bubble id="cabalas" variant="play">los rituales de cancha del hincha — encontrá la tuya y guardala.</Bubble>
            <Cabalas variant="coleccion" />
          </section>
        )}

        <footer className="mt-12 border-t border-stone-200 pt-4 text-center text-[10px] text-stone-400">
          Cábala · construido por Diego
        </footer>
      </div>
      {/* <Chat context={{ memes, tribe: tribeArray, activeMods: Array.from(activeMods) }} /> */}
      <StadiumModal cityId={selectedStadium} onClose={() => setSelectedStadium(null)} />
      {pickerOpen && <TeamPicker teams={heat} onPick={handlePick} onClose={() => setPickerOpen(false)} />}
    </main>
  );
}
