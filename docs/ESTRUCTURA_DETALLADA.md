# Estructura Detallada del Proyecto (Cabala)

Este documento detalla la estructura completa del repositorio en todos los niveles, proporcionando una explicación técnica del propósito de cada componente (carpetas, archivos principales), sus relaciones funcionales, flujos de datos (inputs/outputs) e información contextual relevante para facilitar el desarrollo y la navegación.

## 📂 Raíz del Repositorio

Contiene la configuración del proyecto Next.js, dependencias, reglas de linting y metadatos.

- **`package.json` / `package-lock.json`**: Define las dependencias (React, Next.js, Upstash Redis).
  - *Scripts*: 
    - `dev`: Levanta el servidor de desarrollo en local (`next dev`).
    - `build`: Compila la aplicación para producción (`next build`).
    - `start`: Inicia el servidor de producción con la versión compilada (`next start`).
    - `lint`: Ejecuta ESLint para análisis estático del código (`eslint`).
- **`tsconfig.json` / `tsconfig.tsbuildinfo`**: Configuración del compilador TypeScript (paths como `@/*`, tipados estrictos).
- **`next.config.ts`**: Configuración de Next.js (rutas, imágenes, middleware).
- **`eslint.config.mjs`**: Reglas de linting (Flat Config) para mantener calidad.
- **`postcss.config.mjs`**: Configuración de PostCSS para procesar Tailwind CSS.
- **`README.md`**: Introducción del proyecto.
- **`AGENTS.md` / `CLAUDE.md`**: Instrucciones (system prompts) para IA/LLMs.
- **`.env.local`**: Variables de entorno locales. *Input*: Credenciales estáticas (ej. Redis URL/Token). *Output*: Variables accesibles globalmente vía `process.env`.

---

## 📂 `app/` (Next.js App Router)

Enrutamiento principal y vistas.

- **`layout.tsx`**: *Root Layout*. *Input*: Contenido de páginas hijas. *Output*: Estructura HTML base con tipografías y providers.
- **`page.tsx`**: Página de inicio (`/`). *Output*: UI principal que orquesta múltiples componentes (fixture, palpito, predictor, relato, etc.).
- **`globals.css`**: Estilos globales y Tailwind.
- **`favicon.ico` / `apple-icon.png` / `manifest.ts`**: Archivos de metadata y PWA.

### 📁 `app/api/` (API Routes)
Actúa como *Backend for Frontend (BFF)*.
- **`chat/route.ts`**: Endpoint de chat interactivo.
- **`fixtures/route.ts`**: *Input*: Petición GET. *Output*: JSON con lista base de partidos (programados, estadios). Fusiona con caché y realiza merge anti-retroceso de estados.
- **`gifs/route.ts`**: *Output*: Gifs curados desde Giphy.
- **`heat/route.ts` / `pulse/route.ts`**: *Output*: Datos numéricos o de "temperatura" de los fans extraídos de Wikimedia.
- **`immersive/route.ts`**: Sirve metadata o desencadena experiencias de UI profunda.
- **`journey/route.ts` / `road/route.ts`**: *Output*: Datos de trayectos, historias de fans o progresión del mundial.
- **`live/route.ts`**: *Output*: JSON con estado en tiempo real y puntajes (`homeScore`, `awayScore`, `minute`) de partidos en juego usando scoreboard sin fecha de ESPN.
- **`palpito/route.ts`**: Endpoint del juego de pronósticos (Prode). *Inputs*: GET con `id` para sincronizar perfil y ranking, POST con `action: 'register' | 'bet'` para crear usuario o guardar un pálpito. *Outputs*: JSON con ID/Alias generados, estadísticas (`pts`, `rank`), top 10 usuarios. Interactúa fuertemente con Redis.
- **`predictor/route.ts`**: API del modelo matemático ("la matemática mundialista"). *Inputs*: Petición GET. *Outputs*: JSON con probabilidades por equipo (`odds`), número de `iterations` completadas de Monte Carlo y datos de diagnóstico de equipos (ej. `unmatchedTeams`).
- **`reddit/route.ts`**: Extrae contenido o sentimiento desde Reddit.
- **`relato/route.ts`**: *Output*: Texto literario/crónica diaria ("Relato del Día").
- **`stadium/route.ts`**: Metadata de sedes/estadios.
- **`standings/route.ts`**: Tablas de posiciones por grupos, con invariante anti-retroceso de partidos jugados.

### 📁 `app/fixture/`
- **`page.tsx`**: Página dedicada (`/fixture`). Muestra en profundidad llaves o fases de grupos.

---

## 📂 `components/` (Componentes React Específicos)

Componentes modulares de UI del cliente (`'use client'` en su mayoría).

