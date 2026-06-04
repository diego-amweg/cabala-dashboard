# Cábala — contexto vivo

> Estado actual del proyecto. Reemplaza al "minicontexto". Se actualiza al cierre de cada sesión que produzca cambios. CLAUDE.md sigue siendo la fuente de verdad de reglas/convenciones; PROJECT.md guarda los ADR; SESSIONS/ el log por sesión.

## qué es / norte
Cábala = dashboard editorial del Mundial 2026. Norte (ADR 38): el pulso emocional del mundo durante el Mundial, en clave positiva. No reemplaza la app de FIFA; la ventaja es personalidad editorial e inmersión cultural, no cantidad de features. Usuario tipo: hincha argentino. Sin login (principio). Vida útil hasta julio 2026.

## stack / infra
- Next.js 16.2.4 (App Router) + TypeScript estricto + Tailwind.
- Deploy Vercel (cabala-dashboard.vercel.app). Local ~/projects/cabala (WSL). Repo público github.com/diego-amweg/cabala-dashboard.
- Cache: Upstash Redis (helper lib/cache.ts: cacheGet/cacheSet). NO Vercel KV (ya no existe).
- APIs: football-data.org (fútbol, header X-Auth-Token, env FOOTBALLDATA_KEY) · Wikipedia/Wikimedia (atención) · Bluesky (memes) · YouTube (BTS) · Giphy (gifs) · Anthropic Haiku (filtros/relatos).
- Nombres EN→ES en lib/teams.ts (teamES con fallback).

## estado por módulo
- **header / pulso global**: real vía Wikipedia (/api/pulse, atención mundial 6 idiomas, 0-100 + tendencia + serie, cache 6h). ADR 38. FAKE pendiente: el header simula Mundial en curso (partido actual/próximo, día, cronómetro) — placeholder hasta el arranque.
- **termómetro mundial** (corazón / paso 2): REAL, a 48. Mide atención (no cariño) vía Wikipedia, declarado honestamente. /api/heat deriva las 48 de football-data (escudo + tla), resuelve el título canónico en en.wikipedia (sigue redirects) + overrides "soccer/men's" para casos especiales, mide pageviews EN, heat 0-100 sqrt. Concurrencia limitada (5) + retry ante hipo de red. Robustez stale-on-error. Thermometer.tsx: treemap squarified (área ∝ calor) + latido por calor (respeta prefers-reduced-motion) + escudos de football-data + toggle "mi tribu"/"las 48". ADR 40 (v1, 12) + ADR 41 (a 48) + ADR 42 (idioma nativo). Mide en inglés + idioma nativo de cada país (langlinks de Wikipedia, vistas sumadas); podio menos anglocéntrico.
- **calendario** (/api/fixtures) y **fase de grupos** (/api/standings): reales desde football-data. 12 grupos, 48 equipos derivados de los partidos, posiciones que se llenan durante el torneo. Robustez stale-on-error + reintentos en el front. ADRs 36, 37, 39. Pendiente: resultados en vivo, bracket (cuando football-data cargue ~27 jun).
- **memes/peleas** (Bluesky): real. Hashtags reales como query, filtro keep/reject con Haiku, feed cacheado en Redis TTL 15min. ADR 35. Pendiente: evitar re-clasificar en frío (gasto de saldo).
- **gifs del Mundial**: real (Giphy, por tribu, mp4 lazy). ADRs 31, 32.
- **el camino en video / BTS**: piloto Argentina hardcodeado; road con Haiku (cacheado 24h). ADRs 29, 30, 33. Pendiente: escalar BTS al resto (4d-3e abierto), BTS live (sprint 8).
- **capa inmersiva**: covers + agrupación por accesibilidad. ADR 28.
- **ticker "en las calles"**: control por drag/teclado/hover, sin botones (decisión).
- **mapa de sedes**: FAKE (intensidad random).

## fakes intencionales (a reemplazar)
- header: Mundial en curso simulado (partido/día/cronómetro) — placeholder hasta jun 2026.
- mapa de sedes: intensidad random.

## pendientes en orden
1. Ganchos del corazón: "hacelo tuyo" (CTA elegí selección, localStorage, sin login), "relato del día" (LLM), "cábalas" (curadas → UGC con alias auto + login OPCIONAL, moderación Haiku).
2. Mapa de pulso local de las sedes (gente/eventos alrededor de estadios; difícil, sin API obvia).
3. Arranque Mundial (11 jun): resultados en vivo (ticker+calendario con marcadores, bajar TTL en días de partido), bracket (FixtureBracket). Arquitectura pull+cache on-demand (NO cron/GitHub Actions).

## backlog técnico
- Upstash free tier (500k cmd/mes) a vigilar.
- npm audit (3 vulns transitivas, sin --force).
- Licencias de covers/BTS antes del público (bloqueante legal).
- Mensajes de error técnicos → amigables.
- Cachear feed de bluesky armado (carga en frío ~10-14s, gasto de Haiku).
- Unificar mapa de nombres (app/api/fixtures → importar de lib/teams.ts; hoy duplica).
- Road ~15s en frío (Haiku); evaluar precalentar.
- Dependencia del saldo de Anthropic = riesgo operativo durante el Mundial.
- Cleanup cosmético Tailwind v4 (Calendar max-h, Road -left).

## descartado (con motivo)
- Claude Code como ejecutor (ADR 27; control directo en VS Code).
- API-Football (su free no da 2026), Vercel KV (no existe), Google Trends (sin API oficial), Tenor (Google no toma clientes desde ene-2026), Bluesky para medir afecto (sesgo geográfico).
- Predictor con auth, AR/360, Panini, gamificación social, chat lateral en polls, botones visibles en ticker.

## principios operativos (resumen; CLAUDE.md es canónico)
- Rioplatense informal, UI en minúscula. Crítico y honesto, no complaciente. Preguntar antes de asumir.
- Autodiagnóstico en endpoints (ninguno falla en silencio).
- Robustez ante APIs externas: stale-on-error (último bueno en Redis, nunca cachear vacío, chequear res.ok).
- No dar por hecho lo no confirmado (verificar recursos; mkdir -p; cerrar scripts con verificación real, no echo optimista).
- Empatía con usuarios (accesibilidad, prefers-reduced-motion, mensajes humanos).
- Dashboard vivo en dos capas (movimiento sutil para quien lo acepta + dato real fresco para todos).
- Anti-pattern JSX: tags multi-atributo en una sola línea.
- Commits con paths específicos (nunca git add .); verificar que no entre .env.local.
