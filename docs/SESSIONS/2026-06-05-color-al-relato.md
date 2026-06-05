# Sesión — color al relato (memes + journey) (2026-06-05)

Hecho (extensión de ADR 44 -> ADR 45):
- /api/relato suma color de memes (bluesky:feed) y viaje del hincha (journey:all) como AMBIENTE, no como hecho. Tipos concretos (sin any). debug suma memesStr/journeyStr.
- Refuerzo anti-invento en el prompt: prohibido efemérides/contexto histórico/datos de jugadores no provistos. Disparador: Haiku metió "el partido que marcó el 2010", cierto pero no provisto.
- Termómetro aclarado como MUNDIAL en el prompt (Haiku lo llamaba "sudamericano").

Notas:
- Tercera tarea con Antigravity: keys/shapes correctos (verificados contra reddit/route.ts y journey), sin any. La revisión cazó dos cosas del PROMPT (no de Antigravity): la efeméride y el "sudamericano".
- Color de memes es best-effort: bluesky:feed vive 15min, journey 6h; cuando el relato se genera el de memes suele estar frío. Aceptado (no meter latencia al relato por una frutilla).

Próximo: "cábalas" curadas (gancho 3); UGC como sesión aparte.

## Enmienda (mismo día): memes fuera del relato
Con el cache de memes caliente, el color de memes filtró afirmaciones del feed (Geoff Hurst "mirando desde la tribuna" — inventado; David Raya, Newark). El feed son afirmaciones, no clima; la regla "no es hecho" no alcanzó. Se sacó memes del prompt (queda en debug), quedó solo journey, y se endureció la regla de color. Aprendizaje: contenido de terceros como "color" es seguro solo si ya es genérico (títulos de vlogs); un feed de noticias/memes mete afirmaciones.

## Enmienda (mismo día): memes fuera del relato
Con el cache de memes caliente, el color de memes filtró afirmaciones del feed (Geoff Hurst "mirando desde la tribuna" — inventado; David Raya, Newark). El feed son afirmaciones, no clima; la regla "no es hecho" no alcanzó. Se sacó memes del prompt (queda en debug), quedó solo journey, y se endureció la regla de color. Aprendizaje: contenido de terceros como "color" es seguro solo si ya es genérico (títulos de vlogs); un feed de noticias/memes mete afirmaciones.
