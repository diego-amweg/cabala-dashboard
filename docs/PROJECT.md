# Cábala — Documento de Contexto

> *La superstición se hizo software.*

Plataforma personal para vivir el Mundial 2026 como fenómeno cultural total, no solo como torneo deportivo. Termómetro global configurable, en tiempo real, asistido por IA.

## Estado del proyecto

- **Versión actual**: v0.6 — Sprint 4 completo (módulos faltantes + capa inmersiva)
- **Sprint completado**: 4c
- **Próximo sprint**: 5 — datos reales en módulos simulados
- **Última actualización**: mayo 2026
- **Días al kickoff**: ~31 (11 de junio de 2026)
- **URL del repo**: https://github.com/diego-amweg/cabala-dashboard
- **URL pública**: https://cabala-dashboard.vercel.app
- **URL pública con dominio propio**: pendiente Sprint 7

## Usuario primario

- **Nombre**: Diego
- **GitHub**: `diego-amweg`
- **Bluesky**: `diegoamweg.bsky.social`
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
- Asistente conversacional con contexto del dashboard

## Filosofía

1. **Configurable antes que opinado** — cada usuario activa solo los módulos que le interesan; nada se le impone.
2. **Cultural antes que estadístico** — los datos importan, pero la pasión, las cábalas, los cantos y las peleas en bares importan más.
3. **Tiempo real cuando suma** — no actualizar por actualizar; cada refresh debe traer información nueva relevante.
4. **IA como copiloto, no como reemplazo** — Claude no decide qué te importa; vos decidís, y Claude te ayuda a encontrarlo más rápido.
5. **Personal-first, multi-tenant después** — empezamos como app individual; si crece, sumamos auth y billing.

## Arquitectura técnica

### Stack en uso

- **Frontend**: Next.js 16.2 (App Router) + TypeScript + Tailwind CSS
- **Hosting**: Vercel (Hobby plan, gratis)
- **Base de datos**: ninguna por ahora (todo en cache en memoria); Supabase pendiente cuando haya estado persistente entre sesiones
- **Cache**: en memoria del proceso serverless (JWT de Bluesky, enhancements de Claude); Upstash Redis pendiente para cache compartida entre instancias
- **IA**: Anthropic Claude API
  - `claude-haiku-4-5-20251001` para clasificación y traducción de posts en batch (barato, suficiente para tarea estructurada)
  - `claude-sonnet-4-6` para conversación con el usuario (mejor naturalidad, ~$0.01/mensaje)
- **Workers**: ninguno por ahora; los fetches se hacen on-demand desde el frontend cada 5 min

### Estructura del repo

```
cabala-dashboard/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts        # Claude conversacional (Sonnet 4.6)
│   │   └── reddit/
│   │       └── route.ts        # Bluesky search + Claude classify (nombre legacy)
│   ├── layout.tsx              # Metadata global
│   └── page.tsx                # Dashboard principal
├── components/
│   └── Chat.tsx                # Asistente flotante
├── docs/
│   ├── CLAUDE.md               # Instrucciones para Claude
│   └── PROJECT.md              # Este documento
├── public/                     # Assets estáticos
└── (configs estándar Next.js)
```

### Variables de entorno (Vercel)

- `BLUESKY_HANDLE` — handle completo del usuario en Bluesky
- `BLUESKY_APP_PASSWORD` — App Password generada en Bluesky Settings
- `ANTHROPIC_API_KEY` — API key de console.anthropic.com

## Catálogo de módulos

| # | Módulo | Estado | Datos |
|---|--------|--------|-------|
| 1 | Ojo de Dios (mapa de sedes) | vivo | simulados |
| 2 | Sentimiento por selección | vivo | simulados |
| 3 | Sufrimiento compartido | vivo | simulados |
| 4 | Memes y polémicas | vivo | reales (Bluesky + Claude) |
| 5 | En las calles | vivo | simulados |
| 6 | Camino al Mundial | pendiente | — |
| 7 | Viaje del hincha | vivo | reales (YouTube + Claude tagea) |
| 8 | Capa AR/VR | vivo | catálogo hardcoded + recomendación claude |
| 9 | Asistente Claude | vivo | — |
| 10 | Briefings automáticos | pendiente | — |

Estados: `pendiente` → `diseñado` → `vivo (mock)` → `vivo (real)`

## Fuentes de datos

