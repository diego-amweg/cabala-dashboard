import FixtureBracket from '@/components/FixtureBracket';
import Link from 'next/link';

export default function FixturePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between border-b border-stone-200 pb-5">
          <div>
            <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl">fixture mundial 2026</h1>
            <p className="mt-1 text-sm text-stone-500">eliminatorias completas · de 32avos a la final</p>
          </div>
          <Link href="/" className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 transition-colors hover:bg-stone-100">
            ← volver a Cábala
          </Link>
        </header>

        <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white p-4 sm:p-6">
          <FixtureBracket />
        </div>

        <div className="mt-4 space-y-1 rounded-md border border-stone-100 bg-stone-50 px-4 py-3 text-[11px] leading-relaxed text-stone-600">
          <p className="font-medium text-stone-700">cómo leer los slots</p>
          <p><span className="font-mono">1A</span> = ganador del grupo A · <span className="font-mono">2B</span> = subcampeón del grupo B · <span className="font-mono">3CDFGH</span> = uno de los 8 mejores 3ros, asignado a esta llave entre los grupos C/D/F/G/H</p>
          <p className="italic text-stone-400">fixture provisorio · sprint 5 lo conecta a api-football y se rellena con equipos reales al cierre de la fase de grupos</p>
        </div>
      </div>
    </main>
  );
}
