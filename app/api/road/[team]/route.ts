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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ team: string }> }
) {
  const { team } = await params;
  const teamCode = team.toUpperCase();
  const teamName = TEAM_NAMES[teamCode] || teamCode;

  const cached = cache.get(teamCode);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'no api key configurada' }, { status: 500 });
  }

  const prompt = `Generá el "camino al Mundial 2026" para la selección de ${teamName} (código ${teamCode}).

Es para una plataforma personal en español rioplatense de Diego, argentino de Tostado. El tono es informado pero accesible, casi como un amigo contándole.

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

Reglas:
- 5-7 momentos en total, ordenados cronologicamente
- Mezclá tags, no todos "decisivo"
- Si no clasificó, status "eliminado" y outlook sobre el fracaso
- Usá tu conocimiento real sobre las eliminatorias rumbo al Mundial 2026
- Si tenés dudas sobre un hecho específico, mejor general que inventar
- Lenguaje rioplatense pero sin slang excesivo
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
