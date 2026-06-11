# Sesión 2026-06-11 — lanzamiento público: fase 0, el pálpito v1+v2, dominio y fix del heat

Jornada del kickoff. Todo deployado antes del primer partido (México-Sudáfrica 16:00 ART).

## Hecho
- Fase 0 público (ADR 49): chat escondido, og.jpg liviano (el png de 5.2MB era ignorado
  por WhatsApp), manifest PWA + íconos, Vercel Analytics, dominio cabala.futbol comprado
  y conectado, URLs actualizadas (commits 447c038, dc262fb, 1612bd7).
- El pálpito v1 (ADR 50): prode local sin registro, scoring 3/1, share (commit 25f92b8).
- El pálpito v2 (ADR 50): backend /api/palpito + lib/redis.ts con identidad anónima
  asignada, scoring server-side, tabla global en sorted set, rate limits (commits 6e619e9,
  41d6cd7) + frontend con sync, tabla top 10 y share con posición.
- Fix del heat (ADR 51): merge item-level con el último valor bueno; Argentina y otras
  11-13 selecciones habían desaparecido del termómetro por throttling de Wikimedia
  (commit 06d80c3). Verificado: 48/48 medidas, failed [].

## Proceso
- AGM ejecutó 4 specs (fase 0, pálpito v1, v2-A backend, v2-B frontend). En revisión de
  diff se cazaron: edición fuera de scope (ESTRUCTURA_DETALLADA.md, revertida), dos
  `catch (err: any)`, falta de Number.isInteger en la validación de goles, JSON.parse sin
  tipar, dependencia booleana en un array de deps y timers sin cleanup. El flujo
  spec → diff → revisión → commit volvió a pagar.
- Lección Vercel: un commit (6e619e9) no generó deployment y el smoke test daba 404
  contra el deploy viejo. Regla nueva: verificar Deployments → Ready antes de probar.

## Pendientes que abre la jornada
- utcDate aditivo en /api/fixtures → lock del pálpito por reloj.
- v3 ligas con código compartible (si el pálpito valida).
- Chequeo en vivo 16:00: nombres ESPN vs calendar/pálpito; aliases a lib/teams.ts.
- Difusión fase 1: WhatsApp, r/argentina, Bluesky, medio local (mensaje: "armá tu prode
  del Mundial sin registrarte").
- Opcional: borrar el jugador fantasma del smoke test (wing-glorioso-74) en Upstash.

## Addendum (16:00-17:00) — incidente live en el kickoff
/api/live reportaba scheduled con el partido en juego. causa: el scoreboard de espn con
?dates=rango sirve estados con lag; sin parámetros trae el vivo real. fix en caliente
durante el entretiempo (commit 304f804). verificado: live 45'+4' en header, calendario
y api. lección: para datos en tiempo real, validar el endpoint exacto con el evento
ocurriendo, no solo con el shape.

## Addendum 2 (17:00-18:00) — anti-bots y race del merge
analytics reveló 27 visitas directas sin referrer (scanners del dominio nuevo) que
inflaban la tabla con identidades fantasma vía el register al montar. fix: identidad
recién al primer pálpito. segundo fix: race fixtures/live que mostraba inputs ~60s en
partidos en vivo tras recargar (sin agujero: el lock server-side rechazaba). aplicado
en palpito y calendar. commits e3ae927 + ec51113.
