# Cábala — Documento de Contexto

> *La superstición se hizo software.*

Plataforma personal para vivir el Mundial 2026 como fenómeno cultural total, no solo como torneo deportivo. Termómetro global configurable, en tiempo real, asistido por IA.

## Estado del proyecto

- **Sprint actual**: Sprint 0 — setup base
- **Última actualización**: mayo 2026
- **Días al kickoff**: ~32 (11 de junio de 2026)
- **URL del repo**: https://github.com/diego-amweg/cabala-dashboard
- **URL pública (preview)**: pendiente de confirmar
- **URL pública (producción)**: pendiente de dominio propio

## Usuario primario

- **Nombre**: Diego (`diego-amweg`)
- **Ubicación**: Tostado, Santa Fe, Argentina
- **Idioma**: español rioplatense
- **Perfil futbolero**: no fanático, pero quiere vivir el Mundial inmersivamente
- **Nivel técnico**: cero — todo se hace vía github.com web UI, sin terminal
- **Modelo de uso inicial**: app personal; eventual apertura a otros usuarios bajo modelo de suscripción si el proyecto madura

## Visión

Reemplazar la experiencia fragmentada de "abrir 8 pestañas durante un partido" con un único panel de control configurable que agregue:
- Estado deportivo en vivo (partidos, datos, eliminatorias)
- Sentimiento social por selección y momento
- Cultura fan en cada ciudad sede (calle, fan zones, tailgates)
- Memes, polémicas, peleas, virales
- Trayectos de hinchas viajeros (vlogs, social posts)
- Briefings y análisis generados por IA
- Capa AR/VR para experiencias inmersivas

## Filosofía

1. **Configurable antes que opinado** — cada usuario activa solo los módulos que le interesan; nada se le impone.
2. **Cultural antes que estadístico** — los datos importan, pero la pasión, las cábalas, los cantos y las peleas en bares importan más.
3. **Tiempo real cuando suma** — no actualizar por actualizar; cada refresh debe traer información nueva relevante.
4. **IA como copiloto, no como reemplazo** — Claude no decide qué te importa; vos decidís, y Claude te ayuda a encontrarlo más rápido.
5. **Personal-first, multi-tenant después** — empezamos como app individual; si crece, sumamos auth y billing.

## Arquitectura técnica

### Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Hosting**: Vercel (Hobby plan inicialmente, Pro cuando sume tráfico)
- **Base de datos**: Supabase (Postgres) — pendiente Sprint 1
- **Cache**: Upstash Redis — pendiente Sprint 2
- **IA**: Anthropic Claude API (Sonnet 4.6 para análisis a escala, Opus 4.7 para conversación contigo)
- **Workers**: Vercel Cron Jobs

### Capas
1. **Frontend**: dashboard configurable + chat con Claude
2. **API layer**: serverless functions en Vercel
3. **Procesamiento**: Claude API para sentiment, dedup, tagging
4. **Storage**: Postgres (estado persistente) + Redis (cache de feeds)
5. **Ingestion**: cron jobs pulleando fuentes externas a intervalos definidos

## Catálogo de módulos

| # | Módulo | Estado | Sprint |
|---|--------|--------|--------|
| 1 | Ojo de Dios (mapa de sedes) | mock | 1 |
| 2 | Sentimiento por selección | mock | 1 |
| 3 | Sufrimiento compartido | mock | 1 |
| 4 | Memes y polémicas | mock | 2 |
| 5 | En las calles | mock | 2 |
| 6 | Camino al Mundial | diseñado | 3 |
| 7 | Viaje del hincha | diseñado | 3 |
| 8 | Capa AR/VR | diseñado | 4 |
| 9 | Asistente Claude | diseñado | 2 |
| 10 | Briefings automáticos | diseñado | 3 |

Estados: `diseñado` → `mock` (con datos simulados) → `vivo` (con datos reales)

## Fuentes de datos planeadas

| Fuente | API | Costo | Sprint |
|--------|-----|-------|--------|
| Reddit | Reddit API | Gratis | 1 |
| YouTube | YouTube Data v3 | Gratis | 2 |
| Bluesky | AT Protocol | Gratis | 2 |
| Datos del torneo | football-data.org | $25/mes | 2 |
| Noticias | GDELT Project | Gratis | 3 |
| TikTok | Apify | ~$50/mes | 3 |
| Google Trends | unofficial wrappers | Gratis | 3 |
| Snap Map | embed iframe | Gratis | 4 |
| FIFA+ | scraping cuidadoso | Gratis (gris) | 4 |

**Decisión deliberada**: NO usar X API (costo prohibitivo + riesgos de scraping). Reemplazado por Bluesky + Reddit + Google Trends.

## Costos operativos estimados

- **Sprint 0-1 (mock data)**: ~$0/mes
- **Sprint 2 (primeras fuentes reales)**: ~$50/mes
- **Sprint 3 (todas las fuentes)**: ~$150-250/mes
- **Producción durante el Mundial**: ~$300-500/mes

## Decisiones tomadas (ADR log)

1. **Nombre del producto**: Cábala. Elegido por profundidad cultural en fútbol latinoamericano y diferenciación clara.
2. **Dominio inicial**: subdominio de Vercel (`*.vercel.app`). Dominio propio se decide en Sprint 3.
3. **Modelo de monetización**: ninguno por ahora. Si se abre al público, suscripción mensual con tier gratuito limitado.
4. **Sin X API**: descartada por costos y riesgos legales del scraping. Reemplazada por Bluesky + Reddit + Google Trends.
5. **Idioma del producto**: español. Inglés solo si se internacionaliza.
6. **Stack frontend**: Next.js + Tailwind. Elegido por simplicidad de deploy en Vercel y curva amigable para usuario no técnico.

## Convenciones

- **Nombre del repo**: `cabala-dashboard` (sin tilde por restricción de GitHub)
- **Commits**: mensajes en español, presente, descriptivos. Ej: "agrega módulo de mapa con datos mock"
- **Branches**: trabajamos sobre `main` directamente en esta etapa. Si crece el equipo, sumamos PRs.
- **Archivos**: kebab-case para nombres (`fan-journey.tsx`, no `FanJourney.tsx`)
- **Componentes React**: PascalCase para el nombre del componente, kebab-case para el archivo
