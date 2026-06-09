# Sesión 2026-06-09 (c) — fix: cuelgue del dashboard por loop infinito en el termómetro

## Síntoma
El dashboard se colgaba en prod (cabala-dashboard.vercel.app) y en local: diálogo "la
página no responde", F5 igual, el botón ABRIR tampoco respondía. Sin errores en la consola
del navegador. Intermitente.

## Diagnóstico
- Chrome: pausar con F8 dejó el Call Stack clavado dentro de Thermometer.tsx.
- Firefox: "Script terminated by timeout at: R/m</s<..." → R = Thermometer, m = useMemo del
  treemap, s< = worstRatio.
- Scope en el breakpoint: `areas: [0]`, `worst = NaN`.

## Causa raíz
`squarify` entra en loop infinito cuando una selección tiene `heat = 0`:
- área = (heat/total)*W*H = 0.
- `worstRatio([0], side, 0)`: length = 0/side = 0; other = 0/0 = NaN; worst = NaN.
- `if (ratio <= best)` con ratio NaN da false → el while interno corta sin consumir el item,
  sin avanzar `i`, sin achicar rw/rh.
- el while externo gira para siempre y clava el main thread → cuelgue sin crash.
Heat = atención de Wikipedia (sqrt normalizado 0-100), puede dar 0 para una selección con
~0 vistas. Bug latente; los datos del día lo destaparon. NO lo causó el commit 6784a35
(header/pre-warm); la correlación de timeline fue pista falsa, descartada por el Call Stack.

## Fix
`components/Thermometer.tsx`, en `squarify`: `const valid = teams.filter(t => t.heat > 0)`
antes de calcular total/scaled (descarta también NaN y negativos). El fix vive en el
algoritmo, no en el caller; se descartó el parche temporal en page.tsx para no duplicar la
lógica. Visualmente idéntico (una selección con 0 vistas ya era un rectángulo invisible).

## Verificación
- `npx tsc --noEmit` OK.
- `npm run dev` sin cuelgue; "mi tribu" y "las 48" renderizan las 48 selecciones.
- Producción OK tras deploy.

## Commit
224e307 — endurece el squarify del termómetro: ignora calor 0 para evitar loop infinito.

## Nota de proceso
El parche inicial en page.tsx (filtrar heat>0 antes del prop) se aplicó para revivir y
después se revirtió (`git checkout -- app/page.tsx`) al mover la robustez a Thermometer. En
el medio hubo un paso donde el fix de Thermometer no estaba guardado y el revert del parche
dejó la página otra vez colgada: confirmar siempre que el archivo se guardó y que Sources
muestra el código nuevo antes de testear.