| Fuente | Estado | Costo | Notas |
|--------|--------|-------|-------|
| Bluesky (search posts) | conectada | gratis | App Password auth, JWT cacheado 14min |
| Anthropic Claude | conectada | ~$3-5/día con uso moderado | Haiku clasificación, Sonnet chat |
| Reddit | descartada | — | Self-service API cerrado en nov 2025 (ver ADR) |
| Google Trends | pendiente | gratis | Para sentimiento real (Sprint 5) |
| NewsAPI / GDELT | pendiente | gratis (GDELT) | Para módulo "Calle" (Sprint 5) |
| YouTube Data API | pendiente | gratis | Para "Viaje del hincha" (Sprint 4) |
| football-data.org | pendiente | $25/mes | Para datos del torneo (Sprint 5) |
| FIFA+ | pendiente | gratis (embed/scraping) | Para AR/VR layer (Sprint 4) |

## Costos operativos

### Actuales (post Sprint 3b)
- Vercel Hobby: $0
- Bluesky API: $0
- Anthropic Claude: ~$3-5/mes con uso personal moderado
- **Total: ~$5/mes**

### Estimación para el Mundial
- Vercel Hobby alcanza salvo que se abra al público
- Anthropic: $30-60/mes con uso intensivo durante el torneo
- football-data.org: $25/mes
- Dominio: $20/año amortizado a ~$2/mes
- **Total estimado: ~$60-90/mes durante junio-julio 2026**

## Decisiones tomadas (ADR log)

1. **Nombre del producto**: Cábala. Profundidad cultural en fútbol latinoamericano y diferenciación clara.
2. **Dominio inicial**: subdominio de Vercel (`*.vercel.app`). Dominio propio se decide en Sprint 7.
3. **Modelo de monetización**: ninguno por ahora. Si se abre al público, suscripción mensual con tier gratuito limitado.
4. **Sin X API**: descartada por costos y riesgos legales del scraping. Reemplazada por Bluesky.
5. **Idioma del producto**: español. Inglés solo si se internacionaliza.
6. **Stack frontend**: Next.js + Tailwind. Elegido por simplicidad de deploy en Vercel y curva amigable para usuario no técnico.
7. **Pivot Reddit → Bluesky** (Sprint 2): Reddit cerró self-service API access en noviembre 2025 bajo Responsible Builder Policy. Aprobación manual tarda semanas e incierta, y para nuestro caso podría ser rechazada. Bluesky tiene API abierta con autenticación simple (App Password, sin aprobación), comunidades futboleras crecientes en español, y cero fricción de setup.
8. **Modelo de IA por tarea** (Sprint 3a/3b): Haiku 4.5 para clasificación y traducción (más barato, suficiente para tarea estructurada). Sonnet 4.6 para chat conversacional (mejor naturalidad, vale el costo extra de ~$0.01/mensaje).
9. **Cache de enhancements en memoria** (Sprint 3a): los posts ya procesados por Claude no se re-procesan, viven en memoria de la función serverless. Acepta que cold starts pierdan cache. Para persistencia real necesitaríamos Supabase o Redis (sprint futuro).
10. **Path API misleading** (deuda técnica): el endpoint sigue en `/api/reddit/route.ts` aunque consume Bluesky. Se renombra a `/api/feed` en Sprint 7.
11. **Componente Chat extraído** (Sprint 3b): extraído a `components/Chat.tsx` para evitar que `page.tsx` siga creciendo. Es el primer componente del proyecto fuera de `app/`.
12. **Sin streaming en el chat** (Sprint 3b): respuestas no streameadas para simplicidad inicial. Streaming queda para sprint de polish si se nota como problema de UX.
13. **Clasificación de contenido por LLM** (Sprint 4b, segunda iteración): el módulo Viaje del hincha intentó filtrar videos con keywords blacklist y falló. Panini cambiaba de palabra a "sobres", existen otros Mundiales en 2026 como el FMBB de pastores belgas, las predicciones se disfrazaban de preguntas. Pivoteamos a clasificación con Haiku batch, mismo patrón que usábamos para memes. Costo: ~$0.01 por refresh, trivial. Regla general adoptada: cualquier filtro de contenido generado por terceros usa LLM como decisor principal desde la primera iteración.
14. **Tagging como compromiso semántico** (Sprint 4b, tercera iteración): el contenido real disponible para "Viaje del hincha" hoy es mayormente tours de ciudades sede hechos por youtubers de viajes, no vlogs de hinchas reales (esos van a explotar durante el torneo, no antes). En vez de apretar el filtro y dejar el módulo raquítico o renombrarlo, mantenemos el nombre "Viaje del hincha" y agregamos cuatro tags generados por Claude: vlog, tour, preparación, experiencia. Mismo patrón visual y de coloreo que el módulo de memes.
15. **Catálogo hardcoded + recomendación LLM** (Sprint 4c): para la Capa AR/VR no existe API confiable que liste servicios inmersivos disponibles para el Mundial 2026 en tiempo real. Pivoteamos a un patrón híbrido: catálogo estático mantenido en código (8 opciones que abarcan desde watch party presencial hasta Apple Vision Pro) + recomendación contextual generada por Haiku basada en el partido del momento y el perfil del usuario (sin headset, en Argentina). El catálogo se audita y actualiza manualmente cada cierto tiempo. Trade-off aceptado: información puede quedar desactualizada, pero la alternativa (no construir el módulo) era peor.
16. **Convención de casing lowercase** (Sprint 4d-1.6): adoptamos minúsculas para nombres de módulos, toggles y headers de UI. Mantenemos mayúsculas solo para la marca ("Cábala"), sustantivos propios (selecciones, ciudades) y badges estilizados en uppercase tracking. Decisión estética alineada con el tagline "la superstición se hizo software".

