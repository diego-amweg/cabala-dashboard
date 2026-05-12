import { NextRequest, NextResponse } from 'next/server';

interface StadiumMeta {
  wiki: string;
  name: string;
  city: string;
  capacity: number;
  opened: number;
  description: string;
}

const STADIUM_MAP: Record<string, StadiumMeta> = {
  van: {
    wiki: 'BC_Place',
    name: 'BC Place',
    city: 'Vancouver',
    capacity: 54500,
    opened: 1983,
    description: 'Estadio multiusos con techo retráctil, inaugurado en 1983. Sede de la final del Mundial de Rugby 2015 y de las ceremonias de los Juegos Olímpicos de Invierno 2010. Durante el Mundial 2026 se ajustó la capacidad para optimizar la visibilidad del campo de fútbol.',
  },
  sea: {
    wiki: 'Lumen_Field',
    name: 'Lumen Field',
    city: 'Seattle',
    capacity: 68740,
    opened: 2002,
    description: 'Casa del Seattle Seahawks (NFL) y del Seattle Sounders FC (MLS). Famoso por el ruido de su público: su diseño con techos angulares amplifica el sonido y ha registrado uno de los récords de ruido en estadios al aire libre del mundo.',
  },
  sf: {
    wiki: "Levi's_Stadium",
    name: "Levi's Stadium",
    city: 'Santa Clara · Bay Area',
    capacity: 68500,
    opened: 2014,
    description: 'Casa del San Francisco 49ers desde 2014. Reconocido por su sustentabilidad: paneles solares en el techo, certificación LEED Gold y reciclaje del 85% de los residuos de cada partido. Sede del Super Bowl 50 en 2016.',
  },
  la: {
    wiki: 'SoFi_Stadium',
    name: 'SoFi Stadium',
    city: 'Inglewood · Los Ángeles',
    capacity: 70240,
    opened: 2020,
    description: 'Estadio compartido por Los Angeles Rams y Los Angeles Chargers de la NFL. Su techo translúcido y la pantalla de video circular "Infinity Screen" de 6.500 metros cuadrados son únicas en el mundo. Sede del Super Bowl LVI en 2022.',
  },
  kc: {
    wiki: 'Arrowhead_Stadium',
    name: 'GEHA Field at Arrowhead Stadium',
    city: 'Kansas City',
    capacity: 76416,
    opened: 1972,
    description: 'Casa del Kansas City Chiefs de la NFL desde 1972. Conocido como uno de los estadios más ruidosos del mundo: en 2014 estableció el récord Guinness de ruido en un estadio al aire libre con 142,2 decibeles.',
  },
  dal: {
    wiki: 'AT%26T_Stadium',
    name: 'AT&T Stadium',
    city: 'Arlington · Dallas',
    capacity: 80000,
    opened: 2009,
    description: 'Casa del Dallas Cowboys, inaugurado en 2009. Techo retráctil y, en su momento, la pantalla de video colgante más grande del mundo. Capacidad expandible hasta 105.000 espectadores con tribunas suplementarias. Apodado "Jerry World" por el dueño Jerry Jones.',
  },
  hou: {
    wiki: 'NRG_Stadium',
    name: 'NRG Stadium',
    city: 'Houston',
    capacity: 72220,
    opened: 2002,
    description: 'Inaugurado en 2002 para los Houston Texans de la NFL. Primer estadio de la NFL en tener techo retráctil. Sede de dos Super Bowls (XXXVIII en 2004 y LI en 2017) y del rodeo más grande del mundo, el Houston Livestock Show.',
  },
  atl: {
    wiki: 'Mercedes-Benz_Stadium',
    name: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    capacity: 71000,
    opened: 2017,
    description: 'Inaugurado en 2017, alberga al Atlanta Falcons (NFL) y al Atlanta United (MLS). Su techo retráctil de ocho pétalos se abre como el obturador de una cámara fotográfica. Primer estadio de la NFL en obtener la certificación LEED Platinum.',
  },
  mia: {
    wiki: 'Hard_Rock_Stadium',
    name: 'Hard Rock Stadium',
    city: 'Miami Gardens',
    capacity: 64767,
    opened: 1987,
    description: 'Casa del Miami Dolphins desde 1987 y sede del Open de Tenis de Miami. Renovado totalmente en 2016 con un techo independiente que cubre las tribunas. Ha sido sede de seis Super Bowls, más que cualquier otro estadio.',
  },
  phi: {
    wiki: 'Lincoln_Financial_Field',
    name: 'Lincoln Financial Field',
    city: 'Filadelfia',
    capacity: 67594,
    opened: 2003,
    description: 'Casa del Philadelphia Eagles desde 2003. Conocido por su sistema de paneles solares y aerogeneradores que generan parte de su electricidad. Sede habitual del clásico Army-Navy de fútbol americano universitario.',
  },
  nyc: {
    wiki: 'MetLife_Stadium',
    name: 'MetLife Stadium',
    city: 'East Rutherford · NY/NJ',
    capacity: 82500,
    opened: 2010,
    description: 'Inaugurado en 2010, hogar compartido del New York Giants y del New York Jets de la NFL. Sistema de iluminación LED externa que cambia de color según el equipo local. Sede del Super Bowl XLVIII en 2014 y de la final del Mundial 2026.',
  },
  bos: {
    wiki: 'Gillette_Stadium',
    name: 'Gillette Stadium',
    city: 'Foxborough · Boston',
    capacity: 65878,
    opened: 2002,
    description: 'Casa del New England Patriots desde 2002 y del New England Revolution (MLS). Famoso por la torre con luces estilo faro en la entrada y por la dinastía Belichick-Brady, una de las más exitosas en la historia de la NFL.',
  },
  tor: {
    wiki: 'BMO_Field',
    name: 'BMO Field',
    city: 'Toronto',
    capacity: 30000,
    opened: 2007,
    description: 'Estadio multiusos del Toronto FC (MLS) y de los Toronto Argonauts (CFL). Inaugurado en 2007 como primer estadio canadiense específico para fútbol. En expansión para el Mundial 2026 con tribunas temporarias para aumentar su capacidad.',
  },
  mty: {
    wiki: 'Estadio_BBVA',
    name: 'Estadio BBVA',
    city: 'Guadalupe · Monterrey',
    capacity: 53500,
    opened: 2015,
    description: 'Conocido como "El Gigante de Acero", es la casa del C.F. Monterrey desde 2015. Su diseño contemporáneo lo posicionó entre los estadios más bellos del mundo en su categoría según rankings internacionales. Construido al pie del Cerro de la Silla.',
  },
  gdl: {
    wiki: 'Estadio_Akron',
    name: 'Estadio Akron',
    city: 'Zapopan · Guadalajara',
    capacity: 49850,
    opened: 2010,
    description: 'Casa de las Chivas de Guadalajara desde 2010. Diseñado por el arquitecto italiano Massimo Majowiecki con un techo cubierto de vegetación que se integra al paisaje. Considerado uno de los estadios más sustentables de Latinoamérica.',
  },
  cdmx: {
    wiki: 'Estadio_Azteca',
    name: 'Estadio Azteca',
    city: 'CDMX',
    capacity: 83264,
    opened: 1966,
    description: 'El estadio más icónico del fútbol mundial. Inaugurado en 1966, es el único que ha albergado dos finales de Copa Mundial (1970 y 1986). Con el Mundial 2026 se convertirá en el primer estadio en albergar tres mundiales. Casa del Club América y de la selección mexicana.',
  },
};

interface WikiSummary {
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
    description: stadium.description,
    imageUrl: null as string | null,
    wikiUrl: `https://en.wikipedia.org/wiki/${stadium.wiki}`,
  };

  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${stadium.wiki}`,
      {
        headers: { Accept: 'application/json', 'User-Agent': 'cabala-dashboard/1.0' },
        next: { revalidate: 604800 },
      }
    );

    if (!wikiRes.ok) return NextResponse.json(fallback);

    const data: WikiSummary = await wikiRes.json();

    return NextResponse.json({
      name: stadium.name,
      city: stadium.city,
      capacity: stadium.capacity,
      opened: stadium.opened,
      description: stadium.description,
      imageUrl: data.originalimage?.source ?? data.thumbnail?.source ?? null,
      wikiUrl: data.content_urls?.desktop?.page ?? fallback.wikiUrl,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
