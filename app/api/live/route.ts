import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';
import { teamES } from '@/lib/teams';

// fuente de LIVE: API no oficial de ESPN (gratis, sin auth, casi tiempo real).
// va SIEMPRE detrás de este endpoint con cache + degradación: nunca se llama desde el cliente.
// si ESPN cambia o cae, servimos el último bueno conocido (stale) y el front degrada a football-data.
const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const LIVE_CACHE_KEY = 'live:scoreboard';
const LIVE_CACHE_TTL = 24 * 60 * 60;   // 1d en redis: último bueno conocido
const MAX_AGE_LIVE = 30 * 1000;        // 30s si hay algún partido en vivo
const MAX_AGE_IDLE = 10 * 60 * 1000;   // 10min si no hay nada en vivo

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

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

// shape PARCIAL y defensivo de ESPN: solo lo que usamos. ESPN puede cambiar, así que validamos todo.
interface EspnCompetitor { homeAway?: string; score?: string; team?: { displayName?: string }; }
interface EspnCompetition { status?: { displayClock?: string; type?: { state?: string } }; venue?: { fullName?: string; address?: { city?: string } }; competitors?: EspnCompetitor[]; }
interface EspnEvent { id?: string; date?: string; competitions?: EspnCompetition[]; }

type Cached = { items: LiveItem[]; updatedAt: number; hasLive: boolean };

function fmtAR(utc: string): { date: string; time: string } {
  const d = new Date(new Date(utc).getTime() - 3 * 3600 * 1000);
  return {
    date: `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`,
    time: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
  };
}

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

function mapStatus(state: string | undefined): 'scheduled' | 'live' | 'finished' {
  if (state === 'in') return 'live';
  if (state === 'post') return 'finished';
  return 'scheduled';
}

export async function GET(req: Request) {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';
  const cached = await cacheGet<Cached>(LIVE_CACHE_KEY);

  // TTL dinámico: si el último resultado tenía algún partido en vivo, refrescamos seguido (30s);
  // si no, cada 10min. así no martillamos a ESPN salvo cuando hay pelota rodando.
  const maxAge = cached?.hasLive ? MAX_AGE_LIVE : MAX_AGE_IDLE;
  if (cached && !forceRefresh && Date.now() - cached.updatedAt < maxAge) {
    return NextResponse.json({ items: cached.items, updatedAt: cached.updatedAt, hasLive: cached.hasLive, cached: true });
  }

  const serveStaleOr = (fallback: Record<string, unknown>) => {
    if (cached && cached.items.length > 0) {
      return NextResponse.json({ items: cached.items, updatedAt: cached.updatedAt, hasLive: cached.hasLive, cached: true, stale: true });
    }
    return NextResponse.json({ items: [], updatedAt: Date.now(), hasLive: false, ...fallback });
  };

  // ventana: de ayer a +3 días. cubre el "hoy" en cualquier huso y deja ver el próximo partido.
  const now = Date.now();
  const url = `${ESPN_URL}?dates=${ymd(new Date(now - 24 * 3600 * 1000))}-${ymd(new Date(now + 3 * 24 * 3600 * 1000))}&limit=200`;

  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) {
      return serveStaleOr({ error: 'espn no respondió bien', debug: { httpStatus: res.status } });
    }

    const data = await res.json();
    const events: EspnEvent[] = Array.isArray(data?.events) ? data.events : [];
    events.sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());

    const items: LiveItem[] = [];
    for (const ev of events) {
      if (!ev.date) continue;
      const comp = ev.competitions?.[0];
      if (!comp || !Array.isArray(comp.competitors) || comp.competitors.length < 2) continue;
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      if (!home?.team?.displayName || !away?.team?.displayName) continue;

      const status = mapStatus(comp.status?.type?.state);
      const { date, time } = fmtAR(ev.date);
      const venueName = comp.venue?.fullName ?? '';
      const city = comp.venue?.address?.city ?? '';

      const item: LiveItem = {
        id: String(ev.id ?? ''),
        date, time,
        home: teamES(home.team.displayName),
        away: teamES(away.team.displayName),
        status,
        venue: city ? `${venueName} · ${city}` : venueName,
      };
      if (status === 'live' && comp.status?.displayClock) item.minute = comp.status.displayClock;
      if (status !== 'scheduled') {
        const hs = parseInt(home.score ?? '', 10);
        const as = parseInt(away.score ?? '', 10);
        if (!Number.isNaN(hs) && !Number.isNaN(as)) { item.homeScore = hs; item.awayScore = as; }
      }
      items.push(item);
    }

    if (items.length === 0) {
      return serveStaleOr({ count: 0, debug: { totalEvents: events.length } });
    }

    const hasLive = items.some(i => i.status === 'live');
    const payload: Cached = { items, updatedAt: Date.now(), hasLive };
    await cacheSet(LIVE_CACHE_KEY, payload, LIVE_CACHE_TTL);
    return NextResponse.json({ items, updatedAt: Date.now(), count: items.length, hasLive });
  } catch (e) {
    return serveStaleOr({ error: e instanceof Error ? e.message : 'error al consultar espn' });
  }
}
