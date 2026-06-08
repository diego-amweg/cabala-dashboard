# Sesión — gancho "cábalas" (folklore del hincha) (2026-06-05/06)

Hecho (ADR 46):
- data/cabalas.ts: colección curada (20: 15 universales + 5 de hinchada). Solo folklore colectivo, nada de jugadores/DTs reales.
- components/Cabalas.tsx: variant 'dia' (cábala del día rotada, fija arriba) + 'coleccion' (módulo toggleable, "mi cábala" en localStorage). Frontend puro.
- page.tsx: toggle 'cabalas' + <Cabalas variant="dia"/> bajo el relato + colección condicionada al toggle.

Proceso:
- Cuarta tarea con Antigravity: limpio en casi todo. La revisión cazó una violación de reglas de hooks (hooks después de un early return por variant) que tsc/build no detectan; corregido dividiendo en dos subcomponentes + dispatcher.
- Decisión de producto: crecimiento de la colección CURADO (Claude busca/propone en sesión, Diego valida), NO búsqueda automática diaria (mismo riesgo que los memes + el folklore no se renueva a diario + requeriría cron).

Próximo: los tres ganchos del corazón cerrados. Vigilar el crecimiento curado durante el Mundial.
