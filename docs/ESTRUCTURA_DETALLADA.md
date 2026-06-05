# Estructura Detallada del Proyecto (Cabala)

Este documento detalla la estructura completa del repositorio en todos los niveles, proporcionando una explicación técnica del propósito de cada componente (carpetas, archivos principales), sus relaciones funcionales, flujos de datos (inputs/outputs) e información contextual relevante para facilitar el desarrollo y la navegación.

## 📂 Raíz del Repositorio

Contiene la configuración del proyecto Next.js, definiciones de dependencias, reglas de linting e información de metadatos y documentación.

- **`package.json` / `package-lock.json`**: Define las dependencias del proyecto (React, Next.js, y librerías adicionales), scripts de ejecución (`dev`, `build`) y la configuración base del proyecto.
- **`tsconfig.json` / `tsconfig.tsbuildinfo`**: Configuración del compilador TypeScript. Define tipados estrictos, paths absolutos (`@/*`) y opciones de transpilación.
- **`next.config.ts`**: Configuración del framework Next.js. Maneja opciones de enrutamiento, dominios de imágenes externas, y configuración de servidor.
- **`eslint.config.mjs`**: Reglas de linting de ESLint (en formato Flat Config) para mantener la calidad y homogeneidad del código.
- **`postcss.config.mjs`**: Configuración de PostCSS, comúnmente usado junto con Tailwind CSS para procesar directivas utilitarias de estilos.
- **`README.md`**: Información básica de introducción al proyecto.
- **`AGENTS.md` / `CLAUDE.md`**: Instrucciones específicas o *system prompts* para agentes de inteligencia artificial y asistentes de código que interactúan con el repositorio.
- **`.env.local`**: Variables de entorno locales (no versionadas) que contienen claves de APIs, credenciales de bases de datos o secretos necesarios para correr el servidor localmente. *Input*: Credenciales estáticas. *Output*: Variables dinámicas accesibles mediante `process.env`.

---

## 📂 `app/` (Next.js App Router)

Esta carpeta constituye el enrutamiento de la aplicación y las vistas principales.

- **`layout.tsx`**: El *Root Layout* de la aplicación. Envuelve todas las rutas proporcionando el esqueleto HTML, inyección de fuentes (`next/font`), y carga de proveedores globales (contextos de estado).
- **`page.tsx`**: La página de inicio principal (`/`). Es el dashboard o vista por defecto donde convergen múltiples componentes de UI.
- **`globals.css`**: Estilos globales, variables CSS o directivas de Tailwind CSS (`@tailwind base`, `@tailwind components`, `@tailwind utilities`).
- **`favicon.ico`**: Ícono de la aplicación.

### 📁 `app/api/` (API Routes)
Endpoints del lado del servidor que actúan como un *Backend for Frontend (BFF)*, sirviendo datos a los componentes del cliente.
- **Subdirectorios (`chat`, `fixtures`, `gifs`, `heat`, `immersive`, `journey`, `pulse`, `reddit`, `road`, `stadium`, `standings`)**: Cada subcarpeta (probablemente conteniendo archivos `route.ts`) representa un endpoint específico. 
  - *Inputs*: Solicitudes HTTP (GET/POST) con parámetros de búsqueda o body de JSON.
  - *Outputs*: Respuestas JSON con datos procesados provenientes de bases de datos, APIs de terceros (Reddit, Giphy, datos de partidos) o cachés internas.

### 📁 `app/fixture/`
Ruta específica de la aplicación web.
- **`page.tsx`**: Componente de página accesible en `/fixture`. Muestra detalles de un partido, grupo o llave específica.

---

## 📂 `components/` (Componentes React Específicos)

Esta carpeta contiene componentes modulares y reutilizables, enfocados en la temática de fútbol/deportes.

- **`Calendar.tsx`**: Muestra un calendario de fechas o partidos. *Input*: Lista de fechas/eventos. *Output*: Vista interactiva de calendario.
- **`Chat.tsx`**: Interfaz de chat (posiblemente interactuando con `/api/chat`). *Input*: Mensajes del usuario. *Output*: Envío del mensaje y visualización de historial.
- **`FanJourney.tsx`**: Componente para trazar el viaje de los fans o una historia interactiva de experiencia de usuario.
- **`FixtureBracket.tsx`**: Representación gráfica de un cuadro de eliminación (playoffs/llaves). *Input*: Datos de cruces y resultados.
- **`GifWall.tsx`**: Muro o grilla de GIFs animados (comunicándose típicamente con la API `/api/gifs`).
- **`GroupStage.tsx`**: Componente que renderiza tablas de posiciones para la fase de grupos.
- **`ImmersiveLayer.tsx`**: Una capa inmersiva superpuesta, posiblmente para efectos de estadio, sonido, o experiencias de realidad inmersiva (ambientales).
- **`MemeCard.tsx`**: Tarjeta de presentación de contenido viral o memes.
- **`RoadToWorldCup.tsx`**: Módulo interactivo detallando el recorrido hacia el mundial (líneas de tiempo, clasificaciones, mapas).
- **`StadiumModal.tsx`**: Ventana modal mostrando información o un tour visual de un estadio en particular.
- **`TeamBadge.tsx`**: Componente visual pequeño (escudo/logo de equipo). *Input*: ID o acrónimo del equipo.
- **`Thermometer.tsx`**: Representación visual tipo "termómetro", posiblemente mostrando la "temperatura" (euforia/sentimiento) de la hinchada o datos en tiempo real (consumiendo `/api/heat` o `/api/pulse`).
- **`Ticker.tsx`**: Cinta de noticias o resultados en movimiento continuo, mostrando actualizaciones rápidas a lo largo de la pantalla.

