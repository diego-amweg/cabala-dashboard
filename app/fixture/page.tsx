import FixtureBracket from '@/components/FixtureBracket';
import GroupStage from '@/components/GroupStage';
import Link from 'next/link';

export default function FixturePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between border-b border-stone-200 pb-5">
          <div>
            <h1 className="text-2xl font-medium leading-tight tracking-tight sm:text-3xl">fixture mundial 2026</h1>
            <p className="mt-1 text-sm text-stone-500">104 partidos · 12 grupos + eliminatorias completas</p>
          </div>
          <Link href="/" className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 transition-colors hover:bg-stone-100">← volver a Cábala</Link>
        </header>

        <section className="mt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xs font-medium tracking-wide text-stone-700">fase de grupos · 72 partidos</h2>
            <span className="text-[10px] text-stone-400">12 grupos de 4 · pasan top 2 + 8 mejores 3ros</span>
          </div>
          <GroupStage />
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xs font-medium tracking-wide text-stone-700">eliminatorias · 32 partidos</h2>
            <span className="text-[10px] text-stone-400">desplazá ← → para ver el bracket completo</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white p-4 sm:p-6">
            <FixtureBracket />
          </div>
        </section>

        <div className="mt-6 space-y-1 rounded-md border border-stone-100 bg-stone-50 px-4 py-3 text-[11px] leading-relaxed text-stone-600">
          <p className="font-medium text-stone-700">cómo leer los slots</p>
          <p><span className="font-mono">1A</span> = ganador del grupo A · <span className="font-mono">2B</span> = subcampeón del grupo B · <span className="font-mono">3CDFGH</span> = uno de los 8 mejores 3ros, asignado a esta llave entre los grupos C/D/F/G/H</p>
          <p className="italic text-stone-400">fixture provisorio · sprint 5 conecta a api-football y rellena con equipos reales (los grupos quedaron sorteados el 5 dic 2025)</p>
        </div>
      </div>
    </main>
  );
}
