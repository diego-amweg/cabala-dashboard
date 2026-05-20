import { NextResponse } from 'next/server';

interface ImmersiveOption {
  id: string;
  service: string;
  category: 'streaming' | 'social' | 'vr' | 'xr' | 'dome';
  accessibility: 'today' | 'with-gear';
  device: string;
  description: string;
  url: string;
  cost: string;
  coverImage: string;
}

const OPTIONS: ImmersiveOption[] = [
  {
    id: 'watch-party-irl',
    service: 'Watch party presencial',
    category: 'social',
    accessibility: 'today',
    device: 'pantalla grande + amigos',
    description: 'La opción más inmersiva sin dispositivos: armar fiesta de viewing con amigos en una casa. Pantalla grande, mate, asado, gritos colectivos. Sigue siendo la mejor forma de vivir un Mundial.',
    url: '',
    cost: 'lo que pongas en la comida',
    coverImage: '/immersive/watch-party-irl.jpg',
  },
  {
    id: 'fifa-plus',
    service: 'FIFA+',
    category: 'streaming',
    accessibility: 'today',
    device: 'web, iOS, Android, smart TV',
    description: 'Plataforma oficial de FIFA con transmisiones, multi-angle, estadísticas en vivo y archivos históricos. Disponible globalmente con cuenta gratuita.',
    url: 'https://www.fifa.com/fifaplus',
    cost: 'gratis con cuenta',
    coverImage: '/immersive/fifa-plus.jpg',
  },
  {
    id: 'twitch-cosrteams',
    service: 'Twitch Co-streams',
    category: 'social',
    accessibility: 'today',
    device: 'cualquier dispositivo',
    description: 'Mirar el partido junto a streamers que reaccionan y comentan en vivo. Comunidades hispanas muy activas durante torneos grandes (Davoo Xeneize, Coscu, etc.).',
    url: 'https://www.twitch.tv/directory/category/just-chatting',
    cost: 'gratis',
    coverImage: '/immersive/twitch-cosrteams.jpg',
  },
  {
    id: 'youtube-vr',
    service: 'YouTube VR / 360°',
    category: 'vr',
    accessibility: 'today',
    device: 'celular + Cardboard, Meta Quest',
    description: 'Videos 360° de eventos pre y post partido, recorridos de estadios, ambientación de hinchadas. Funciona con cualquier celular usando Google Cardboard.',
    url: 'https://vr.youtube.com/',
    cost: 'gratis',
    coverImage: '/immersive/youtube-vr.jpg',
  },
  {
    id: 'bigscreen',
    service: 'Bigscreen Beta',
    category: 'vr',
    accessibility: 'with-gear',
    device: 'Meta Quest, PSVR2, PC VR',
    description: 'Salas virtuales privadas para ver contenido con amigos en VR. Soporta sharing de pantalla y streamings deportivos.',
    url: 'https://www.bigscreenvr.com/',
    cost: 'gratis, requiere VR',
    coverImage: '/immersive/bigscreen.jpg',
  },
  {
    id: 'apple-vision-pro',
    service: 'Apple Vision Pro Sports',
    category: 'xr',
    accessibility: 'with-gear',
    device: 'Apple Vision Pro',
    description: 'Apple expandió su oferta de deportes inmersivos durante 2025. Cobertura del Mundial 2026 en negociación con FIFA. Multi-cam y stats con manos.',
    url: 'https://www.apple.com/apple-vision-pro/',
    cost: 'requiere dispositivo USD 3499',
    coverImage: '/immersive/apple-vision-pro.jpg',
  },
];

interface CacheEntry { recommendation: string; cachedAt: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000;

async function generateRecommendation(match: string, apiKey: string): Promise<{ text: string; error?: string }> {
  const prompt = `Sos el asistente de Cábala, plataforma personal para vivir el Mundial 2026 desde casa. Hablás con Diego, argentino de Tostado, Santa Fe. Diego NO tiene casco VR ni Apple Vision Pro. Mira el partido desde su casa.

Partido actual: "${match}"

Opciones disponibles para experiencia inmersiva:
${OPTIONS.map(o => `- ${o.service} (${o.device}, ${o.cost}): ${o.description}`).join('\n')}

Generá una recomendación de 2-3 oraciones en español rioplatense sobre cómo Diego puede vivir este partido de la forma más inmersiva posible CON LO QUE YA TIENE. NO le sugieras comprar dispositivos. Priorizá: watch party presencial, FIFA+, Twitch co-streams. Si el partido parece importante (final, semifinal, partido de Argentina), enfatizá la dimensión colectiva. Si parece secundario, sugerí algo más casual.

Devolvé SOLO el texto de la recomendación, sin preámbulo, sin markdown, sin comillas.`;

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
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { text: '', error: `claude HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json();
    const text: string = data.content[0].text.trim();
    return { text };
  } catch (e) {
    return { text: '', error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const match = url.searchParams.get('match') || 'partido en curso';
  const forceRefresh = url.searchParams.get('refresh') === 'true';

  const cacheKey = match;
  const cached = cache.get(cacheKey);
  if (!forceRefresh && cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return NextResponse.json({
      recommendation: cached.recommendation,
      options: OPTIONS,
      cached: true,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      recommendation: '',
      options: OPTIONS,
      error: 'env var ANTHROPIC_API_KEY faltante',
    });
  }

  const { text, error } = await generateRecommendation(match, apiKey);

  if (text) {
    cache.set(cacheKey, { recommendation: text, cachedAt: Date.now() });
  }

  return NextResponse.json({
    recommendation: text,
    options: OPTIONS,
    cached: false,
    error,
  });
}