const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;

export default function GroupStage() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {GROUP_LETTERS.map(letter => (
        <div key={letter} className="rounded-md border border-stone-200 bg-white p-3">
          <div className="mb-2 flex items-baseline justify-between border-b border-stone-100 pb-1.5">
            <span className="text-xs font-semibold tracking-wider text-stone-900">GRUPO {letter}</span>
            <span className="text-[9px] text-stone-400">6 partidos</span>
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4].map(pos => (
              <div key={pos} className="flex items-center gap-2 text-[11px]">
                <span className="w-6 font-mono text-stone-400">{pos}{letter}</span>
                <span className="flex-1 text-stone-300">por definir</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
