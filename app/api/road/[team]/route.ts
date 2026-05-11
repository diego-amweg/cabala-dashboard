import { NextResponse } from 'next/server';

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

const cache = new Map<string, { data: RoadToWorldCup; cachedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const TEAM_NAMES: Record<string, string> = {
  ARG: 'Argentina',
  BRA: 'Brasil',
  MAR: 'Marruecos',
  JPN: 'Japón',
  MEX: 'México',
  ESP: 'España',
  FRA: 'Francia',
  ENG: 'Inglaterra',
};

const TEAM_FACTS: Record<string, string> = {
  ARG: `Argentina: TRICAMPEONA del Mundial (1978, 1986, 2022) — son TRES títulos, no dos. 16 Copas América (récord absoluto), bicampeona consecutiva en 2021 y 2024. DT actual: Lionel Scaloni. Capitán: Lionel Messi (con interrogantes físicos por edad). Vigente campeona del mundo y de Copa América. Clasificada para el Mundial 2026, selló matemáticamente la clasificación en marzo 2025 con triunfo 1-0 a Uruguay. La Copa América 2024 se jugó en EEUU entre junio y julio, final el 14 de julio.`,
  BRA: `Brasil: PENTACAMPEÓN del Mundial (1958, 1962, 1970, 1994, 2002), récord absoluto. 9 Copas América. Última copa del mundo: 2002. En el Mundial 2022 fue eliminado en cuartos por Croacia. Federación atravesó cambios de DT recientes. La clasificación para 2026 vino con turbulencias.`,
  FRA: `Francia: BICAMPEONA del Mundial (1998, 2018). Finalista en 2022 (perdió contra Argentina por penales). DT: Didier Deschamps (anunció que se va después del Mundial 2026). Capitán: Kylian Mbappé. Eliminatorias UEFA todavía en proceso.`,
  ESP: `España: CAMPEONA del Mundial UNA sola vez (2010). Campeona de la Eurocopa 2024. DT: Luis de la Fuente. Vive un excelente momento generacional con Yamal, Pedri, Rodri.`,
  ENG: `Inglaterra: CAMPEONA del Mundial UNA sola vez (1966, único título). Finalista de la Eurocopa 2024 (perdió contra España). DT recientemente cambió a Thomas Tuchel.`,
  MEX: `México: NUNCA ganó un Mundial. Mejor resultado: cuartos de final (1970, 1986). Es anfitrión del Mundial 2026 junto con EEUU y Canadá, por lo que clasifica directamente (sin eliminatorias). Tradición frustrada de eliminación en octavos.`,
  MAR: `Marruecos: NUNCA ganó un Mundial. Primera selección africana en llegar a semifinales (Mundial 2022, terminó 4to). Hito histórico para África y el mundo árabe. Generación de Hakimi, Ziyech, Bono.`,
  JPN: `Japón: NUNCA ganó un Mundial. Llega habitualmente a octavos. En el Mundial 2022 venció a Alemania y España en fase de grupos pero fue eliminado en octavos por Croacia por penales. Selección con identidad ofensiva.`,
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

  const cached = cache.get(teamCode);
  if (!forceRefresh && cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'no api key configurada' }, { status: 500 });
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
- Mezclá tags, no todos "decisivo"
- Respetá los DATOS CLAVE arriba: ese contador de títulos y esas fechas son no-negociables
- Si no estás 100% seguro de una fecha o resultado específico, mantenelo vago (ej. "fines de 2024" en vez de "octubre 2024")
- En el outlook, si la selección ya ganó el Mundial antes, usá los números correctos
- Si la selección no clasificó, status "eliminado"
- Los tags en JSON usan "preocupacion" sin tilde por compatibilidad`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `claude HTTP ${res.status}: ${errText.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    const responseText: string = data.content[0].text.trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'no se pudo extraer json', preview: responseText.slice(0, 200) }, { status: 500 });
    }

    let road: RoadToWorldCup;
    try {
      road = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'json invalido', preview: jsonMatch[0].slice(0, 200) }, { status: 500 });
    }

    cache.set(teamCode, { data: road, cachedAt: Date.now() });

    return NextResponse.json({ ...road, cached: false });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
