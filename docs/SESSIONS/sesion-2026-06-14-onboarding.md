# Sesión 2026-06-14 — onboarding (masthead + globitos)

## Disparador
Feedback de campo: al compartir el dashboard, los únicos comentarios fueron "¿qué es eso?" y
"¿para qué sirve?". Problema de orientación del visitante nuevo, no de ningún módulo puntual.

## Qué se hizo
- Masthead: franja explicativa (tinte naranja) debajo del header, responde qué es y qué hacer.
  No repite el título (el header ya tiene "Cábala"); se ajustó esto al ver el page.tsx real.
- Bubble.tsx: componente reusable de "globito" de ayuda. Anima una vez por módulo (localStorage),
  queda quieto, respeta prefers-reduced-motion (CSS). Tres variantes de color con significado:
  play (naranja), data (verde), info (neutro).
- Globitos en cinco módulos: pálpito (dinámico, dentro de Palpito.tsx), matemática mundialista,
  termómetro, ojo de dios, cábalas.
- El contraste pálpito (vos jugás) / matemática mundialista (la compu calcula) resuelve la
  confusión entre los dos módulos de predicción introducida en la sesión anterior.

## Decisiones
- Alcance 5 de 6: el relato del día quedó afuera (es franja suelta arriba, choca con el masthead).
- Globito del pálpito dinámico y adentro de Palpito.tsx porque necesita alias/puesto (estado del
  componente); page.tsx no los tiene.
- Persistencia: globitos permanentes y quietos tras animar una vez (no se cierran).
- Proceso: pasada única con AGM (no loop autónomo). Se discutió darle un loop con review/debug a
  AGM; se descartó porque su loop (tsc+build) ya existe y no caza los bugs de criterio (evidencia:
  ADR 55, cinco bugs que pasaron tsc/build limpios). Regla: review proporcional al riesgo.

## Verificación
- tsc --noEmit + build limpios.
- Revisión de diff: fragment de Palpito balanceado sin reindentar, sin any, hooks ok, las 6
  inserciones de page.tsx sin tocar nada de más.
- En local: masthead se lee bien y no choca con el relato; globito del pálpito cambia de estado
  (sin identidad → con alias + puesto); animación dispara una sola vez (recarga = quieto).

## Deuda menor (no bloqueante)
- En el pálpito, el globito se superpone con el subtítulo del header y la línea "jugás como {alias}
  · #N". Se dejó así; limpieza cosmética para cuando sea.
- Eventual: extender globitos al relato si se decide; calibrar copy.