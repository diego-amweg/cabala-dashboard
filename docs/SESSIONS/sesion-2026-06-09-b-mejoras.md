# sesión 2026-06-09-b — mejoras pre-mundial

## completado
- diagnóstico: bluesky feed ya tenía cache en redis (FEED_CACHE_KEY, 15min TTL) — eliminado del backlog
- CLAUDE.md: stack actualizado a Next.js 16.2.4, workflow de Diego corregido, AGM documentado, timestamp eliminado
- road cold start: pre-warm de toda la tribu en dos capas
  - RoadToWorldCup.tsx: al abrir el módulo, pre-calienta las 12 selecciones en background
  - page.tsx: al montar la página, pre-calienta toda la tribu antes de que el usuario abra el módulo
  - max_tokens bajado de 2500 a 1500 (limpieza)
- análisis fakes: mapa de sedes y "en las calles" evaluados → diferidos post-kickoff
  - mapa: Wikipedia pageviews de estadios como opción; GDELT como alternativa
  - calles: GDELT/RSS de medios locales; contenido curado hasta entonces

## commits
- 41b9a06 docs: actualiza CLAUDE.md (stack, workflow AGM)
- a92a6ef road: pre-calienta toda la tribu al abrir el módulo, reduce max_tokens a 1500
- 6784a35 page: pre-calienta road de toda la tribu al montar la página

## pendiente post-kickoff (13 jun en adelante)
- GDELT para intensidad del mapa de sedes
- RSS de medios locales para "en las calles"
- bracket: conectar FixtureBracket cuando football-data cargue eliminatorias (~27 jun)