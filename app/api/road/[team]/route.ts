import { NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache';

interface RoadMoment {
  date: string;
  title: string;
  narrative: string;
  tag: 'decisivo' | 'drama' | 'hito' | 'preocupación';
}

interface RoadToWorldCup {
  team: string;
  teamName: string;
  headline: string;
  status: 'clasificado' | 'repechaje' | 'en lucha' | 'eliminado';
  moments: RoadMoment[];
  outlook: string;
}

// cache en upstash redis: persiste entre cold starts de vercel. ttl en segundos.
const CACHE_TTL = 24 * 60 * 60;

const TEAM_NAMES: Record<string, string> = {
  ARG: 'Argentina',
  BRA: 'Brasil',
  URU: 'Uruguay',
  PAR: 'Paraguay',
  COL: 'Colombia',
  ECU: 'Ecuador',
  MEX: 'México',
  USA: 'Estados Unidos',
  CAN: 'Canadá',
  FRA: 'Francia',
  ESP: 'España',
  JPN: 'Japón',
};

const TEAM_FACTS: Record<string, string> = {
  ARG: `Argentina: TRICAMPEONA del Mundial (1978, 1986, 2022) — son TRES títulos, no dos. 16 Copas América (récord absoluto), bicampeona consecutiva en 2021 y 2024. DT: Lionel Scaloni. Capitán: Lionel Messi (con interrogantes físicos por edad). Vigente campeona del mundo y de Copa América. Clasificada para el Mundial 2026, selló matemáticamente la clasificación en marzo 2025 con triunfo 1-0 a Uruguay.`,
  BRA: `Brasil: PENTACAMPEÓN del Mundial (1958, 1962, 1970, 1994, 2002), récord absoluto. 9 Copas América. Última copa del mundo: 2002 (lleva 24 años sin ganar). En el Mundial 2022 fue eliminado en cuartos por Croacia. DT: Carlo Ancelotti (italiano, ex-Real Madrid, asumió en mayo 2025 y renovó hasta 2030, es el DT de selecciones mejor pago del mundo). Clasificada directa para 2026 con turbulencias en eliminatorias. Grupo C con Marruecos, Haití y Escocia. Neymar volvió a ser convocado por primera vez con Ancelotti.`,
  URU: `Uruguay: BICAMPEÓN del Mundial (1930 como anfitrión y 1950 con el "Maracanazo" en Brasil). 15 Copas América. DT: Marcelo Bielsa (rosarino, asumió en 2023 y ya anunció que deja la celeste después del Mundial 2026 para volver a Newell's). Capitán: Federico Valverde. Clasificada directa al Mundial 2026 entre las 6 selecciones sudamericanas que pasaron. Grupo H con España, Cabo Verde y Arabia Saudita. Luis Suárez no fue convocado.`,
  PAR: `Paraguay: NUNCA ganó un Mundial. 2 Copas América (1953, 1979). Mejor performance: cuartos de final en Sudáfrica 2010 (perdió 1-0 contra España, que después fue campeona). DT: Gustavo Alfaro (rafaelino, santafesino, ex-Boca y Costa Rica). Clasificada directa al Mundial 2026, vuelve después de 16 años (su última participación fue 2010). Grupo D, debuta contra el anfitrión Estados Unidos en Los Ángeles.`,
  COL: `Colombia: NUNCA ganó un Mundial. 1 Copa América (2001 como anfitrión). Mejor performance Mundial: cuartos de final en Brasil 2014 (perdió 2-1 vs Brasil, James Rodríguez fue goleador del torneo con el famoso golazo de volea contra Uruguay). DT: Néstor Lorenzo (argentino, asumió 2022, atravesó momentos de duda en eliminatorias). Clasificada directa al Mundial 2026. Generación de James Rodríguez, Luis Díaz, Jhon Jáder Durán. Cerró eliminatorias con bajada de rendimiento (solo 4 puntos en las últimas 6 fechas).`,
  ECU: `Ecuador: NUNCA ganó un Mundial. 0 Copas América. Mejor performance Mundial: octavos de final en Alemania 2006. DT: Sebastián Beccacece (rosarino, asumió en 2024). Clasificada directa al Mundial 2026 a pesar de haber empezado las eliminatorias con -3 puntos por la sanción del caso Byron Castillo. Generación de Piero Hincapié (Bayer Leverkusen), Moisés Caicedo (Chelsea), Willian Pacho (PSG). No supera fase de grupos desde 2006.`,
  MEX: `México: NUNCA ganó un Mundial. Mejor performance: cuartos de final en 1970 y 1986 (las dos veces como anfitrión). DT: Javier Aguirre (3ra etapa al frente del Tri, asumió julio 2024). Su asistente Rafael Márquez ya está confirmado para tomar el cargo después del Mundial. Es anfitrión del Mundial 2026 junto con EEUU y Canadá, clasificó directamente. Tradición frustrada de eliminación en octavos. Inaugura el Mundial el 11 de junio frente a Sudáfrica en el Estadio Azteca.`,
  USA: `Estados Unidos: NUNCA ganó un Mundial. Mejor performance moderna: cuartos de final en Corea-Japón 2002 (el tercer puesto en 1930 fue en un Mundial poco competitivo). DT: Mauricio Pochettino (argentino, oriundo de Murphy, Santa Fe, ex-PSG y Tottenham, asumió en septiembre 2024). Anfitrión del Mundial 2026, clasifica directamente. Grupo D, debuta el segundo día del Mundial frente a Paraguay en Los Ángeles. Generación de Christian Pulisic, Weston McKennie, Gio Reyna.`,
  CAN: `Canadá: NUNCA ganó un Mundial y NUNCA ganó un partido mundialista (0 victorias en 6 partidos jugados entre 1986 y 2022, solo 2 goles en toda su historia mundialista). Es su tercera participación. DT: Jesse Marsch (estadounidense, ex-Leeds y Leipzig, asumió mayo 2024 reemplazando a John Herdman). Anfitrión del Mundial 2026, clasifica directamente. Capitán Alphonso Davies (Bayern Múnich, en recuperación de lesión muscular). Mejor performance regional: 4to puesto en Copa América 2024. Grupo B con Bosnia, Qatar y Suiza, debut en Toronto el 12 de junio.`,
  FRA: `Francia: BICAMPEONA del Mundial (1998, 2018). Finalista en 2022 (perdió contra Argentina por penales). DT: Didier Deschamps (anunció que se va después del Mundial 2026). Capitán: Kylian Mbappé. Clasificada para el Mundial 2026 por UEFA. Solo 10 jugadores de la final perdida contra Argentina sobreviven en la lista actual.`,
  ESP: `España: CAMPEONA del Mundial UNA sola vez (2010). Campeona de la Eurocopa 2024. DT: Luis de la Fuente. Clasificada para el Mundial 2026. Vive un excelente momento generacional con Yamal, Pedri, Rodri. Grupo H con Uruguay, Cabo Verde y Arabia Saudita.`,
  JPN: `Japón: NUNCA ganó un Mundial. Llega habitualmente a octavos (2002, 2010, 2018, 2022). En el Mundial 2022 venció a Alemania y España en fase de grupos pero fue eliminado en octavos por Croacia por penales. DT: Hajime Moriyasu (sigue al frente del equipo después de Qatar 2022, hubo una noticia falsa en abril 2026 sobre que había sido reemplazado por Shunsuke Nakamura, pero Nakamura solo se sumó al cuerpo técnico). Selección con identidad ofensiva. Grupo F con Países Bajos, Túnez y Suecia.`,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ team: string }> }
) {
  const { team } = await params;
  const teamCode = team.toUpperCase();
  const teamName = TEAM_NAMES[teamCode] || teamCode;
  const teamFacts = TEAM_FACTS[teamCode] || 'No hay ficha específica. Usá conocimiento general con extra prudencia sobre números y fechas.';

  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get('refresh') === 'true';

  if (!forceRefresh) {
    // redis ya expira por ttl (24h): si la clave existe, es válida
    const cached = await cacheGet<RoadToWorldCup>(`road:${teamCode}`);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'no api key configurada' });
  }

  const prompt = `Generá el "camino al Mundial 2026" para la selección de ${teamName} (código ${teamCode}).

Es para una plataforma personal en español rioplatense de Diego, argentino de Tostado. El tono es informado pero accesible, casi como un amigo contándole.

DATOS CLAVE QUE NO PODÉS CONTRADECIR EN NINGUNA PARTE DE TU RESPUESTA:
${teamFacts}

Devolvé SOLO un JSON válido (sin markdown, sin texto antes o después) con esta estructura exacta:

{
  "team": "${teamCode}",
  "teamName": "${teamName}",
  "headline": "Frase de una linea capturando la historia general de su clasificacion (max 80 chars)",
  "status": "clasificado" | "repechaje" | "en lucha" | "eliminado",
  "moments": [
    {
      "date": "fecha aproximada (mes y año)",
      "title": "titulo corto del momento (max 50 chars)",
      "narrative": "2-3 oraciones explicando que paso y por que importa",
      "tag": "decisivo" | "drama" | "hito" | "preocupacion"
    }
  ],
  "outlook": "1-2 oraciones sobre como llega ${teamName} al Mundial"
}

Reglas estrictas:
- 5-7 momentos en total, ordenados cronologicamente
- El campo "tag" SOLO puede tener uno de estos cuatro valores exactos: "decisivo", "drama", "hito", "preocupacion". Sin tilde en "preocupacion". Cualquier otro valor es INVÁLIDO.
- Criterios de tag:
  · "decisivo" → victorias clave, goles que cambiaron el rumbo, partidos bisagra de la clasificación
  · "drama" → derrotas dolorosas, lesiones graves, empates que duelen, eliminaciones
  · "hito" → títulos, récords, primera vez en X años, clasificación matemática
  · "preocupacion" → mal momento futbolístico, dudas con el DT, rachas negativas, lesiones de figuras
- Mezclá los tags, no uses todos del mismo tipo
- Respetá los DATOS CLAVE arriba: ese contador de títulos y esas fechas son no-negociables
- Si no estás 100% seguro de una fecha o resultado específico, mantenelo vago (ej. "fines de 2024" en vez de "octubre 2024")
- En el outlook, si la selección ya ganó el Mundial antes, usá los números correctos
- Si la selección no clasificó, status "eliminado"`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `claude HTTP ${res.status}: ${errText.slice(0, 200)}` });
    }

    const data = await res.json();
    const responseText: string = data.content[0].text.trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'no se pudo extraer json', preview: responseText.slice(0, 200) });
    }

    let road: RoadToWorldCup;
    try {
      road = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'json invalido', preview: jsonMatch[0].slice(0, 200) });
    }

    await cacheSet(`road:${teamCode}`, road, CACHE_TTL);

    return NextResponse.json({ ...road, cached: false });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' });
  }
}