- **`Cabalas.tsx`**: Muestra la lista de cábalas. *Input*: Importa array desde `data/cabalas.ts`. *Output*: Lista interactiva de folklore.
- **`Calendar.tsx`**: Visualiza fechas. *Input*: Props con lista de partidos. *Output*: UI de calendario con re-merge inmediato de `/api/live`.
- **`Chat.tsx`**: *Input*: Texto del usuario. *Output*: Muestra flujo de mensajes (llamando a `/api/chat`).
- **`FanJourney.tsx`**: Historia interactiva.
- **`FixtureBracket.tsx`**: Cuadro de playoffs. *Input*: Datos de partidos eliminatorios.
- **`GifWall.tsx`**: Grilla animada llamando a `/api/gifs`.
- **`GroupStage.tsx`**: Tablas de fase de grupos.
- **`ImmersiveLayer.tsx`**: Capa superpuesta con assets de `public/immersive/`.
- **`MemeCard.tsx`**: Tarjetas sociales o virales.
- **`Palpito.tsx`**: Juego de predicciones. *Inputs*: Efectos locales asíncronos que llaman a `/api/fixtures`, `/api/live`, y `/api/palpito`. *Outputs*: Renderiza lista de partidos con lock en base a horarios, identity asignada (anti-bots en primer pálpito) y tabla top 10.
- **`Predictor.tsx`**: UI del pronosticador. *Inputs*: Efecto a `/api/predictor` para traer simulación y `/api/fixtures` para partidos base. *Outputs*: Dos vistas toggleables ("camino al título" con grid y barras expansibles, o "partido por partido" mostrando local/empate/visitante).
- **`RelatoDelDia.tsx`**: Crónica narrativa. *Input*: Petición a `/api/relato`. *Output*: Párrafo literario renderizado.
- **`RoadToWorldCup.tsx`**: Módulo interactivo con mapa/líneas de tiempo.
- **`StadiumModal.tsx`**: Ventana sobre el estadio.
- **`TeamBadge.tsx`**: *Input*: Código/ID del equipo. *Output*: SVG o imagen del escudo.
- **`TeamPicker.tsx`**: *Output*: Selector de equipo favorito, guardando preferencia de usuario.
- **`Thermometer.tsx`**: *Input*: Polling a `/api/heat`. *Output*: Gráfico squarified treemap de atención.
- **`Ticker.tsx`**: Cinta pasante de noticias/resultados.

---

## 📂 `data/`

Datos estáticos, diccionarios y matrices fijas.

- **`cabalas.ts`**: Colección de folklore. *Output*: Constante `CABALAS` estática.
- **`mapData.ts`**: Datos cartográficos y geográficos para mapas del torneo.
- **`thirdPlaceMatrix.ts`**: Datos factuales del Mundial. *Output*: Constantes `BRACKET` (llaves R32 a la Final) y `THIRD_PLACE_MATRIX` (las 495 combinaciones de la regla FIFA para mejores terceros).

---

## 📂 `docs/`

Documentación, contexto e historial de sesiones de IA.

- **`CONTEXTO.md` / `PROJECT.md`**: Reglas de negocio y descripción fundamental.
- **`ESTRUCTURA_DETALLADA.md`**: Este mismo archivo.
- **`PROMPT-SESION.md` / `CLAUDE.md`**: Prompts y reglas de IA.
- **📁 `SESSIONS/`**: Historial dividido por hitos (incluyendo la adición de la matemática probabilística en `sesion-2026-06-12-matematica-mundialista.md`).

---

## 📂 `lib/` (Lógica Común, Modelos Matemáticos y Utilidades)

Funciones auxiliares, de uso transversal y modelos de predicción.

- **`cache.ts`**: *Input*: Función asíncrona. *Output*: Resultado cacheado.
- **`elo.ts`**: Cálculos del ranking Elo. *Input*: Ratings de dos equipos. *Output*: `expectedScore` y `updateElo`, maneja constante inicial (`ELO_INITIAL`) localías dinámicas a MEX/USA/CAN (`eloWithHost`).
- **`montecarlo.ts`**: Core estadístico del mundial. *Input*: Grupos y resultados reales hasta el momento. *Output*: Simulación rápida (decenas de miles de iteraciones con límite de presupuesto de tiempo `MC_TIME_BUDGET_MS`), devolviendo los `TeamOdds` acumulados.
- **`poisson.ts`**: Distribuciones de gol. *Inputs*: Elos de rivales. *Outputs*: `matchProbabilities` con corrección Dixon-Coles (grilla exacta para el Frontend) y `sampleScore` (muestreo super rápido a través de CDFs cacheados para uso intensivo en Monte Carlo).
- **`redis.ts`**: Cliente wrapper nativo para Upstash Redis via REST.
- **`teams.ts`**: Diccionario. *Input*: ID de equipo. *Output*: Nombres oficiales en ES, colores, etc.

---

## 📂 `public/` (Archivos Estáticos)

Assets servidos directamente sin procesamiento.

- Archivos root (`favicon.ico`, `icon-192.png`, `og.jpg`)
- Vectores SVG (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`, `giphy-logo.svg`)
- **📁 `immersive/`**: Imágenes pesadas para inmersión espacial (ej. `apple-vision-pro.jpg`, etc.).

---

## 🔄 Relaciones Funcionales de Alto Nivel

1. **Flujo de Usuario Inicial**: El fan carga la raíz (`app/page.tsx`). El cliente React monta componentes modulares como `Palpito.tsx`, `Predictor.tsx` y `Thermometer.tsx`.
2. **Hidratación y Carga en Tiempo Real**: 
   - Componentes combinan datos estáticos (`fixtures/route.ts`) con llamadas polling en vivo (`live/route.ts`). El predictor muestra resultados finales combinados con simulaciones estadísticas de Monte Carlo mediante `/api/predictor`.
3. **Módulo Matemático Probabilístico**:
   - `/api/predictor` orquesta la simulación. En tiempo de ejecución (bajo límite estricto serverless en Vercel) llama a `simulateTournament` en `lib/montecarlo.ts`.
   - `lib/montecarlo.ts` simula rondas basándose en probabilidades Poisson de `lib/poisson.ts` (optimizadas para millones de sorteos mediante CDF cacheado).
   - Para resolver enfrentamientos de octavos, `montecarlo.ts` emplea las constantes estrictas de FIFA de `data/thirdPlaceMatrix.ts`.
4. **Persistencia e Identidad (Prode)**:
   - Apuestas del pálpito se hidratan tardíamente (anti-bots en el primer input), fluyendo al DB global mediante `lib/redis.ts`.
5. **Assets Pesados**: `ImmersiveLayer` intercepta interacciones y precarga las imágenes de `/public/immersive/`.