---

## 📂 `data/`

Contiene datos estáticos estructurados o esquemas duros.
- **`mapData.ts`**: Contiene arreglos u objetos con coordenadas geográficas, polígonos, o información cartográfica útil para dibujar mapas (ej. sedes, trayectos en el `FanJourney.tsx` o `RoadToWorldCup.tsx`).

---

## 📂 `docs/`

Documentación extendida, lineamientos y bitácoras del proyecto.
- **`PROJECT.md` / `CONTEXTO.md`**: Documentos fundacionales que describen las reglas de negocio, el alcance, los flujos principales y el contexto del producto.
- **`PROMPT-SESION.md` / `CLAUDE.md`**: Instrucciones, directrices o *prompts* utilizados para interactuar con agentes de IA durante el desarrollo para asegurar consistencia arquitectónica.
- **📁 `SESSIONS/`**: Directorio donde se guardan historiales, logs de sesiones de pruebas, o transcripciones pasadas.

---

## 📂 `lib/` (Lógica de Utilidad Común)

Funciones auxiliares y módulos que no devuelven UI, diseñados para ser importados donde se requiera, tanto en servidor como en cliente.
- **`cache.ts`**: Lógica para gestionar caché en memoria o envolver funciones asíncronas para retener respuestas. *Input*: Llaves e identificadores. *Output*: Datos cacheados, reduciendo tiempos de latencia con APIs y optimizando llamadas en `/app/api/`.
- **`teams.ts`**: Utilidades relacionadas con el manejo de datos de equipos (formateo de nombres, obtención de colores, mapeo de IDs a recursos visuales).

---

## 📂 `public/` (Archivos Estáticos)

Archivos que el servidor web despacha directamente y sin procesar desde la raíz de URL (`/`).
- **`file.svg` / `window.svg` / `globe.svg`**: Íconos vectoriales genéricos usados transversalmente.
- **`next.svg` / `vercel.svg`**: Logos de branding del framework y proveedor de hosting.
- **`giphy-logo.svg`**: Logo para dar atribución al proveedor de GIFs de terceros.
- **📁 `immersive/`**: Carpeta de archivos pesados o recursos gráficos/multimedia estáticos específicos para el componente `ImmersiveLayer.tsx` (posiblemente texturas, imágenes 360, o animaciones).

---

## 🔄 Relaciones Funcionales de Alto Nivel

1. **Visualización e Interactividad (Frontend)**: El usuario visita la ruta principal (`app/page.tsx`), la cual orquesta componentes visuales potentes de la carpeta `components/` (tales como `Thermometer.tsx`, `Ticker.tsx`, `FixtureBracket.tsx` y `GifWall.tsx`).
2. **Petición de Datos**: A medida que los componentes lo necesitan, disparan solicitudes a los endpoints de la API interna ubicados en `app/api/`. Por ejemplo, `GifWall.tsx` hace solicitudes asíncronas a `app/api/gifs`; el `Thermometer.tsx` puede estar suscripto a *polling* en `app/api/pulse` o `app/api/heat`.
3. **Gestión en el Backend y Caché**: Los endpoints de `/api/` en el servidor recolectan información estructurada (usando las constantes de `data/` o utilidades como `lib/teams.ts`) o realizan *fetching* a plataformas externas. Para optimizar estas conexiones y evitar rate-limits (especialmente APIs externas de Giphy, Reddit, etc.), utilizan rutinas expuestas en `lib/cache.ts`.
4. **Recursos Multimedia Inmersivos**: Si se activan eventos clave en la interacción del fan (ej. dentro de `RoadToWorldCup.tsx` o `StadiumModal.tsx`), el frontend delega a `ImmersiveLayer.tsx` que superpone la experiencia y carga *assets* dinámicos guardados en el subdirectorio `public/immersive/`.
