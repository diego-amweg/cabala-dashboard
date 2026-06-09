# sesión 2026-06-09 — resultados en vivo (arranque del mundial)

## completado
- tarea 1: /api/live vía ESPN (endpoint + cache dinámico + stale-on-error)
- tarea 2: header real (reemplaza fake CURRENT_MATCH/NEXT_MATCH, cronómetro eliminado)
- tarea 3: Calendar polling /api/live cada 60s + mergeWithLive
- tarea 4: maxAge dinámico en /api/fixtures y /api/standings (5min día de partido)
- deuda técnica: fixtures unificado a lib/teams.ts; aliases ESPN Bosnia y DR Congo

## commits
- 6ff58a8 agrega endpoint /api/live: resultados del mundial via ESPN
- 2771975 calendar: polling /api/live cada 60s, merge de scores y minuto en tiempo real
- e0af5a2 fixtures y standings: maxAge 5min en día de partido, 1h el resto
- a129c15 unifica mapa de nombres en lib/teams.ts, agrega alias ESPN Bosnia y Congo
- (page.tsx header real commiteado por AGM en sesión anterior)

## pendiente post-arranque
- verificar en vivo el 11 jun: que displayClock de ESPN llegue como se espera
- si algún equipo aparece en inglés en el calendar, agregar alias a lib/teams.ts
- bracket: conectar FixtureBracket a partidos no-GROUP_STAGE (~27 jun)