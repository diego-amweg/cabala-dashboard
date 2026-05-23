import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';

const API_BASE = 'https://api.football-data.org/v4';
const FIXTURES_CACHE_KEY = 'fixtures:groups';
const FIXTURES_CACHE_TTL = 60 * 60; // 1h

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

// nombres de selecciones inglés -> español. lo que no esté acá sale con el nombre
// original de football-data (fallback) y lo agregamos al verlo.
const TEAM_ES: Record<string, string> = {
  'Argentina': 'Argentina', 'Brazil': 'Brasil', 'Uruguay': 'Uruguay', 'Paraguay': 'Paraguay',
  'Colombia': 'Colombia', 'Ecuador': 'Ecuador', 'Mexico': 'México', 'USA': 'Estados Unidos',
  'United States': 'Estados Unidos', 'Canada': 'Canadá', 'France': 'Francia', 'Spain': 'España',
  'Japan': 'Japón', 'England': 'Inglaterra', 'Germany': 'Alemania', 'Netherlands': 'Países Bajos',
  'Portugal': 'Portugal', 'Croatia': 'Croacia', 'Morocco': 'Marruecos', 'Senegal': 'Senegal',
  'Belgium': 'Bélgica', 'Switzerland': 'Suiza', 'Italy': 'Italia', 'South Korea': 'Corea del Sur',
  'Korea Republic': 'Corea del Sur', 'Saudi Arabia': 'Arabia Saudita', 'Iran': 'Irán',
  'Australia': 'Australia', 'Qatar': 'Catar', 'Tunisia': 'Túnez', 'Algeria': 'Argelia',
  'Egypt': 'Egipto', 'Nigeria': 'Nigeria', 'Ghana': 'Ghana', 'Ivory Coast': 'Costa de Marfil',
  "Côte d'Ivoire": 'Costa de Marfil', 'Cameroon': 'Camerún', 'South Africa': 'Sudáfrica',
  'Cape Verde': 'Cabo Verde', 'Cape Verde Islands': 'Cabo Verde', 'Curacao': 'Curazao',
  'Curaçao': 'Curazao', 'Panama': 'Panamá', 'Costa Rica': 'Costa Rica', 'Honduras': 'Honduras',
  'Jamaica': 'Jamaica', 'Haiti': 'Haití', 'New Zealand': 'Nueva Zelanda', 'Jordan': 'Jordania',
  'Uzbekistan': 'Uzbekistán', 'Norway': 'Noruega', 'Scotland': 'Escocia', 'Austria': 'Austria',
  'Denmark': 'Dinamarca', 'Poland': 'Polonia', 'Czech Republic': 'República Checa',
  'Turkey': 'Turquía', 'Greece': 'Grecia', 'Wales': 'Gales', 'Ukraine': 'Ucrania',
  'Sweden': 'Suecia', 'Serbia': 'Serbia',
  'Czechia': 'República Checa', 'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
  'Iraq': 'Irak', 'Congo DR': 'RD del Congo',
};

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function fmtAR(utcDate: string): { date: string; time: string } {
  // football-data manda utcDate ISO en UTC. argentina = utc-3 fijo (sin horario de verano)
  const d = new Date(new Date(utcDate).getTime() - 3 * 3600 * 1000);
  const date = `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
  const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return { date, time };
}

function mapStatus(status: string): 'scheduled' | 'live' | 'finished' {
  if (['FINISHED', 'AWARDED'].includes(status)) return 'finished';
  if (['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT', 'SUSPENDED'].includes(status)) return 'live';
  return 'scheduled'; // SCHEDULED, TIMED, POSTPONED, CANCELLED
}

function teamES(name: string): string {
  return TEAM_ES[name] ?? name;
}

function phaseLabel(group: string | null): string {
  if (group && group.startsWith('GROUP_')) return `grupo ${group.split('_')[1]}`;
  return 'fase de grupos';
}

export async function GET(req: Request) {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';

  if (!forceRefresh) {
    const cached = await cacheGet<{ items: FixtureItem[]; updatedAt: number }>(FIXTURES_CACHE_KEY);
    if (cached) {
      return NextResponse.json({ items: cached.items, updatedAt: cached.updatedAt, cached: true });
    }
  }

  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) {
    return NextResponse.json({ items: [], updatedAt: Date.now(), error: 'falta la API key de football-data' });
  }

  try {
    const res = await fetch(`${API_BASE}/competitions/WC/matches?season=2026`, { headers: { 'X-Auth-Token': key } });
    const data = await res.json();

    if (!data.matches || !Array.isArray(data.matches)) {
      return NextResponse.json({
        items: [], updatedAt: Date.now(), error: 'respuesta inesperada de football-data',
        debug: { httpStatus: res.status, apiMessage: data.message ?? null, keys: Object.keys(data) },
      });
    }

    const groupMatches = data.matches
      .filter((m: any) => m.stage === 'GROUP_STAGE')
      .sort((a: any, b: any) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

    const items: FixtureItem[] = groupMatches.map((m: any) => {
      const { date, time } = fmtAR(m.utcDate);
      const status = mapStatus(m.status);
      const item: FixtureItem = {
        id: String(m.id),
        date, time,
        home: teamES(m.homeTeam?.name ?? 'por definir'),
        away: teamES(m.awayTeam?.name ?? 'por definir'),
        phase: phaseLabel(m.group),
        venue: m.venue ?? '',
        status,
      };
      const hs = m.score?.fullTime?.home;
      const as = m.score?.fullTime?.away;
      if (status !== 'scheduled' && hs !== null && hs !== undefined && as !== null && as !== undefined) {
        item.homeScore = hs;
        item.awayScore = as;
      }
      return item;
    });

    if (items.length === 0) {
      const stages = Array.from(new Set(data.matches.map((m: any) => m.stage)));
      return NextResponse.json({
        items: [], updatedAt: Date.now(), count: 0,
        debug: { totalReceived: data.matches.length, stages, resultSet: data.resultSet ?? null },
      });
    }

    await cacheSet(FIXTURES_CACHE_KEY, { items, updatedAt: Date.now() }, FIXTURES_CACHE_TTL);

    return NextResponse.json({ items, updatedAt: Date.now(), count: items.length });
  } catch {
    return NextResponse.json({ items: [], updatedAt: Date.now(), error: 'error al consultar football-data' });
  }
}