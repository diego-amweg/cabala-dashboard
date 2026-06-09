'use client';

import { useState, useEffect, useRef } from 'react';
import TeamBadge from './TeamBadge';

interface RoadMoment {
  date: string;
  title: string;
  narrative: string;
  tag: 'decisivo' | 'drama' | 'hito' | 'preocupación' | 'preocupacion';
}

interface RoadData {
  team: string;
  teamName: string;
  headline: string;
  status: 'clasificado' | 'repechaje' | 'en lucha' | 'eliminado';
  moments: RoadMoment[];
  outlook: string;
  cached?: boolean;
  error?: string;
}

interface BtsVideo {
  id: string;
  title: string;
  blurb: string;
}

interface RoadToWorldCupProps {
  tribe: string[];
}

const TEAM_NAMES: Record<string, string> = {
  ARG: 'Argentina',
  BRA: 'Brasil',
  URU: 'Uruguay',
  PAR: 'Paraguay',
  COL: 'Colombia',
  ECU: 'Ecuador',
  MEX: 'México',
  USA: 'Estados Unidos',
  CAN: 'Canadá',
  FRA: 'Francia',
  ESP: 'España',
  JPN: 'Japón',
};

interface HeroData { titles: number; bestPerf: string; dt: string; }

const TEAM_HERO_DATA: Record<string, HeroData> = {
  ARG: { titles: 3, bestPerf: 'campeón 1978, 1986, 2022', dt: 'Lionel Scaloni' },
  BRA: { titles: 5, bestPerf: 'pentacampeón', dt: 'Carlo Ancelotti' },
  URU: { titles: 2, bestPerf: 'campeón 1930, 1950', dt: 'Marcelo Bielsa' },
  PAR: { titles: 0, bestPerf: 'cuartos 2010', dt: 'Gustavo Alfaro' },
  COL: { titles: 0, bestPerf: 'cuartos 2014', dt: 'Néstor Lorenzo' },
  ECU: { titles: 0, bestPerf: 'octavos 2006', dt: 'Sebastián Beccacece' },
  MEX: { titles: 0, bestPerf: 'cuartos 1970, 1986', dt: 'Javier Aguirre' },
  USA: { titles: 0, bestPerf: 'cuartos 2002', dt: 'Mauricio Pochettino' },
  CAN: { titles: 0, bestPerf: '3ra participación mundialista', dt: 'Jesse Marsch' },
  FRA: { titles: 2, bestPerf: 'campeón 1998, 2018', dt: 'Didier Deschamps' },
  ESP: { titles: 1, bestPerf: 'campeón 2010', dt: 'Luis de la Fuente' },
  JPN: { titles: 0, bestPerf: 'octavos 2002, 2010, 2018, 2022', dt: 'Hajime Moriyasu' },
};

// BTS histórico: curaduría hardcodeada de videos oficiales de YouTube por selección.
// Piloto: solo Argentina cargada. Los IDs son los de la URL de YouTube (ver instrucciones del sprint 4d-3e).
// Para sumar otra selección, agregá una entrada con su código (ej. BRA: [...]).
const TEAM_BTS_VIDEOS: Record<string, BtsVideo[]> = {
  ARG: [
    { id: 'MCWJNOfJoSM', title: 'la tercera estrella', blurb: 'la noche que esperamos 36 años: campeones en Qatar, en penales, ante Francia.' },
    { id: 'NRG6RNaKlWo', title: 'el Maracanazo de Messi', blurb: 'Copa América 2021: el primer título con la mayor, después de 28 años de sequía.' },
    { id: '4-7Ic5nzlW8', title: 'la vuelta a casa', blurb: 'millones en la calle para recibir a los campeones. el país entero, parado.' },
    { id: 'P_9nUzsB7jU', title: 'bicampeones de América', blurb: 'Copa América 2024: la confirmación de que esto no fue casualidad.' },
  ],
};

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  'decisivo': { bg: '#dcfce7', fg: '#14532d' },
  'drama': { bg: '#fee2e2', fg: '#7f1d1d' },
  'hito': { bg: '#dbeafe', fg: '#1e3a8a' },
  'preocupación': { bg: '#fef3c7', fg: '#78350f' },
  'preocupacion': { bg: '#fef3c7', fg: '#78350f' },
};

const TAG_LABELS: Record<string, string> = {
  'decisivo': '⚡ decisivo',
  'drama': '💔 drama',
  'hito': '🏆 hito',
  'preocupación': '⚠️ preocupación',
  'preocupacion': '⚠️ preocupación',
};

const FALLBACK_TAG = { bg: '#f5f5f4', fg: '#57534e' };

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  'clasificado': { bg: '#dcfce7', fg: '#14532d' },
  'repechaje': { bg: '#fef3c7', fg: '#78350f' },
  'en lucha': { bg: '#dbeafe', fg: '#1e3a8a' },
  'eliminado': { bg: '#fee2e2', fg: '#7f1d1d' },
};

