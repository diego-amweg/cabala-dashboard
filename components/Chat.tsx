'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  memes?: unknown[];
  tribe?: string[];
  activeMods?: string[];
}

interface ChatProps {
  context: ChatContext;
}

export default function Chat({ context }: ChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Algo salio mal: ${data.error || 'error desconocido'}` }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexion. Probá de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Abrir chat"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-[500px] w-[380px] max-w-[calc(100vw-3rem)] flex-col rounded-xl border border-stone-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-medium text-stone-900">Cábala asistente</h3>
          <p className="text-[10px] text-stone-500">preguntame lo que quieras</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          aria-label="Cerrar chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="text-xs text-stone-400">
            <p className="mb-2">Ejemplos de cosas que puedo hacer:</p>
            <ul className="space-y-1.5">
              <li>· resumime el feed</li>
              <li>· que dice apnews sobre Iran</li>
              <li>· cuales son los memes mas graciosos</li>
              <li>· explicame la polemica de Boston</li>
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`mb-3 ${m.role === 'user' ? 'flex justify-end' : ''}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-orange-100 text-orange-950'
                : 'bg-stone-100 text-stone-900'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-3">
            <div className="inline-block rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-500">
              <span className="inline-flex gap-1">
                <span className="h-1 w-1 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: '0ms' }} />
                <span className="h-1 w-1 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: '150ms' }} />
                <span className="h-1 w-1 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-stone-200 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="preguntá algo..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-xs leading-relaxed outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="rounded-md bg-orange-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-orange-600 disabled:bg-stone-300"
          >
            enviar
          </button>
        </div>
      </div>
    </div>
  );
}
