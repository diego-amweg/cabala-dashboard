import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';

const PULSE_CACHE_KEY = 'pulse:global';
const PULSE_CACHE_TTL = 6 * 60 * 60; // 6h (los datos de wikipedia son diarios)
const UA = 'CabalaDashboard/1.0 (https://cabala-dashboard.vercel.app; mundial 2026)';

// artículos del Mundial 2026 en varios idiomas grandes. la suma de sus visitas es la
// señal de "atención mundial". si un título cambia o falla, se saltea (no rompe el total).
const WC_ARTICLES: { project: string; article: string }[] = [
  { project: 'en.wikipedia.org', article: '2026 FIFA World Cup' },
  { project: 'es.wikipedia.org', article: 'Copa Mundial de Fútbol de 2026' },
  { project: 'pt.wikipedia.org', article: 'Copa do Mundo FIFA de 2026' },
  { project: 'fr.wikipedia.org', article: 'Coupe du monde de football 2026' },
  { project: 'de.wikipedia.org', article: 'Fußball-Weltmeisterschaft 2026' },
  { project: 'it.wikipedia.org', article: 'Campionato mondiale di calcio 2026' },
];

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

async function fetchSeries(project: string, article: string, start: string, end: string): Promise<Map<string, number>> {
  const enc = encodeURIComponent(article.replace(/ /g, '_'));
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${project}/all-access/all-agents/${enc}/daily/${start}/${end}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/json' } });
  if (!res.ok) return new Map();
  const data = await res.json();
  const m = new Map<string, number>();
  if (Array.isArray(data.items)) {
    for (const it of data.items) {
      const day = String(it.timestamp).slice(0, 8);
      m.set(day, (m.get(day) ?? 0) + (it.views ?? 0));
    }
  }
  return m;
}

export async function GET(req: Request) {
  const forceRefresh = new URL(req.url).searchParams.get('refresh') === 'true';

  if (!forceRefresh) {
    const cached = await cacheGet<Record<string, unknown>>(PULSE_CACHE_KEY);
    if (cached) return NextResponse.json({ ...cached, cached: true });
  }

  // ventana: 16 días hasta anteayer (wikipedia publica con ~1-2 días de delay)
  const end = new Date(Date.now() - 2 * 24 * 3600 * 1000);
  const start = new Date(end.getTime() - 15 * 24 * 3600 * 1000);
  const startStr = ymd(start);
  const endStr = ymd(end);

  try {
    const results = await Promise.all(
      WC_ARTICLES.map(a =>
        fetchSeries(a.project, a.article, startStr, endStr)
          .then(series => ({ ...a, series }))
          .catch(() => ({ ...a, series: new Map<string, number>() }))
      )
    );

    const byDay = new Map<string, number>();
    const sources: { project: string; got: boolean }[] = [];
    for (const r of results) {
      sources.push({ project: r.project, got: r.series.size > 0 });
      for (const [day, v] of r.series) byDay.set(day, (byDay.get(day) ?? 0) + v);
    }

    const days = Array.from(byDay.keys()).sort();
    const series = days.map(d => ({ day: d, views: byDay.get(d)! }));

    if (series.length === 0) {
      return NextResponse.json({ pulse: 0, today: 0, trendPct: 0, series: [], updatedAt: Date.now(), error: 'sin datos de wikipedia', debug: { startStr, endStr, sources } });
    }

    const today = series[series.length - 1].views;
    const half = Math.max(1, Math.floor(series.length / 2));
    const baselineAvg = series.slice(0, half).reduce((s, x) => s + x.views, 0) / half;
    const weekAgoIdx = Math.max(0, series.length - 8);
    const weekAgo = series[weekAgoIdx].views;
    const trendPct = weekAgo > 0 ? Math.round(((today - weekAgo) / weekAgo) * 100) : 0;
    // pulso 0-100: hoy relativo al baseline (50 = baseline, 100 = 2x o más). crece con la atención.
    const pulse = baselineAvg > 0 ? Math.max(1, Math.min(100, Math.round((today / baselineAvg) * 50))) : 50;

    const payload = { pulse, today, trendPct, series, updatedAt: Date.now(), debug: { sources, baselineAvg: Math.round(baselineAvg), window: `${startStr}-${endStr}` } };
    await cacheSet(PULSE_CACHE_KEY, payload, PULSE_CACHE_TTL);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ pulse: 0, today: 0, trendPct: 0, series: [], updatedAt: Date.now(), error: 'error al consultar wikipedia' });
  }
}