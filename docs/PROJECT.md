# Cábala — Documento de Contexto

> *La superstición se hizo software.*

Plataforma personal para vivir el Mundial 2026 como fenómeno cultural total, no solo como torneo deportivo. Termómetro global configurable, en tiempo real, asistido por IA.

## ⚠ PENDIENTE PARA EL ARRANQUE DEL MUNDIAL (11 jun 2026)
- Resultados en vivo: el ticker y el calendario tienen que mostrar marcadores reales. El
  endpoint /api/standings ya calcula puntos de partidos finalizados y el calendario ya mapea
  scores, así que gran parte se "enciende solo"; falta verificar contra datos reales, bajar el
  TTL del cache en días de partido y armar el ticker LIVE en page.tsx.
- Bracket de eliminatorias (FixtureBracket): las llaves se cargan cuando football-data agregue
  los partidos de Round of 32 en adelante (al cerrarse los grupos, ~27 jun). Conectar el
  componente a los partidos que NO son GROUP_STAGE.
- REVISAR estos dos apenas empiece el torneo, y de nuevo en la fase de eliminatorias.

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
