import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';

const RELATO_CACHE_KEY = 'relato:dia';
const RELATO_CACHE_TTL = 7 * 24 * 60 * 60; // 7d
const RELATO_MAX_AGE = 20 * 60 * 60 * 1000; // 20h (~diario)

// shapes mínimos de lo que leemos de cada cache (lo justo para el relato, sin any)
interface PulseCache { pulse?: number; trendPct?: number; }
interface HeatTeam { name: string; heat: number; }
interface HeatCache { teams?: HeatTeam[]; }
interface FixtureLite { status: string; home: string; away: string; date: string; time: string; }
interface FixturesCache { items?: FixtureLite[]; }

export async function GET(req: Request) {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';
  const cached = await cacheGet<{ relato: string; updatedAt: number }>(RELATO_CACHE_KEY);

  if (cached && !forceRefresh && Date.now() - cached.updatedAt < RELATO_MAX_AGE) {
    return NextResponse.json({ relato: cached.relato, updatedAt: cached.updatedAt, cached: true });
  }

  const serveStaleOr = (fallback: Record<string, unknown>) => {
    if (cached && cached.relato) {
      return NextResponse.json({ relato: cached.relato, updatedAt: cached.updatedAt, cached: true, stale: true });
    }
    return NextResponse.json({ relato: '', updatedAt: Date.now(), ...fallback });
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return serveStaleOr({ error: 'no api key configurada' });

  try {
    const pulseCache = await cacheGet<PulseCache>('pulse:global');
    const heatCache = await cacheGet<HeatCache>('heat:teams');
    const fixturesCache = await cacheGet<FixturesCache>('fixtures:groups');

    let pulseStr = 'sin datos';
    if (pulseCache && typeof pulseCache.pulse === 'number') {
      pulseStr = `Nivel ${pulseCache.pulse}/100`;
      if (typeof pulseCache.trendPct === 'number') {
        pulseStr += ` (tendencia semanal: ${pulseCache.trendPct > 0 ? '+' : ''}${pulseCache.trendPct}%)`;
      }
    }

    let heatStr = 'sin datos';
    if (heatCache?.teams && heatCache.teams.length > 0) {
      const suda = ['Argentina', 'Brasil', 'Uruguay', 'Colombia', 'Ecuador', 'Paraguay'];
      heatStr = heatCache.teams.slice(0, 4)
        .map(t => `${t.name}${suda.includes(t.name) ? ' (sudamericana)' : ''} con calor ${t.heat}`)
        .join(', ');
    }

    let fixturesStr = 'sin datos';
    if (fixturesCache?.items) {
      const upcoming = fixturesCache.items.filter(f => f.status === 'scheduled').slice(0, 3);
      if (upcoming.length > 0) {
        fixturesStr = upcoming.map(f => `${f.home} vs ${f.away} (${f.date} a las ${f.time})`).join(', ');
      }
    }

    const prompt = `Sos el relator editorial de Cábala, el dashboard del Mundial 2026, escribiendo para un hincha argentino. Escribís en español rioplatense, tono editorial con personalidad, cálido y futbolero, sin solemnidad.

DATOS REALES DEL DÍA:
- Pulso global (atención mundial): ${pulseStr}
- Termómetro (selecciones más calientes): ${heatStr}
- Próximos partidos: ${fixturesStr}

REGLAS ESTRICTAS:
- Usá SOLO estos datos. NO inventes resultados, números, posiciones ni hechos. Si un dato no está, no lo menciones. No nombres partidos que no estén en la lista de Próximos partidos.
- Si hay alguna selección sudamericana en el Termómetro (indicada en los datos), podés destacarla, especialmente si es Argentina.
- Salida: 2 a 3 frases máximo.
- Formato: Texto plano. Sin títulos, sin emojis, sin comillas. Devolvé SOLO el relato.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return serveStaleOr({ error: `claude HTTP ${res.status}: ${errText.slice(0, 200)}`, debug: { pulseStr, heatStr, fixturesStr } });
    }

    const data = await res.json();
    const responseText: string = (data?.content?.[0]?.text ?? '').trim();

    if (!responseText) {
      return serveStaleOr({ error: 'respuesta vacia de claude', debug: { pulseStr, heatStr, fixturesStr } });
    }

    await cacheSet(RELATO_CACHE_KEY, { relato: responseText, updatedAt: Date.now() }, RELATO_CACHE_TTL);
    return NextResponse.json({ relato: responseText, updatedAt: Date.now(), cached: false, debug: { pulseStr, heatStr, fixturesStr } });
  } catch (e) {
    return serveStaleOr({ error: e instanceof Error ? e.message : 'unknown' });
  }
}