## Cronograma realizado

- **Sprint 0** (mayo 2026): cuentas creadas, deploy pipeline GitHub→Vercel, primer "hola mundo" en producción.
- **Sprint 1** (mayo 2026): dashboard con 5 módulos y datos simulados, branding Cábala aplicado, módulos toggleables, tribu configurable.
- **Sprint 2** (mayo 2026): intento de integración con Reddit falla por cambio de política → pivot a Bluesky con App Password auth → módulo de memes muestra datos reales del torneo.
- **Sprint 3a** (mayo 2026): Claude API integrada para clasificación (cinco categorías), traducción al español rioplatense, scoring de relevancia, cache de enhancements para reducir costos.
- **Sprint 3b** (mayo 2026): asistente conversacional flotante con contexto del dashboard. Sonnet 4.6, manejo de errores, UI con tipping indicator, sugerencias en estado vacío.
- **Sprint 4b** (mayo 2026): integración con YouTube API. Tres iteraciones de filtrado: keywords brutas → keywords refinadas → clasificación con Haiku con tags. Módulo Viaje del hincha vivo con datos reales tageados (vlog / tour / preparación / experiencia).
- **Sprint 4c** (mayo 2026): Capa AR/VR. Catálogo hardcoded de 8 opciones inmersivas + recomendación contextual con Haiku basada en partido y perfil del usuario. Cierra Sprint 4.
- **Sprint 4d-1.6** (mayo 2026): consistencia de casing en lowercase + colorcito por día en calendario.

## Próximos sprints (orden definido por Diego)

- **Sprint 4** — *los módulos que faltan*: Camino al Mundial (timeline narrativo de eliminatorias por selección), Viaje del hincha (vlogs y posts de hinchas viajando), Capa AR/VR (orquestador para experiencias inmersivas con FIFA+ y similares).
- **Sprint 5** — *datos reales en los módulos simulados*: Ojo de Dios (NewsAPI/GDELT por ciudad sede), Sentimiento (Google Trends + análisis de Bluesky con Claude), Sufrimiento (cruce de sentiment + posts simultáneos durante partidos), En las calles (NewsAPI por ciudad sede en tiempo real).
- **Sprint 6** — *tools para el asistente Claude*: que pueda configurar el dashboard (toggle de módulos, set de tribu, filtros), destacar contenido específico, generar briefings on-demand. Pasamos del "asistente que describe" al "asistente que ejecuta".
- **Sprint 7** — *polish y dominio*: comprar `cabala.app`, briefings automáticos por la mañana y antes de cada partido, sistema de alertas configurable, renombrar `/api/reddit` a `/api/feed`, ajustes de estética final.

Después de Sprint 7 entramos en modo "uso del producto durante el Mundial" con iteraciones cortas según lo que pida la realidad del torneo.

## Convenciones

- **Nombre del repo**: `cabala-dashboard` (sin tilde por restricción de GitHub)
- **Commits**: mensajes en español, presente, descriptivos
- **Branches**: trabajamos sobre `main` directamente; PRs se incorporan si crece el equipo
- **Archivos**: kebab-case para nombres
- **Componentes React**: PascalCase para el nombre del componente, kebab-case para el archivo
- **API keys**: nunca en commits; van en `.env.local` (gitignored) y en Vercel Environment Variables
- **Importes en `app/`**: alias `@/components/...` (configurado en tsconfig.json)
