import { NextResponse } from 'next/server';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ContextData {
  memes?: unknown[];
  tribe?: string[];
  activeMods?: string[];
}

interface ChatRequest {
  messages: Message[];
  context?: ContextData;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'no api key configurada en vercel' }, { status: 500 });
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'json invalido' }, { status: 400 });
  }

  const { messages, context } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages requeridos' }, { status: 400 });
  }

  const ctxText = context ? `

Estado actual del dashboard de Diego:
- Tribu seleccionada: ${context.tribe?.join(', ') || 'ninguna'}
- Modulos activos: ${context.activeMods?.join(', ') || 'todos'}
- Posts del feed (top 5):
${JSON.stringify(context.memes?.slice(0, 5) || [], null, 2)}` : '';

  const systemPrompt = `Sos el asistente de Cabala, una plataforma personal para vivir el Mundial 2026 desde casa. Hablas con Diego, un argentino de Tostado, Santa Fe, no fanatico del futbol pero que quiere vivir el torneo intensamente.

Personalidad:
- Espanol rioplatense, tono cercano y util
- Conciso por defecto, mas extenso solo si Diego pide profundidad
- Honesto: si no sabes algo, decilo
- Sin emojis salvo que Diego los use primero
- Sin sobrelagamentos, directo

Podes ayudar con:
- Resumir lo que esta pasando en el feed
- Explicar el contexto de un post o evento
- Sugerir que mirar o leer
- Responder sobre el Mundial, selecciones, ciudades sede

Limitaciones que tenes que admitir si surgen:
- No podes modificar el dashboard directamente todavia
- No podes buscar info en internet en este momento
- Solo ves los datos del contexto que sigue${ctxText}`;

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
        max_tokens: 1500,
        system: systemPrompt,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `claude HTTP ${res.status}: ${errText.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.content[0].text;

    return NextResponse.json({ message: { role: 'assistant', content: text } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 });
  }
}
