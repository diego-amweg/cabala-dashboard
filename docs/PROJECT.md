# Cábala — Documento de Contexto

> *La superstición se hizo software.*

Plataforma personal para vivir el Mundial 2026 como fenómeno cultural total, no solo como torneo deportivo. Termómetro global configurable, en tiempo real, asistido por IA.

## ⚠ PENDIENTE PARA EL MUNDIAL (en curso)
- ✅ Resultados en vivo: resuelto (ADR 47). Header y calendario muestran marcadores reales
  vía ESPN (/api/live, polling 60s). TTL dinámico en fixtures/standings (5min día de partido).
- Bracket de eliminatorias (FixtureBracket): las llaves se cargan cuando football-data agregue
  los partidos de Round of 32 en adelante (al cerrarse los grupos, ~27 jun). Conectar el
  componente a los partidos que NO son GROUP_STAGE.
- REVISAR en producción el 11 jun: confirmar que displayClock y scores de ESPN llegan como
  se espera. Si algún equipo aparece en inglés en el calendar, agregar alias a lib/teams.ts.

## Estado del proyecto

- **Versión actual**: v0.6 — Sprint 4 completo (módulos faltantes + capa inmersiva)
- **Sprint completado**: 4c
- **Próximo sprint**: 5 — datos reales en módulos simulados
- **Última actualización**: junio 2026
- **Kickoff**: 11 de junio de 2026 (2 días)
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
15. **Catálogo hardcoded + recomendación LLM** (Sprint 4c): para la Capa AR/VR no existe API confiable que liste servicios inmersivos disponibles para el Mundial 2026 en tiempo real. Pivoteamos a un patrón híbrido: catálogo estático mantenido en código (8 opciones que abarcan desde watch party presencial hasta Apple Vision Pro) + recomendación contextual generada por Haiku basada en el partido del momento y el perfil del usuario (sin headset, en Argentina). El catálogo se audita y actualiza manualmente cada cierto tiempo. Trade-off aceptado: información puede quedar desactualizada, pero la alternativa (no construir el módulo) era peor. Actualizado en Sprint 4d-3d (ADR 28): catálogo reducido a 6 opciones tras sacar Cosm Domes y Meta Horizon.
16. **Convención de casing lowercase** (Sprint 4d-1.6): adoptamos minúsculas para nombres de módulos, toggles y headers de UI. Mantenemos mayúsculas solo para la marca ("Cábala"), sustantivos propios (selecciones, ciudades) y badges estilizados en uppercase tracking. Decisión estética alineada con el tagline "la superstición se hizo software".
17. **Página separada `/fixture` con bracket SVG** (Sprint 4d-1.7): El fixture completo (62 partidos eliminatorios) vive en su propia ruta para no inflar el dashboard principal. Bracket en SVG puro con posiciones calculadas matemáticamente desde una lista plana de matches y conexiones explícitas. Slots pre-tournament en formato grupo (1A, 2B, 3CDFGH); se rellenan con equipos reales cuando llegue API-Football en Sprint 5. Link desde dashboard principal con estilo destacado (borde naranja grueso, botón de acción visible).
18. **Modal de estadios: descripciones en español hardcodeadas + imagen vía Wikipedia REST API** (Sprint 4d-1.8): Las descripciones de los 16 estadios viven como constantes en español dentro del endpoint `/api/stadium/[id]`. Esto evita el costo de traducción runtime (lo que se proponía inicialmente con Haiku) y garantiza estabilidad: "una vez y queda". Las imágenes sí se traen dinámicamente de `https://en.wikipedia.org/api/rest_v1/page/summary/{article}` con cache de 7 días (las imágenes pueden mejorar con el tiempo, las descripciones no necesitan re-traducirse). Mapping ciudad → artículo de Wikipedia hardcodeado.
19. **Mapa de Norteamérica en Ojo de Dios** (Sprint 4d-2): Reemplaza el SVG anterior (líneas punteadas dividiendo países más puntos a ojo) por un mapa real con siluetas de Canadá, EE.UU. y México + 92 estados/provincias. Datos de Natural Earth admin 0 + admin 1 a 1:10m resolution, clipeados a lat [14,54] / lon [-130,-65], proyectados con Web Mercator, simplificados con Douglas-Peucker (tolerance 12km). Total: 31KB de paths SVG hardcodeados en `data/mapData.ts`. Las 16 sedes se recoordinan a sus lat/lon reales y se proyectan con la misma proyección del mapa. viewBox pasa de 660x280 a 660x400 para acomodar el aspect ratio natural de Norteamérica. Cero dependencias npm nuevas; el procesamiento de datos se hizo offline en Python (shapely + pyproj) y solo el resultado se commitea.
20. **Fix del fixture: completar formato 2026** (Sprint 4d-2-fix): El fixture anterior tenía dos errores: labels incorrectos ("32avos" en vez de "16avos", porque en este formato la primera ronda eliminatoria son 32 equipos = 16 partidos = dieciseisavos de final) y conteo incorrecto en el banner ("62 partidos" cuando el bracket tiene 32 eliminatorios y el Mundial total tiene 104). Fix: corregir labels, agregar sección de fase de grupos con 12 grupos vacíos (slots a rellenar cuando llegue API-Football en Sprint 5), actualizar banner a "104 partidos · grupos + eliminatorias". Lección aprendida: verificar números factuales (total partidos, nombres de rondas) antes de hardcodearlos.
21. **TheSportsDB integration para escudos de selecciones** (Sprint 4d-3a): Endpoint `/api/national-team/[code]` consulta TheSportsDB (API key gratuita pública "3") con cache 7 días. Devuelve URL del escudo. Componente `TeamBadge` reutilizable con cache module-level para evitar fetches duplicados cuando el mismo escudo se renderiza en múltiples secciones. Si TheSportsDB falla, fallback a un placeholder gris. Sentimiento pasa de barras horizontales a heatmap (grilla 4 cols con celdas coloreadas), sufrimiento pasa de fila de texto a tarjetas con escudo + número de ansiedad derivado del sentimiento.
22. **Banderas de selección vía flagcdn** (Sprint 4d-3a + fix): Intento inicial con TheSportsDB falló: el free tier de su API `searchteams.php` está documentado como limitado a buscar solo "Arsenal" (cualquier otro nombre devuelve vacío). Verificación que debí hacer leyendo la documentación antes de codear. Pivot a flagcdn.com: CDN público gratuito, sin auth, URLs estables tipo `https://flagcdn.com/w160/{iso}.png`. Soporta subdivisiones como `gb-eng` para Inglaterra. Tradeoff aceptado: son banderas (no escudos de federación), pero la identificación visual es clara. TeamBadge se simplifica a server component sin fetch.
22. **Tribu ampliada a 12 selecciones** (Sprint 4d-3a-tribu12): La tribu pasa de 8 a 12 selecciones para mantener diversidad global sin perder el foco sudamericano. Distribución: 6 sudamericanos clasificados (ARG, BRA, URU, PAR, COL, ECU), 3 anfitriones del Mundial 2026 (MEX, USA, CAN), 3 selecciones globales relevantes (FRA por la final 2022, ESP por la lengua, JPN por Asia). Saca a Marruecos e Inglaterra del mix original. El heatmap pasa de 4x2 a 4x3 automáticamente porque el grid CSS ya era de 4 columnas. Pendiente para Sprint 4d-3b: extender TEAM_FACTS de RoadToWorldCup a las 6 selecciones nuevas (URU/PAR/COL/ECU/USA/CAN) para evitar alucinaciones del LLM.
23. **Investigación de UX del Mundial 2026** (research, no sprint): Se relevaron estudios académicos (FIFA World Cup as a Media Event, Social Second Screen WhatsApp), de industria (WSC Sports, Google Think with Sports Fans), del mercado (Infobip, Infobae) y reviews de la FIFA Official App (3.3 estrellas, principal queja: lenta y mal implementada). Conclusiones: (a) Cábala YA cubre 12 de las dimensiones que el research valora más. (b) Gaps reales en orden de relevancia: smart notifications/briefings, behind the scenes de jugadores, polls live durante partidos. (c) Gaps que se descartan deliberadamente: Predictor/Prode con auth (rompe principio sin-login), AR/360°, stickers Panini, gamificación social. Estrategia editorial: Cábala se posiciona como dashboard editorial de segunda pantalla con personalidad para un argentino, no como reemplazo de la app FIFA. Decir "no" a features tiene tanto valor como decir "sí".
24. **Escudo hero + tags icónicos + extensión de TEAM_FACTS** (Sprint 4d-3b): El módulo Camino al Mundial ahora muestra un header con bandera grande (TeamBadge size=lg), nombre, status, y una línea con datos verificados (cantidad de mundiales, mejor performance, DT actual). Los 4 tags icónicos (decisivo⚡, drama💔, hito🏆, preocupación⚠️) están enforced en el prompt del LLM y mapeados a emojis + colores en el frontend, con fallback gris si llega un tag inválido. TEAM_FACTS y TEAM_NAMES se actualizaron a las 12 selecciones de la tribu actual (saca MAR/ENG, agrega URU/PAR/COL/ECU/USA/CAN). Los datos clave (DTs, mejores performances, posiciones de eliminatoria) fueron verificados con búsquedas web en mayo 2026. Decisión de diseño: TEAM_HERO_DATA está en el frontend (no pasa por LLM) para garantizar precisión en datos no negociables; el LLM solo genera narrativa de momentos.
25. **Ticker horizontal continuo en "En las calles"** (Sprint 4d-3c): El feed vertical de 4 tarjetas se reemplaza por un ticker horizontal estilo cable de noticias que itera continuamente sobre los 16 items de la lista CALLE. Implementación: CSS animation (`transform: translateX` de 0 a -50%) sobre los items duplicados en el JSX, 90 segundos por ciclo, pause on hover en desktop. Se elimina el state `calleShown` y su actualización en el `setInterval` de 2.4s. Decisión de diseño: animación CSS por performance (GPU-accelerated, no compite con el setInterval que ya orquesta pulso/sentimiento/intensidad). En mobile no hay pause (no hay hover), aceptable.
26. **Sprint 4d-3c.1: controles manuales del ticker** (mejora de 4d-3c). El ticker pasa de animación CSS pura a JavaScript con `requestAnimationFrame`, encapsulado en un componente nuevo `components/Ticker.tsx`. Se agregan: pause-on-hover (mantenido), drag con dedo en mobile (toca y arrastra, vuelve a auto-play al soltar), flechas izquierda/derecha del teclado en desktop (cuando el ticker tiene focus, mueve 80px por toque). Decisión: no agregar botones visibles ni atajo de space para mantener el módulo como elemento de fondo, no protagonista. Performance: sigue siendo GPU-accelerated porque solo se modifica `transform`.
27. **Descartar Claude Code como ejecutor técnico** (Sesión 2, mayo 2026). Decidimos dejar de usar Claude Code en WSL para aplicar cambios y volver a un workflow donde Diego aplica todo manualmente en VS Code local. Razón: control directo sobre cada cambio antes de aplicarlo, menor riesgo de errores silenciosos cuando find/replace falla en strings largos, y mayor entendimiento del estado del repo por parte de Diego. Trade-off aceptado: cambios más lentos de aplicar, pero más confiables. Claude (este chat) ahora entrega: búsqueda/reemplazo surgical, archivos completos cuando el delta es grande, scripts de bash cuando hay varias acciones encadenadas, y bloques de texto para pegar en docs.
(enmienda) — Antigravity como ejecutor controlado
Contexto: a días del Mundial y con backlog grande, se busca velocidad. El ADR 27 había descartado Claude Code como ejecutor por control. Se reincorpora un ejecutor agéntico (Antigravity IDE), pero con guardrails que preservan el control.
Decisión: división de trabajo. Claude (chat) sigue de arquitecto/diseño/producto y escribe specs estrictas (formato anti-alucinación, anclando el stack real: Anthropic/football-data/Wikipedia/Bluesky, NO el stack Google de Antigravity). Antigravity ejecuta tareas ACOTADAS y cierra cada una con npx tsc --noEmit (y npm run build cuando toca). Diego revisa el diff antes de commitear. Tareas chicas y verificables, no "construí el módulo entero". Si Antigravity sugiere cambiar de proveedor de IA o sumar Genkit/Gemini, se frena.
Consecuencias: más velocidad sin perder el control que motivó el ADR 27 original. El riesgo de errores silenciosos del agente se mitiga con verificación obligatoria + revisión de diff + acotamiento.
28. **Agrupación por accesibilidad + covers visuales en Capa AR/VR** (Sprint 4d-3d, mayo 2026): el módulo "inmersivo" pasa de grilla plana de 8 opciones a dos grupos visuales con cover image por card. Grupos: "desde tu casa hoy" (4 opciones accesibles sin hardware especial: watch party presencial, FIFA+, Twitch co-streams, YouTube VR con Cardboard) y "con equipo dedicado" (2 opciones que requieren hardware: Bigscreen, Apple Vision Pro). Catálogo pasa de 8 a 6 opciones al sacar Cosm Domes (presencial en LA/Dallas, no aplicable a un usuario en Tostado) y Meta Horizon Worlds (redundante funcionalmente con Bigscreen). Covers son imágenes locales en `public/immersive/{id}.jpg` a 640x360, renderizadas con `next/image` (optimización automática, lazy load). Cada card mantiene su categoría (streaming/social/vr/xr/dome), descripción, dispositivo y costo. Tradeoff: el módulo pasa de tabla informativa densa a tarjetas editoriales con foto — más superficie visual, menos densidad de texto. Enmienda al ADR 15.
29. **BTS histórico en Camino al Mundial: "el camino en video"** (Sprint 4d-3e): se agrega al módulo road una sección al pie con videos BTS históricos de YouTube oficiales por selección. Enfoque: curaduría hardcodeada en el componente (objeto `TEAM_BTS_VIDEOS` con id de YouTube, título y bajada editorial por video), renderizada como thumbnail (`img.youtube.com/vi/{id}/hqdefault.jpg`) + link que abre el video en YouTube, no embed. Alternativas descartadas: la YouTube Data API (lo dinámico queda reservado para el Sprint 8 de BTS live; el contenido histórico es estático) y los embeds (pesados, peor performance y privacidad). Sin endpoint nuevo, sin key, sin LLM en runtime: la curaduría humana es el filtro editorial. Los IDs los consigue Diego (Claude no puede proveer IDs de YouTube de forma confiable). Piloto deployado solo con Argentina (4 videos: final Qatar 2022, Copa América 2021, vuelta a casa, Copa América 2024). Escalado al resto de selecciones pendiente de decisión.
30. **Modelo del endpoint road: Sonnet a Haiku** (Sprint 4d-3e): `/api/road/[team]` pasa de `claude-sonnet-4-6` a `claude-haiku-4-5-20251001` para bajar costo y latencia (Sonnet tardaba ~22s por generación). El road solo narra un timeline a partir de los datos provistos en `TEAM_FACTS`, tarea que Haiku resuelve bien; validado regenerando ARG/BRA/JPN con `?refresh=true`. Tradeoff: Haiku es menos potente; si en algún equipo la calidad cae, se ajusta el prompt o se revierte el modelo solo para road. Disparador: la cuenta de Anthropic API se quedó sin créditos, lo que expuso la dependencia del dashboard del saldo de API.
31. — módulo de gifs del mundial (giphy, vivo, por tribu)
contexto: se buscaba contenido animado simpático para el dashboard. tenor quedó
descartado porque google no acepta nuevos clientes de su api desde enero 2026.
giphy sigue abierto: clave beta gratis, 100 búsquedas/hora, atribución obligatoria.
decisión: módulo nuevo "gifs del mundial" con toggle propio, debajo de calendario.
contenido vivo (giphy en runtime), queries ligadas a las selecciones de la tribu
(una por selección), cache por selección (no por tribu) con ttl 6h para no pasar el
límite. ~20 gifs en tira horizontal, mp4 (no .gif) con carga por viewport. gifs no
clickeables (no se manda gente afuera).
consecuencias: la calidad la decide el ranking de giphy (no se puede filtrar por llm
porque no "ve" el gif); aceptado, con plan de caer a curaduría hardcodeada si se ve
barato. la atribución hoy es texto; para el público hay que poner el logo oficial.
32. — botón "compartir cábala" global
contexto: se quería que el contenido simpático empuje a compartir cábala. se evaluó
ponerlo en el módulo de gifs pero se elevó a nivel dashboard.
decisión: botón "compartir" en el header. web share api (en celular, menú nativo con
texto "cábala — el dashboard del mundial 2026" + url); en desktop copia el link con
feedback "copiado". se comparte cábala, no el gif.
consecuencias: ninguna negativa. única superficie de difusión por ahora.
33. — cache diferenciado en journey para respetar la cuota de youtube
contexto: "viaje del hincha" dejó de traer videos. el endpoint hacía 4 búsquedas
(search.list = 100 unidades c/u) con cache de 30 min: ~19.200 unidades/día contra una
cuota gratis de 10.000/día. se agotaba todas las tardes (403 quotaexceeded) y encima
cacheaba los vacíos.
decisión: ttl 6h para resultados con videos, 10 min para vacíos (reintenta sin
martillar). consumo baja a ~1.600 unidades/día.
consecuencias: el cache sigue en memoria, se pierde en cold starts de vercel; la
solución de fondo es vercel kv (backlog). no fue causado por 4d-4a.
34. — cache persistente en Upstash Redis
contexto: los caches en memoria (Map a nivel módulo) se pierden en cada cold start de
vercel, lo que re-dispara búsquedas y llamadas a apis (cuota de youtube, saldo de
anthropic) y empeora la latencia. vercel kv dejó de existir: se migró a upstash redis
vía marketplace en diciembre 2024.
decisión: se creó una base upstash redis (free: 1 db, 500k comandos/mes) vinculada al
proyecto, que inyecta sus credenciales como env vars. helper lib/cache.ts con
cacheGet/cacheSet y degradación a "sin cache" si falta config o si redis falla.
migrados: journey (6h/10min), road (24h por selección), token de sesión de bluesky
(13min). NO migrados a propósito: gifs (giphy es barato y tolera cold starts) y el
enhancementCache de bluesky (una clave por url, no rinde en redis).
consecuencias: los cold starts ya no re-queman cuota ni saldo en esos endpoints y baja
la latencia. contra: nueva dependencia de infra (upstash) y otro free tier que vigilar.
35. — hashtags reales + filtro keep/reject en el feed de bluesky
contexto: el módulo "memes y polémicas" buscaba solo 3 frases de texto. se sumaron
hashtags reales (#Mundial2026, #WorldCup2026, #Somos26) como queries para ampliar el
pool — los tres traen volumen full en bluesky. eso destapó que el filtro de haiku solo
clasificaba, no descartaba: entraba mucho contenido político/activista (protestas, ICE,
crítica institucional a FIFA) ajeno a la pasión futbolera del módulo.
decisión: (1) hashtags reales como queries, búsquedas en paralelo (Promise.all). (2)
filtro keep/reject en haiku, como el de journey: deja solo fútbol y fiesta (memes,
polémica DEPORTIVA, peleas de hinchas, virales, noticias), rechaza política, activismo,
crítica institucional a FIFA, ruido, spam e idiomas que no sean es/en/pt. se clasifica
un pool de 25 (antes 12) para que tras descartar queden ~12 buenos.
consecuencias: el feed quedó mucho más alineado con la voz de cábala. contra: clasificar
25 por carga sube el uso de haiku y el feed no se cachea, así que la carga en frío llega
a ~10s. pendiente: cachear el feed armado en redis (ttl corto).
36. — calendario real del mundial vía football-data.org (no API-Football)
contexto: sprint 5 arrancó con API-Football, pero su plan gratis NO da acceso a la
temporada 2026 (solo 2022-2024); el error recién apareció gracias al autodiagnóstico del
endpoint. se evaluó pagar, pero para un proyecto sin monetización no se justifica.
decisión: usar football-data.org, cuyo free tier incluye el mundial ("WC", competición
2000) para siempre y con límite holgado (~10 req/min vs 100/día de API-Football). endpoint
/api/fixtures: GET a /v4/competitions/WC/matches?season=2026 con header X-Auth-Token,
filtra stage=GROUP_STAGE, mapea al FixtureItem del Calendar, traduce nombres EN→ES con
mapa fijo + fallback, convierte a hora argentina (utc-3 fijo), cachea en redis
(fixtures:groups, ttl 1h) y soporta ?refresh=true. el Calendar pasó de hardcodeado a fetch.
football-data no da estadio, pero sí el grupo (A-L), que se muestra como fase.
consecuencias: el calendario muestra los 72 partidos reales de grupos con equipos, fechas
y horario local. pendiente: posiciones (GroupStage), resultados en vivo y bracket. también
se formalizó la convención de autodiagnóstico en endpoints (CLAUDE.md): nunca fallar en
silencio, devolver el motivo en el body.
37. — grupos reales del mundial (standings derivado de los partidos)
contexto: el GroupStage mostraba "por definir". football-data tiene endpoint /standings, pero
la doc avisa que devuelve 404 para competiciones tipo CUP (el mundial podría serlo), así que
depender de él era arriesgado.
decisión: derivar las 12 tablas de los partidos (mismo /v4/competitions/WC/matches que el
calendario, filtrado GROUP_STAGE): los equipos salen de los partidos (disponibles hoy por el
sorteo) y los puntos se calculan sumando los finalizados (cero hoy, se llena solo durante el
torneo). endpoint nuevo /api/standings, cache redis 1h, autodiagnóstico. el mapa de nombres
EN→ES se extrajo a lib/teams.ts (lo usa standings; el calendario sigue con su copia local,
deuda menor de unificar). desempate: puntos → diferencia de gol → goles a favor → alfabético
(aproximación, no el desempate oficial FIFA con head-to-head).
consecuencias: los 12 grupos muestran los 48 equipos reales con PJ/Pts; durante el mundial las
posiciones se actualizan solas. pendiente de sprint 5: resultados en vivo y bracket.
38. — el norte de cábala: el pulso emocional del mundo + pulso global real (wikipedia)
contexto: el dashboard funcionaba como observatorio del mundial pero "no enganchaba". diego
articuló la visión: cábala como el mapa emocional del mundo durante el mundial, en clave
positiva (inspirado en el dashboard global de la pandemia, dado vuelta hacia lo emocional).
diagnóstico: el pulso/sentimiento/intensidad del header y el mapa era todo Math.random()
—movimiento falso—. faltaba verdad, escala global y crecimiento real.
decisión: el corazón de cábala es el pulso global emocional, real y creciente. fuente v1: la
ATENCIÓN mundial medida por las visitas a wikipedia al artículo del mundial 2026 en 6 idiomas
(en/es/pt/fr/de/it), sumadas. endpoint /api/pulse: pulso 0-100 (hoy vs baseline de la ventana),
tendencia semanal %, serie de 16 días, cache redis 6h, autodiagnóstico. el header muestra el
número real + ↑% creciendo. google trends evaluado y descartado (sin API oficial; lo no oficial
es frágil y bloqueable). bluesky (la voz) queda como segunda capa para el mundial.
consecuencias: el pulso dejó de ser random; refleja el interés real del mundo creciendo hacia
el 11/6 (al hacerlo: pulse 82, +27% semanal, serie ascendente). pendiente: el desglose por
selección y los círculos del mapa siguen fake; se hacen reales en el próximo paso.
39. — robustez ante football-data: stale-on-error + reintento en el front
contexto: el calendario y los grupos aparecían vacíos en producción ("no disponible") aunque en
local andaban, y un redeploy los "arreglaba". diagnóstico mirando el código (no de memoria): NO
era prerender en build —next.config no tiene cacheComponents y ambos endpoints leen la request,
así que ya eran dinámicos—. la causa: el cache (TTL 1h) expiraba sin visitas; la siguiente visita
pegaba a football-data en frío; si la API tosía ahí (hipo o rate limit del free tier, 10/min), el
endpoint devolvía vacío y el front (un solo fetch, sin reintento) quedaba pegado. el redeploy no
arreglaba el fondo: al reabrir se reintentaba y la API respondía. un F5 bastaba.
decisión: robustecer en dos capas. (1) endpoints fixtures/standings: guardar el último bueno en
redis con TTL largo (7d) + "max age" lógico de 1h por timestamp para decidir el refresco; chequear
res.ok; ante cualquier fallo servir el último bueno con stale:true en vez de vacío; nunca cachear
vacío; autodiagnóstico en el body. (2) front Calendar/GroupStage: reintentar ante vacío/error (4
intentos, backoff 2/4/6s) antes del mensaje amigable. elevado a convención obligatoria en CLAUDE.md.
consecuencias: una vez que hubo datos, la pantalla no vuelve a quedar vacía aunque football-data se
caiga. aplica de aquí en más a todo endpoint con dependencia externa.
40. — termómetro mundial: calor por selección (atención vía wikipedia) + treemap con latido
decisión: el módulo "sentimiento" pasa a ser "termómetro mundial". mide cuánto mira el planeta a cada selección (atención, no cariño) con pageviews del artículo del equipo nacional en wikipedia. visualización: treemap squarified (cada selección un rectángulo de área proporcional a su calor, tesela todo el espacio sin huecos, estilo finviz) con latido por calor (cada bloque respira; el más caliente late más rápido y fuerte).
por qué atención y no afecto: el cariño puro no es medible bien con fuentes gratis. evaluamos bluesky para medir sentimiento y lo descartamos: su base está fuertemente sesgada (ee.uu., después japón/brasil/uk/alemania; argentina, áfrica y medio oriente casi ausentes), justo al revés de donde el fútbol arde. medir ahí daría un retrato falso. el sentimiento emocional queda como capa futura para el mundial. por ahora, atención honesta vía wikipedia, declarada como tal en la bajada del módulo.
implementación:
- endpoint /api/heat: pageviews de los últimos 7 días (hasta anteayer, por el delay de wikipedia) del artículo de cada equipo nacional de las 12, en en.wikipedia. heat 0-100 = sqrt(views/maxViews)*100 (suaviza la brecha entre el más y el menos visto). aplica robustez stale-on-error (cache 7d + maxAge 6h, sirve el último bueno ante fallo, nunca cachea vacío, autodiagnóstico de fuentes).
- componente Thermometer.tsx: treemap squarified (bruls et al.) recalculado al ancho real del contenedor (ResizeObserver, responsive). latido por calor con keyframe css, respeta prefers-reduced-motion.
bajas: se eliminó el módulo "sufrimiento compartido" (era fake: textos hardcodeados + ansiedad = 100 - sentimiento). se quitó el sentimiento random del header/teams (también fake).
pendiente: medir en inglés es anglocéntrico (brasil/francia pesan de más; argentina pesaría más con español). para escalar a las 48 o afinar, sumar idiomas por equipo (es/pt/fr...).
41. Termómetro escalado a las 48 selecciones
Contexto: el termómetro v1 (ADR 40) medía solo las 12 de la tribu y de forma anglocéntrica. Lo escalamos a las 48 del Mundial.
Decisión:
- La lista de las 48 se deriva en runtime de football-data (no se hardcodea), con escudo (crest) y código (tla).
- La atención se mide en en.wikipedia. Para no medir redirects ni variantes (que dan vistas basura aunque la API responda 200), /api/heat resuelve el título canónico vía la API de Wikipedia (redirects=1) antes de pedir pageviews. Overrides puntuales donde "football" != fútbol soccer (USA, Canadá, Australia -> "men's national soccer team") y para selecciones renombradas con "men's" (Suecia, Nueva Zelanda).
- Concurrencia limitada (5) + retry ante fallo intermitente, para no gatillar el rate limit de Wikipedia, que tiraba equipos a 0/null al azar.
- Thermometer.tsx: usa los escudos de football-data (img normal, sin next/image, para no configurar dominios remotos) + toggle "mi tribu"/"las 48". La tribu se filtra por nombre ES, porque el tla de football-data no coincide con los codes de la tribu (ej. URY vs URU).
- Medido en inglés. El idioma nativo (modo b) queda como sprint corto siguiente. Wikidata sería la solución definitiva de títulos si se quiere cero fragilidad.
Aprendizaje: got:true (la API devolvió algo) no garantiza dato correcto — un redirect mide casi cero. El autodiagnóstico del endpoint expone candidate/canonical/views justamente para cazar esto antes de pintar.
42. Termómetro: idioma nativo además del inglés (modo b)
Contexto: el termómetro a 48 (ADR 41) medía atención solo en en.wikipedia, con sesgo anglocéntrico (Inglaterra/España/USA pesaban de más; Argentina/Brasil/Japón de menos respecto a su pasión real).
Decisión: para cada selección se mide la atención en inglés MÁS en su idioma nativo, sumadas. El título nativo no se adivina: se obtiene del langlink del artículo canónico EN vía la API de Wikipedia (action=query&prop=langlinks&lllang=X), fuente de verdad sin fragilidad de títulos. Mapa país→idioma en lib/teams.ts (NATIVE_LANG); los 8 anglófonos (USA, Inglaterra, Escocia, Canadá, Australia, NZ, Ghana, Sudáfrica) se omiten (su atención ya está en EN). Costo: ~144 pedidos a Wikipedia por refresco, concurrencia 5 + retry, ~15s en frío, cache 6h.
Consecuencias: el podio se globaliza. Validado con vistas absolutas: portugués +32k a Brasil, alemán +34k a Alemania, japonés +25k a Japón, español a Argentina/España/México; los anglófonos quedan igual; ningún langlink falló. La bajada del módulo declara "inglés + idioma local". Wikidata deja de ser necesario para los títulos (los langlinks lo resuelven).
43. Gancho "hacelo tuyo" (elegí tu selección, sin login)
Contexto: primer gancho del corazón. El dashboard era genérico para todos; "hacelo tuyo" lo personaliza sin romper el principio sin-login.
Decisión: el usuario elige UNA selección de las 48 desde un selector modal (components/TeamPicker.tsx, buscable). Se guarda en localStorage (key 'cabala:miSeleccion'), se restaura al volver, leído solo en useEffect para no romper la hidratación SSR. El header muestra la selección con su calor del termómetro; la selección queda resaltada con un halo naranja en el treemap (prop highlightName en Thermometer). Frontend puro: sin backend, sin IA, sin dependencias nuevas.
Proceso: primera tarea ejecutada con Antigravity bajo el flujo controlado (enmienda ADR 27): Claude escribió la spec estricta, Antigravity creó/editó los archivos y verificó con tsc --noEmit + npm run build, Claude revisó el diff antes del commit. Resultado limpio (sin any, sin deps, JSX en una línea, prefers-reduced-motion respetado).
Consecuencias: el dashboard se siente propio. Pendiente del corazón: "relato del día" (LLM) y "cábalas" (curadas; UGC como decisión aparte).
44. Gancho "relato del día" (bajada editorial generada por IA)
Contexto: segundo gancho del corazón. Una bajada editorial corta, voz Cábala, que pone en palabras el pulso del día, arriba del todo.
Decisión: el endpoint /api/relato lee de Redis los datos REALES ya cacheados (pulse:global, heat:teams, fixtures:groups), arma un resumen y lo manda a Haiku (claude-haiku-4-5-20251001, mismo patrón que road) con un prompt anti-invento (usa solo lo provisto; prohibido inventar resultados/números/partidos). Cachea en relato:dia con stale-on-error (TTL 7d + maxAge 20h ~ diario), soporta ?refresh, autodiagnóstico (debug con los datos que entraron). Componente RelatoDelDia.tsx lo muestra bajo el header, discreto, sin mensajes técnicos ante error. Solo fuentes reales: las fake (mapa de sedes, en las calles, partido simulado del header) quedan afuera hasta tener dato real; el relato suma fuentes a medida que se vuelven reales.
Proceso: segunda tarea con Antigravity. Acertó keys/shapes (leyó los route.ts) y el relato salió con las 3 fuentes. En la revisión de diff se cazó el uso de `any` (atajo que viola TS estricto) y se corrigió a tipos concretos, más el autodiagnóstico que faltaba. El flujo controlado (revisar el diff antes de commitear) hizo su trabajo. v1 sin color de memes/journey (pasada siguiente).
Consecuencias: la primera línea del dashboard es una lectura editorial real del día. Pendiente: sumar color de memes/journey al relato; "cábalas" (curadas; UGC aparte).
45. Color al relato (memes + viaje del hincha) y refuerzo anti-invento
Contexto: extensión de ADR 44. Se sumó al relato el color de dos fuentes vivas: memes (Bluesky, key bluesky:feed) y viaje del hincha (key journey:all), como AMBIENTE, no como hecho.
Decisión:
- El relato lee bluesky:feed y journey:all de Redis y los pasa a Haiku como "clima" (de qué se habla / hinchas en movimiento), con regla explícita: son color, NO hechos; prohibido sacar de ahí resultados, números o datos.
- Color de memes best-effort: el feed de Bluesky se cachea 15 min (TTL del módulo de memes) y journey vive 6h. Cuando el relato se genera (cache 20h) el feed de memes suele estar frío, así que memes entra solo si el cache está caliente; journey entra casi siempre. No se le mete fetch interno al relato (serían ~10s de Haiku) por una frutilla. Si no hay dato, la regla "si no está, no lo menciones" lo cubre.
- Refuerzo anti-invento: se detectó que Haiku agregaba efemérides ciertas pero NO provistas (ej. "México vs Sudáfrica, el mismo partido que marcó el 2010"). Aunque sea cierto, viola el principio de "solo datos provistos" y mañana podría afirmar algo falso igual. Regla nueva: prohibido contexto histórico, efemérides, comparaciones con Mundiales anteriores o datos de jugadores que no estén literalmente en los datos.
- Termómetro global: Haiku lo llamaba "sudamericano" cuando es mundial. Se aclaró el label del dato y se agregó regla de que el termómetro es mundial; las sudamericanas se destacan dentro, pero no lo reducen.
Proceso: tercera tarea con Antigravity. Acertó keys/shapes (bluesky:feed y journey:all, verificadas contra los route.ts) y no metió any. En revisión se cazaron dos cosas del PROMPT (no de Antigravity): el invento de la efeméride y la imprecisión del termómetro; ambos corregidos.
Consecuencias: el relato gana calle (clima de redes y viajeros) sin perder rigor.
Enmienda ADR 45 (mismo día) — memes fuera del relato
En las primeras corridas con el cache de memes caliente, el color de memes filtró afirmaciones del feed al relato (ej. "Geoff Hurst mirando desde la tribuna", inventado a partir de un post; también David Raya, Newark). El feed de Bluesky no es "clima" sino posts con afirmaciones y noticias, y la regla "color no es hecho" no frena que Haiku tome un nombre jugoso y lo afirme. Decisión: sacar memes del prompt del relato y dejar solo "viaje del hincha" (journey), cuyos títulos de vlogs evocan ambiente sin afirmar. memesStr queda en el debug (informativo), fuera del prompt. La regla de color se endureció: prohibido repetir nombres propios o afirmaciones del color. Aprendizaje: pasar contenido de terceros a un LLM como "color" es seguro solo si ese contenido ya es genérico (títulos de vlogs); un feed de noticias/memes mete afirmaciones aunque le pidas que sea ambiente.
46. Gancho "cábalas" (folklore del hincha, curado)
Contexto: tercer gancho del corazón. El producto se llama Cábala pero la superstición no estaba en ningún lado; las cábalas (rituales del hincha) son el contenido más de marca.
Decisión:
- Colección curada y hardcodeada en data/cabalas.ts (20: 15 universales + 5 de hinchada — Uruguay, Brasil x2, México, Japón). Regla editorial: solo folklore colectivo/cultural, NADA atribuido a jugadores ni DTs reales (figuras reales + datos a verificar + diluyen la voz). Las anécdotas de individuos que aparecen en la web se reconvierten en folklore genérico o se descartan.
- Componente Cabalas.tsx (frontend puro, sin backend/IA): variant 'dia' (la cábala del día, rotada determinísticamente por fecha, fija arriba junto al relato, siempre visible) y variant 'coleccion' (la colección completa, en módulo toggleable). "mi cábala" en localStorage (cabala:miCabala), resaltada, mismo patrón que "hacelo tuyo".
- Crecimiento CURADO, no automático: se descartó la búsqueda diaria automática de cábalas (mismo riesgo que los memes en el relato: contenido de terceros sin verificar, jugadores reales, ruido SEO de apuestas; además el folklore no se renueva a diario y requeriría un cron, que no usamos). La colección crece cuando Claude busca y propone en sesión y Diego valida. La rotación diaria ya da la sensación de "vivo" sin riesgo.
Proceso: cuarta tarea con Antigravity. Construyó componente e integración respetando casi todo (sin any, localStorage en useEffect, JSX en una línea, patrón de toggles, reduced-motion). En revisión se cazó una violación de las reglas de hooks (useState/useEffect después de un early return condicional por variant) que ni tsc ni next build detectan; corregido dividiendo en dos subcomponentes (CabalaDelDia sin hooks, CabalasColeccion con hooks) con un dispatcher. Aprendizaje: tsc chequea tipos y el build no corre react-hooks/rules-of-hooks por defecto; las reglas de hooks las caza la revisión humana.
Consecuencias: el nombre del producto por fin tiene su gancho. Pendiente: crecimiento curado durante el Mundial; eventual "mi cábala" visible arriba (requiere levantar estado a page.tsx); UGC de cábalas como salto aparte (DB + login opcional + moderación).
47. — resultados en vivo: arquitectura híbrida ESPN + football-data
contexto: el mundial arranca el 11 jun. había que mostrar marcadores en vivo en header
y calendario sin reemplazar football-data (fixture completo) ni agregar un plan pago.
espn tiene una api no oficial, gratis, sin auth, con estados en tiempo casi real.
decisión (cuatro tareas):
- /api/live: ventana ayer→+3 días, TTL dinámico (30s con live, 10min sin), teamES para
  traducción, robustez stale-on-error.
- header real: reemplaza CURRENT_MATCH/NEXT_MATCH hardcodeados por fetch a /api/live con
  polling cada 60s y degradación a /api/fixtures. cronómetro fake eliminado.
  fecha real ART con Intl.DateTimeFormat en useEffect.
- calendar polling: segundo useEffect independiente que pollea /api/live cada 60s y llama
  a mergeWithLive() —función pura— que parchea status/scores/minute solo en partidos que
  matcheen por home+away normalizado. badge live muestra el minuto (live · 87').
- maxAge dinámico: /api/fixtures y /api/standings usan 5min en día de partido, 1h el
  resto. isMatchDay se calcula desde raw matches con isToday_ART y se guarda en el cache.
  compatible con cache viejo (undefined → falsy → 1h).
deuda técnica resuelta: fixtures importa teamES de lib/teams.ts; aliases ESPN 'Bosnia and
Herzegovina' y 'DR Congo' agregados.
riesgo residual: si ESPN usa algún nombre en inglés no mapeado, el merge falla silencioso
(no es crash; el partido muestra datos de fixtures sin overlay). plan: monitorear el 11 jun.
48. — fix: loop infinito en el termómetro (squarify) por selección con calor 0
contexto: a 2 días del kickoff, el dashboard se colgaba en prod y local ("la página no
responde"), sin error en consola, F5 igual y ABRIR sin responder. intermitente.
diagnóstico: el Call Stack (pausa con F8 en Chrome + "Script terminated by timeout at R/m"
en Firefox) apuntó al useMemo del treemap de Thermometer.tsx. el squarify entra en loop
infinito cuando una selección tiene heat 0: área 0 → worstRatio calcula 0/0 = NaN → el
`if (ratio <= best)` da false (NaN <= Infinity es false) → el while interno corta sin
consumir el item, sin avanzar el índice y sin achicar rw/rh → el while externo gira para
siempre y clava el main thread. por eso era un cuelgue sin error (no crash) y ni ABRIR
respondía. el heat (atención de Wikipedia, sqrt normalizado 0-100) puede dar 0 para una
selección con ~0 vistas: bug latente que los datos del día destaparon. NO lo causaron los
cambios de header/pre-warm de hoy (commit 6784a35); la correlación de timeline era falsa.
decisión: el fix vive en el algoritmo, no en el caller. squarify filtra
`teams.filter(t => t.heat > 0)` antes de calcular (también caza NaN y negativos). una
selección con 0 vistas era un rectángulo invisible igual, así que no cambia nada visual. se
descartó el parche en page.tsx (filtrar antes de pasar el prop) para no duplicar la lógica:
la robustez ante datos degenerados es responsabilidad de la función.
consecuencias: el termómetro tolera calor 0 sin colgarse, en "mi tribu" y en "las 48".
aprendizaje: un cuelgue sin error de consola = loop que satura el main thread, no excepción;
se caza con el Call Stack, no adivinando. los algoritmos de layout geométrico (treemap)
tienen que tolerar entradas degeneradas (área/lado 0); confiar en best=Infinity para aceptar
el primer item de cada fila es frágil ante NaN.
commit: 224e307 (components/Thermometer.tsx).
49. — fase 0 público + dominio cabala.futbol
contexto: decisión de hacer visible el dashboard con el pálpito como gancho. antes de
difundir: higiene técnica y de marca.
decisión: (1) chat escondido (import y render comentados en page.tsx): Sonnet sin rate
limit era un agujero de saldo; reactivación con suscripción = tema de la mutación
post-mundial. (2) metadata OG completa en layout.tsx + og.jpg: el og.png original (5.2MB)
era ignorado en silencio por WhatsApp (límite práctico ~600KB); convertido a jpg de 193KB
la preview salió con imagen. el caché de preview de WhatsApp se esquiva con ?v=N. (3)
manifest PWA (app/manifest.ts) + íconos del corazón naranja (192/512 + apple-icon 180):
instalable en el celular sin service worker; push/SW quedan para sprint 7.5. (4) Vercel
Analytics (@vercel/analytics, import /react). (5) dominio cabala.futbol comprado en
Vercel (US$15/año; cabala.app no estaba disponible): en español, temático, dictable por
teléfono y sobrevive a la mutación a dashboard futbolero. URLs actualizadas en
metadataBase, shares y user-agents de Wikipedia (pulse/heat).
riesgo aceptado: las covers de la capa inmersiva son capturas de pantalla propias de los
servicios recomendados; gris legal de riesgo bajo (uso editorial/promocional),
reemplazables en 20 minutos ante cualquier queja.
lección operativa: Vercel salteó el deployment de un commit (6e619e9) sin aviso; el smoke
test daba 404 contra el deploy viejo. regla nueva: antes de probar producción, verificar
en Deployments que el commit exacto figure Ready; si falta, Redeploy manual.
commits: 447c038, dc262fb, 1612bd7.

50. — el pálpito: prode sin registro + identidad anónima asignada + tabla global
contexto: diagnóstico de producto: el dashboard era información commodity sin loop de
retención; las palancas del hincha (identidad, participación, emoción compartida) estaban
flojas. el diferencial elegido: participación sin fricción — el prode argentino sin
crear cuenta, con la marca "el pálpito" (en difusión se usa la palabra "prode").
decisión v1 (localStorage puro, commit 25f92b8): components/Palpito.tsx autocontenido
(fetch propio de fixtures + merge live, sin tocar Calendar), pronóstico de resultado
exacto por partido, scoring prode (exacto 3, ganador 1) calculado client-side, share
estilo Wordle. inputs solo en partidos scheduled.
decisión v2 (backend + tabla, commits 6e619e9, 41d6cd7 y el frontend de esta sesión):
- identidad anónima ASIGNADA por el sistema, sin login: { id: uuid, alias } donde el
  alias tiene voz de marca (gambeta-dorado-74); vive en localStorage y en redis
  (palpito:user:{id}). el concepto general (definido antes en conversación): el usuario
  participa con un nombre que le asignamos; si algún día quiere su propio nombre, ahí sí
  login. este es el primer ladrillo de identidad para la mutación post-mundial.
- /api/palpito: register (rate 5/h por IP), bet (rate 60/min, valida enteros 0-20, lock
  server-side), GET (scoring SERVER-side contra fixtures:groups — nunca se aceptan puntos
  del cliente —, ZADD a palpito:rank, top 10 por ZREVRANGE + MGET de alias, posición por
  ZREVRANK). helper genérico lib/redis.ts (redisCmd) para comandos arbitrarios de Upstash.
- recálculo lazy: el score de cada usuario se recalcula cuando ÉL consulta (pull, sin
  cron). tradeoff aceptado: el score de un usuario inactivo queda viejo en la tabla hasta
  que vuelve.
- lock por status del fixture cacheado (el shape no tiene utcDate): ventana de ~5min
  post-pitazo en día de partido. pendiente: agregar utcDate aditivo al mapeo de fixtures
  y pasar el lock a reloj.
- frontend: registro automático al montar, sync cada 5min, subida one-time de pálpitos
  locales (solo scheduled), debounce 600ms por partido, tabla top 10 con fila propia
  resaltada, share con posición y alias. degradación total: si redis/el endpoint fallan,
  el módulo sigue 100% en modo local.
descartado por ahora: comentarios/chat con texto libre (moderación obligatoria + masa
crítica; la identidad anónima construida acá serviría para eso mañana). siguiente si el
pálpito valida: v3 ligas con código compartible (el verdadero motor de distribución).
primera escritura de datos de usuarios del proyecto; vigilar free tier de upstash.

51. — heat: merge por equipo con el último valor bueno (stale-on-error a nivel ítem)
contexto: en la mañana del kickoff, wikimedia throttleó la api de pageviews y 12-14
selecciones (incluida argentina, 5ª del planeta en atención) volvieron con views null →
heat 0. el filtro del squarify (ADR 48) las ocultaba del treemap en silencio, y cada
?refresh=true re-cacheaba una lotería distinta de ceros por 6 horas: el "nunca cachear
vacío" se cumplía a nivel payload pero no a nivel equipo.
decisión: (1) retryNull pasa a 3 intentos con backoff 400/800ms. (2) merge item-level:
antes de calcular maxViews/heat, todo equipo con medición 0 toma su último valor bueno
del cache previo (prevViews por code); maxViews se calcula post-merge; el cache nuevo se
escribe ya mergeado, propagando el último bueno. (3) debug.recovered lista los rescatados.
tradeoff: un equipo recuperado mezcla la ventana temporal anterior en una corrida;
aceptable frente a una selección ausente. ningún equipo del mundial tiene 0 vistas reales,
así que el merge no esconde datos genuinos.
principio elevado: la robustez stale-on-error aplica también por ítem, no solo por payload.
commit: 06d80c3.
52. — live: scoreboard de espn sin rango de fechas (estado en vivo real)
contexto: en el kickoff (méxico-sudáfrica), /api/live devolvía todos los partidos
"scheduled" con el partido al minuto 41. los nombres matcheaban perfecto: el problema era
el estado. diagnóstico por comparación: el scoreboard default de espn (sin parámetros)
decía state "in"; nuestro endpoint pedía ?dates=rango&limit=200 y recibía estados viejos.
50 minutos después el feed con rango ya mostraba "in": consistente con un cache/edge de
espn con lag para queries con parámetros de fecha. el default es la fuente confiable.
decisión: la url queda sin dates (scoreboard del día). los partidos futuros ya no vienen
de espn: el front degrada a /api/fixtures para "próximo", como estaba diseñado. se elimina
la función ymd sin uso.
consecuencias: header, calendario y pálpito reflejan el vivo real (verificado con méxico
1-0 sudáfrica, 45'+4'). el costo de la ventana amplia (un solo fetch para hoy y futuros)
se paga con la degradación ya existente.
commit: 304f804.
53. — palpito/calendar: identidad recién al primer pálpito (anti-bots) + re-merge de live
contexto: (a) la tabla acumuló 11 identidades en horas sin difusión. analytics: 27
visitantes directos sin referrer = scanners de dominios nuevos (certificate transparency)
que ejecutan js; el register al montar les creaba identidad. (b) al recargar durante un
partido en vivo, los inputs reaparecían hasta 60s: race entre el fetch base de fixtures y
el poll de live (si live llega primero, su merge cae sobre lista vacía y se pierde hasta
el próximo intervalo).
decisión: (a) el register se dispara en el primer handleInput (ref anti-doble); los bots
no tipean. el pálpito que dispara el registro sube después vía el sync one-time existente.
(b) el efecto del poll de live depende de fixtures.length: al llegar la base, re-fetchea
y mergea al instante. mismo fix en Calendar.tsx. en ningún momento hubo agujero de
integridad: el lock server-side rechazaba apuestas en la ventana ("cerró").
limpieza: identidades fantasma previas (sin bets) se purgan a mano en upstash (ZREM+DEL).
commits: e3ae927 (palpito), ec51113 (calendar).

## Cronograma realizado

- **Sprint 0** (mayo 2026): cuentas creadas, deploy pipeline GitHub→Vercel, primer "hola mundo" en producción.
- **Sprint 1** (mayo 2026): dashboard con 5 módulos y datos simulados, branding Cábala aplicado, módulos toggleables, tribu configurable.
- **Sprint 2** (mayo 2026): intento de integración con Reddit falla por cambio de política → pivot a Bluesky con App Password auth → módulo de memes muestra datos reales del torneo.
- **Sprint 3a** (mayo 2026): Claude API integrada para clasificación (cinco categorías), traducción al español rioplatense, scoring de relevancia, cache de enhancements para reducir costos.
- **Sprint 3b** (mayo 2026): asistente conversacional flotante con contexto del dashboard. Sonnet 4.6, manejo de errores, UI con tipping indicator, sugerencias en estado vacío.
- **Sprint 4b** (mayo 2026): integración con YouTube API. Tres iteraciones de filtrado: keywords brutas → keywords refinadas → clasificación con Haiku con tags. Módulo Viaje del hincha vivo con datos reales tageados (vlog / tour / preparación / experiencia).
- **Sprint 4c** (mayo 2026): Capa AR/VR. Catálogo hardcoded de 8 opciones inmersivas + recomendación contextual con Haiku basada en partido y perfil del usuario. Cierra Sprint 4.
- **Sprint 4d-1.6** (mayo 2026): consistencia de casing en lowercase + colorcito por día en calendario.
- **Sprint 4d-1.7** (mayo 2026): página `/fixture` con bracket completo del Mundial 2026, link destacado desde el dashboard principal.
- **Sprint 4d-1.8** (mayo 2026): modal de estadios en Ojo de Dios, datos vía Wikipedia REST API.
- **Sprint 4d-2** (mayo 2026): mapa de fondo en Ojo de Dios con países + estados/provincias visibles, 16 sedes en coordenadas geográficas reales.

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

