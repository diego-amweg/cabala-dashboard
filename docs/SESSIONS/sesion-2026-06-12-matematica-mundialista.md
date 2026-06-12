# Sesión 2026-06-12 — la matemática mundialista (predictor probabilístico)

## Qué se hizo
Se agregó un módulo nuevo al dashboard: un predictor probabilístico de resultados y campeón del
Mundial 2026, llamado "la matemática mundialista". Modelo serio a nivel de selección (Elo +
Poisson + Dixon-Coles + Monte Carlo de 50.000 simulaciones), con la matriz oficial FIFA de
terceros y el bracket canónico verificados.

## Decisiones de producto
- Scoring individual de jugadores y técnicos: DESCARTADO (no hay fuente de datos gratuita
  confiable; API-Football no da 2026, scraping frágil/ilegal, Opta/StatsBomb prohibitivos,
  APIs no oficiales = riesgo en pleno torneo).
- Modelo acotado a nivel de selección: serio y construible con football-data + Elo público.
- Localía: +65 Elo a México/USA/Canadá solo cuando juegan.
- Output dual: probabilidades por ronda (camino al título) + por partido (partido por partido).
- Nombre: "la matemática mundialista" (se evaluó "el campeón matemático" pero promete un único
  campeón; el módulo da probabilidades de muchos).
- Fidelidad total al reglamento: se incluyó la matriz FIFA de las 495 combinaciones de terceros
  (en vez de una aproximación sembrada).

## Arquitectura (6 archivos nuevos + 1 editado)
- data/thirdPlaceMatrix.ts: matriz de 495 combinaciones (formato compacto) + bracket R32→final.
  Datos factuales verificados contra FIFA + NBC + Bleacher + CBS + Sky + MLS.
- lib/elo.ts: ELO_INITIAL (48 en español, desde eloratings.net), expectedScore, updateElo,
  eloWithHost.
- lib/poisson.ts: matchProbabilities (con Dixon-Coles, para la vista de partidos) + sampleScore
  (muestreo rápido por CDF cacheada, para el Monte Carlo).
- lib/montecarlo.ts: simulateTournament (50k iteraciones, desempate FIFA, matriz de terceros,
  bracket completo) + presupuesto de tiempo de seguridad.
- app/api/predictor/route.ts: orquesta (lee fixtures:groups, resultados reales, cachea con
  stale-on-error + maxAge dinámico + autodiagnóstico).
- components/Predictor.tsx: dos vistas con toggle, halo naranja en la selección elegida.
- app/page.tsx: 4 ediciones quirúrgicas (import, ALL_MODULES, toggle, render).

## El problema de performance (lo importante de la sesión)
El Monte Carlo de 50k tardaba 69s. Se detectó leyendo el log de `npm run dev`
(GET /api/predictor 200 in 65s) — NO era cold-start de Turbopack, era la simulación real.
Excedía el corte de 10s de funciones serverless de Vercel: timeout garantizado en producción
(el modo dev no tiene ese límite y escondía el problema). Se optimizó SIN tocar iteraciones ni
calidad: factoriales precomputados, curva Poisson cacheada como CDF por lambda, muestreo de goles
por equipo separado (2 sorteos de 9 en vez de grilla de 81), Elo efectivo precomputado una vez.
Resultado: 69s → ~5s (15x más rápido), números idénticos, todas las invariantes intactas. La
corrección Dixon-Coles se sacó solo del sampleo del Monte Carlo (no afecta quién avanza); la vista
de partidos la mantiene. Red de seguridad: presupuesto de 8s dentro del loop que corta y devuelve
lo acumulado en vez de tirar timeout. Verificado en local: el endpoint pasó de 65s a 5.5s.

## Proceso con Antigravity
Tres specs encadenadas (lógica pura → endpoint+montecarlo → componente+integración), cada una
verificada con tsc (+ build en la tercera). En la revisión de diffs se cazaron cosas que tsc/build
no ven: `as any` en eloWithHost, dos `catch (err: any)`, floats crudos en anchos de barra, y la
vista de partidos que filtraba solo scheduled (no mostraba los jugados). Todo corregido antes de
commitear. Confirma el aprendizaje previo: la verificación automática (tsc) baja la tasa de
errores pero no la lleva a cero; la revisión humana del diff sigue cazando lo que el compilador no.

## Verificación
- npx tsc --noEmit limpio + npm run build exitoso.
- Monte Carlo validado en sandbox: suma champion 100%, suma r32=32, suma r16=16, monotonía de
  rondas, unmatchedTeams vacío. Top coherente: España ~27%, Argentina ~18%, Francia ~12%.
- En local: /api/predictor vuelve en ~5.5s, las dos vistas se ven bien, los jugados (México 2-0,
  Corea 2-1, Canadá 1-1) aparecen arriba con su resultado.

## Pendiente
- Verificar en producción que /api/predictor vuelve dentro del límite de Vercel.
- Calibración fina de constantes (ELO_TO_GOALS/BASE_GOALS/DC_RHO) si se quiere afinar magnitudes.
- Aparte (hardening previo): commit de tipos de Palpito.tsx + api/palpito/route.ts.