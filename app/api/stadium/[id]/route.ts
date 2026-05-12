import { NextRequest, NextResponse } from 'next/server';

interface StadiumMeta {
  wiki: string;
  name: string;
  city: string;
  capacity: number;
  opened: number;
}

const STADIUM_MAP: Record<string, StadiumMeta> = {
  van:  { wiki: 'BC_Place',                name: 'BC Place',                          city: 'Vancouver',                  capacity: 54500, opened: 1983 },
  sea:  { wiki: 'Lumen_Field',             name: 'Lumen Field',                       city: 'Seattle',                    capacity: 68740, opened: 2002 },
  sf:   { wiki: "Levi's_Stadium",          name: "Levi's Stadium",                    city: 'Santa Clara · Bay Area',     capacity: 68500, opened: 2014 },
  la:   { wiki: 'SoFi_Stadium',            name: 'SoFi Stadium',                      city: 'Inglewood · Los Ángeles',    capacity: 70240, opened: 2020 },
  kc:   { wiki: 'Arrowhead_Stadium',       name: 'GEHA Field at Arrowhead Stadium',   city: 'Kansas City',                capacity: 76416, opened: 1972 },
  dal:  { wiki: 'AT%26T_Stadium',          name: 'AT&T Stadium',                      city: 'Arlington · Dallas',         capacity: 80000, opened: 2009 },
  hou:  { wiki: 'NRG_Stadium',             name: 'NRG Stadium',                       city: 'Houston',                    capacity: 72220, opened: 2002 },
  atl:  { wiki: 'Mercedes-Benz_Stadium',   name: 'Mercedes-Benz Stadium',             city: 'Atlanta',                    capacity: 71000, opened: 2017 },
  mia:  { wiki: 'Hard_Rock_Stadium',       name: 'Hard Rock Stadium',                 city: 'Miami Gardens',              capacity: 64767, opened: 1987 },
  phi:  { wiki: 'Lincoln_Financial_Field', name: 'Lincoln Financial Field',           city: 'Filadelfia',                 capacity: 67594, opened: 2003 },
  nyc:  { wiki: 'MetLife_Stadium',         name: 'MetLife Stadium',                   city: 'East Rutherford · NY/NJ',    capacity: 82500, opened: 2010 },
  bos:  { wiki: 'Gillette_Stadium',        name: 'Gillette Stadium',                  city: 'Foxborough · Boston',        capacity: 65878, opened: 2002 },
  tor:  { wiki: 'BMO_Field',               name: 'BMO Field',                         city: 'Toronto',                    capacity: 30000, opened: 2007 },
  mty:  { wiki: 'Estadio_BBVA',            name: 'Estadio BBVA',                      city: 'Guadalupe · Monterrey',      capacity: 53500, opened: 2015 },
  gdl:  { wiki: 'Estadio_Akron',           name: 'Estadio Akron',                     city: 'Zapopan · Guadalajara',      capacity: 49850, opened: 2010 },
  cdmx: { wiki: 'Estadio_Azteca',          name: 'Estadio Azteca',                    city: 'CDMX',                       capacity: 83264, opened: 1966 },
};

interface WikiSummary {
  extract?: string;
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
  content_urls?: { desktop?: { page?: string } };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stadium = STADIUM_MAP[id];

  if (!stadium) {
    return NextResponse.json({ error: 'stadium not found' }, { status: 404 });
  }

  const fallback = {
    name: stadium.name,
    city: stadium.city,
    capacity: stadium.capacity,
    opened: stadium.opened,
    description: null as string | null,
    imageUrl: null as string | null,
    wikiUrl: `https://en.wikipedia.org/wiki/${stadium.wiki}`,
  };

  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${stadium.wiki}`,
      {
        headers: { Accept: 'application/json', 'User-Agent': 'cabala-dashboard/1.0' },
        next: { revalidate: 86400 },
      }
    );

    if (!wikiRes.ok) return NextResponse.json(fallback);

    const data: WikiSummary = await wikiRes.json();

    return NextResponse.json({
      name: stadium.name,
      city: stadium.city,
      capacity: stadium.capacity,
      opened: stadium.opened,
      description: data.extract ?? null,
      imageUrl: data.originalimage?.source ?? data.thumbnail?.source ?? null,
      wikiUrl: data.content_urls?.desktop?.page ?? fallback.wikiUrl,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