function formatHeroLine(hero: HeroData | undefined): string {
  if (!hero) return '';
  const parts: string[] = [];
  if (hero.titles > 0) {
    parts.push(`${hero.titles} mundial${hero.titles > 1 ? 'es' : ''} (${hero.bestPerf})`);
  } else {
    parts.push(hero.bestPerf);
  }
  parts.push(`DT: ${hero.dt}`);
  return parts.join(' · ');
}

export default function RoadToWorldCup({ tribe }: RoadToWorldCupProps) {
  const [activeTeam, setActiveTeam] = useState<string | null>(tribe[0] || null);
  const [road, setRoad] = useState<RoadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preWarmedRef = useRef(false);

  useEffect(() => {
    if (!preWarmedRef.current && tribe.length > 0) {
      preWarmedRef.current = true;
      tribe.forEach(code => { fetch(`/api/road/${code}`).catch(() => { }); });
    }
  }, [tribe]);

  useEffect(() => {
    if (tribe.length === 0) {
      setActiveTeam(null);
      setRoad(null);
      return;
    }
    if (!activeTeam || !tribe.includes(activeTeam)) {
      setActiveTeam(tribe[0]);
    }
  }, [tribe, activeTeam]);

  useEffect(() => {
    if (!activeTeam) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/road/${activeTeam}`)
      .then(res => res.json())
      .then((data: RoadData) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setRoad(null);
        } else {
          setRoad(data);
        }
      })
      .catch(e => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeTeam]);

  if (tribe.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-xs text-stone-500">Activá selecciones en &ldquo;mi tribu&rdquo; arriba para ver su camino al Mundial.</p>
      </div>
    );
  }

  const heroData = activeTeam ? TEAM_HERO_DATA[activeTeam] : undefined;
  const btsVideos = activeTeam ? TEAM_BTS_VIDEOS[activeTeam] ?? [] : [];

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {tribe.map(t => (
          <button
            key={t}
            onClick={() => setActiveTeam(t)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${t === activeTeam
              ? 'border-orange-300 bg-orange-50 text-orange-950'
              : 'border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
          >
            {TEAM_NAMES[t] || t}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-xs text-stone-400">Claude está armando el camino de {TEAM_NAMES[activeTeam || ''] || activeTeam}...</p>
      )}

      {error && !loading && (
        <p className="text-xs text-stone-400">No se pudo cargar: {error}</p>
      )}

      {road && !loading && (
        <div>
          <div className="mb-4">
            <div className="flex items-start gap-3">
              {activeTeam && <TeamBadge code={activeTeam} size="lg" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-stone-900">{road.teamName}</h3>
                  <span
                    className="shrink-0 rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider"
                    style={{
                      backgroundColor: STATUS_COLORS[road.status]?.bg || '#f5f5f4',
                      color: STATUS_COLORS[road.status]?.fg || '#57534e',
                    }}
                  >
                    {road.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-stone-500">
                  {formatHeroLine(heroData)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">{road.headline}</p>
          </div>

          <ol className="space-y-3">
            {road.moments.map((m, i) => {
              const tc = TAG_COLORS[m.tag] || FALLBACK_TAG;
              const tl = TAG_LABELS[m.tag] || m.tag;
              return (
                <li key={i} className="relative border-l-2 border-stone-200 pl-4">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-stone-300" />
                  <div className="text-[10px] uppercase tracking-wider text-stone-400">{m.date}</div>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-xs font-medium text-stone-900">{m.title}</span>
                    <span
                      className="rounded px-1.5 py-px text-[9px] font-medium uppercase tracking-wider"
                      style={{ backgroundColor: tc.bg, color: tc.fg }}
                    >
                      {tl}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">{m.narrative}</p>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 border-t border-stone-100 pt-3 text-xs italic leading-relaxed text-stone-500">
            {road.outlook}
          </div>

          {btsVideos.length > 0 && (
            <div className="mt-4 border-t border-stone-100 pt-3">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-stone-500">el camino en video</h4>
              <div className="grid grid-cols-2 gap-2">
                {btsVideos.map(v => (
                  <a key={v.id + v.title} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-md border border-stone-100 transition-colors hover:bg-stone-50">
                    <div className="relative aspect-video w-full overflow-hidden bg-stone-100">
                      <img src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt={v.title} loading="lazy" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 transition-colors group-hover:bg-black/75">
                          <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-white"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] font-medium leading-tight text-stone-900">{v.title}</div>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-stone-500">{v.blurb}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {road.cached && (
            <div className="mt-2 text-right text-[9px] text-stone-400">cacheado · refresca en 24h</div>
          )}
        </div>
      )}
    </div>
  );
}
