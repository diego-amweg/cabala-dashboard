interface Match {
  id: string;
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'final' | 'third';
  side: 'left' | 'right' | 'center';
  positionInRound: number;
  topTeam: string;
  bottomTeam: string;
  date: string;
  time: string;
}

const MATCHES: Match[] = [
  { id: 'L-R32-1', round: 'r32', side: 'left', positionInRound: 0, topTeam: '1E', bottomTeam: '3ABCDF', date: '29/06', time: '17:30' },
  { id: 'L-R32-2', round: 'r32', side: 'left', positionInRound: 1, topTeam: '1I', bottomTeam: '3CDFGH', date: '30/06', time: '18:00' },
  { id: 'L-R32-3', round: 'r32', side: 'left', positionInRound: 2, topTeam: '2A', bottomTeam: '2B', date: '28/06', time: '16:00' },
  { id: 'L-R32-4', round: 'r32', side: 'left', positionInRound: 3, topTeam: '1F', bottomTeam: '2C', date: '29/06', time: '22:00' },
  { id: 'L-R32-5', round: 'r32', side: 'left', positionInRound: 4, topTeam: '2K', bottomTeam: '2L', date: '02/07', time: '20:00' },
  { id: 'L-R32-6', round: 'r32', side: 'left', positionInRound: 5, topTeam: '1H', bottomTeam: '2J', date: '02/07', time: '16:00' },
  { id: 'L-R32-7', round: 'r32', side: 'left', positionInRound: 6, topTeam: '1D', bottomTeam: '3BEFIJ', date: '01/07', time: '21:00' },
  { id: 'L-R32-8', round: 'r32', side: 'left', positionInRound: 7, topTeam: '1G', bottomTeam: '3AEHIJ', date: '01/07', time: '17:00' },
  { id: 'L-R16-1', round: 'r16', side: 'left', positionInRound: 0, topTeam: 'ganador 1', bottomTeam: 'ganador 2', date: 'sáb 04/07', time: '18:00' },
  { id: 'L-R16-2', round: 'r16', side: 'left', positionInRound: 1, topTeam: 'ganador 3', bottomTeam: 'ganador 4', date: 'sáb 04/07', time: '14:00' },
  { id: 'L-R16-3', round: 'r16', side: 'left', positionInRound: 2, topTeam: 'ganador 5', bottomTeam: 'ganador 6', date: 'dom 05/07', time: '17:00' },
  { id: 'L-R16-4', round: 'r16', side: 'left', positionInRound: 3, topTeam: 'ganador 7', bottomTeam: 'ganador 8', date: 'dom 05/07', time: '21:00' },
  { id: 'L-QF-1', round: 'qf', side: 'left', positionInRound: 0, topTeam: 'gan. R16-1', bottomTeam: 'gan. R16-2', date: 'jue 09/07', time: '17:00' },
  { id: 'L-QF-2', round: 'qf', side: 'left', positionInRound: 1, topTeam: 'gan. R16-3', bottomTeam: 'gan. R16-4', date: 'vie 10/07', time: '16:00' },
  { id: 'L-SF', round: 'sf', side: 'left', positionInRound: 0, topTeam: 'gan. QF-1', bottomTeam: 'gan. QF-2', date: 'mar 14/07', time: '16:00' },
  { id: 'R-R32-1', round: 'r32', side: 'right', positionInRound: 0, topTeam: '1C', bottomTeam: '2F', date: '29/06', time: '14:00' },
  { id: 'R-R32-2', round: 'r32', side: 'right', positionInRound: 1, topTeam: '2E', bottomTeam: '2I', date: '30/06', time: '14:00' },
  { id: 'R-R32-3', round: 'r32', side: 'right', positionInRound: 2, topTeam: '1A', bottomTeam: '3CEFHI', date: '30/06', time: '22:00' },
  { id: 'R-R32-4', round: 'r32', side: 'right', positionInRound: 3, topTeam: '1L', bottomTeam: '3EHIJK', date: '01/07', time: '13:00' },
  { id: 'R-R32-5', round: 'r32', side: 'right', positionInRound: 4, topTeam: '1J', bottomTeam: '2H', date: '03/07', time: '19:00' },
  { id: 'R-R32-6', round: 'r32', side: 'right', positionInRound: 5, topTeam: '2D', bottomTeam: '2G', date: '03/07', time: '16:00' },
  { id: 'R-R32-7', round: 'r32', side: 'right', positionInRound: 6, topTeam: '1B', bottomTeam: '3EFGIJ', date: '02/07', time: '23:00' },
  { id: 'R-R32-8', round: 'r32', side: 'right', positionInRound: 7, topTeam: '1K', bottomTeam: '3DEIJL', date: '02/07', time: '22:30' },
  { id: 'R-R16-1', round: 'r16', side: 'right', positionInRound: 0, topTeam: 'ganador 1', bottomTeam: 'ganador 2', date: 'lun 06/07', time: '16:00' },
  { id: 'R-R16-2', round: 'r16', side: 'right', positionInRound: 1, topTeam: 'ganador 3', bottomTeam: 'ganador 4', date: 'lun 06/07', time: '21:00' },
  { id: 'R-R16-3', round: 'r16', side: 'right', positionInRound: 2, topTeam: 'ganador 5', bottomTeam: 'ganador 6', date: 'mar 07/07', time: '13:00' },
  { id: 'R-R16-4', round: 'r16', side: 'right', positionInRound: 3, topTeam: 'ganador 7', bottomTeam: 'ganador 8', date: 'mar 07/07', time: '16:00' },
  { id: 'R-QF-1', round: 'qf', side: 'right', positionInRound: 0, topTeam: 'gan. R16-1', bottomTeam: 'gan. R16-2', date: 'sáb 11/07', time: '18:00' },
  { id: 'R-QF-2', round: 'qf', side: 'right', positionInRound: 1, topTeam: 'gan. R16-3', bottomTeam: 'gan. R16-4', date: 'sáb 11/07', time: '22:00' },
  { id: 'R-SF', round: 'sf', side: 'right', positionInRound: 0, topTeam: 'gan. QF-1', bottomTeam: 'gan. QF-2', date: 'mié 15/07', time: '20:00' },
  { id: 'FINAL', round: 'final', side: 'center', positionInRound: 0, topTeam: 'gan. L-SF', bottomTeam: 'gan. R-SF', date: 'dom 19/07', time: '16:00' },
  { id: 'THIRD', round: 'third', side: 'center', positionInRound: 0, topTeam: 'perd. L-SF', bottomTeam: 'perd. R-SF', date: 'sáb 18/07', time: '18:00' },
];

const CONNECTIONS: { from: string; to: string }[] = [
  { from: 'L-R32-1', to: 'L-R16-1' }, { from: 'L-R32-2', to: 'L-R16-1' },
  { from: 'L-R32-3', to: 'L-R16-2' }, { from: 'L-R32-4', to: 'L-R16-2' },
  { from: 'L-R32-5', to: 'L-R16-3' }, { from: 'L-R32-6', to: 'L-R16-3' },
  { from: 'L-R32-7', to: 'L-R16-4' }, { from: 'L-R32-8', to: 'L-R16-4' },
  { from: 'L-R16-1', to: 'L-QF-1' }, { from: 'L-R16-2', to: 'L-QF-1' },
  { from: 'L-R16-3', to: 'L-QF-2' }, { from: 'L-R16-4', to: 'L-QF-2' },
  { from: 'L-QF-1', to: 'L-SF' }, { from: 'L-QF-2', to: 'L-SF' },
  { from: 'L-SF', to: 'FINAL' },
  { from: 'R-R32-1', to: 'R-R16-1' }, { from: 'R-R32-2', to: 'R-R16-1' },
  { from: 'R-R32-3', to: 'R-R16-2' }, { from: 'R-R32-4', to: 'R-R16-2' },
  { from: 'R-R32-5', to: 'R-R16-3' }, { from: 'R-R32-6', to: 'R-R16-3' },
  { from: 'R-R32-7', to: 'R-R16-4' }, { from: 'R-R32-8', to: 'R-R16-4' },
  { from: 'R-R16-1', to: 'R-QF-1' }, { from: 'R-R16-2', to: 'R-QF-1' },
  { from: 'R-R16-3', to: 'R-QF-2' }, { from: 'R-R16-4', to: 'R-QF-2' },
  { from: 'R-QF-1', to: 'R-SF' }, { from: 'R-QF-2', to: 'R-SF' },
  { from: 'R-SF', to: 'FINAL' },
];

const MATCH_WIDTH = 105;
const MATCH_HEIGHT = 42;
const SLOT_HEIGHT = 80;
const TOP_PADDING = 60;
const COL_GAP = 130;

const COL_X: Record<string, number> = {
  'left-r32': 0,
  'left-r16': COL_GAP,
  'left-qf': COL_GAP * 2,
  'left-sf': COL_GAP * 3,
  'center': COL_GAP * 4,
  'right-sf': COL_GAP * 5,
  'right-qf': COL_GAP * 6,
  'right-r16': COL_GAP * 7,
  'right-r32': COL_GAP * 8,
};

const SVG_WIDTH = COL_GAP * 8 + MATCH_WIDTH + 20;
const SVG_HEIGHT = TOP_PADDING * 2 + SLOT_HEIGHT * 8;

function getColKey(match: Match): string {
  if (match.round === 'final' || match.round === 'third') return 'center';
  return `${match.side}-${match.round}`;
}

function getMatchPosition(match: Match): { x: number; y: number } {
  const x = COL_X[getColKey(match)];
  let y: number;
  if (match.round === 'r32') {
    y = TOP_PADDING + match.positionInRound * SLOT_HEIGHT;
  } else if (match.round === 'r16') {
    y = TOP_PADDING + match.positionInRound * SLOT_HEIGHT * 2 + SLOT_HEIGHT / 2;
  } else if (match.round === 'qf') {
    y = TOP_PADDING + match.positionInRound * SLOT_HEIGHT * 4 + SLOT_HEIGHT * 1.5;
  } else if (match.round === 'sf') {
    y = TOP_PADDING + SLOT_HEIGHT * 3.5;
  } else if (match.round === 'final') {
    y = TOP_PADDING + SLOT_HEIGHT * 3;
  } else if (match.round === 'third') {
    y = TOP_PADDING + SLOT_HEIGHT * 5.5;
  } else {
    y = 0;
  }
  return { x, y };
}

function getOutPoint(match: Match): { x: number; y: number } {
  const pos = getMatchPosition(match);
  if (match.side === 'right') {
    return { x: pos.x, y: pos.y + MATCH_HEIGHT / 2 };
  }
  return { x: pos.x + MATCH_WIDTH, y: pos.y + MATCH_HEIGHT / 2 };
}

function getInPoint(match: Match, fromSide: string): { x: number; y: number } {
  const pos = getMatchPosition(match);
  if (match.side === 'right') {
    return { x: pos.x + MATCH_WIDTH, y: pos.y + MATCH_HEIGHT / 2 };
  }
  if (match.side === 'center' && fromSide === 'right') {
    return { x: pos.x + MATCH_WIDTH, y: pos.y + MATCH_HEIGHT / 2 };
  }
  return { x: pos.x, y: pos.y + MATCH_HEIGHT / 2 };
}

export default function FixtureBracket() {
  const matchMap = new Map(MATCHES.map(m => [m.id, m]));
  const columnHeaders: { x: number; label: string; highlight?: boolean }[] = [
    { x: 0, label: '16avos' },
    { x: COL_GAP, label: 'octavos' },
    { x: COL_GAP * 2, label: 'cuartos' },
    { x: COL_GAP * 3, label: 'semis' },
    { x: COL_GAP * 4, label: 'final', highlight: true },
    { x: COL_GAP * 5, label: 'semis' },
    { x: COL_GAP * 6, label: 'cuartos' },
    { x: COL_GAP * 7, label: 'octavos' },
    { x: COL_GAP * 8, label: '16avos' },
  ];

  return (
    <svg
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      style={{ minWidth: SVG_WIDTH }}
    >
      {columnHeaders.map((h, i) => (
        <text
          key={`hdr-${i}`}
          x={h.x + MATCH_WIDTH / 2}
          y={25}
          textAnchor="middle"
          fontSize={11}
          fontWeight={h.highlight ? 700 : 600}
          fill={h.highlight ? '#9a3412' : '#57534e'}
          letterSpacing="0.05em"
        >
          {h.label}
        </text>
      ))}

      {CONNECTIONS.map((c, i) => {
        const from = matchMap.get(c.from)!;
        const to = matchMap.get(c.to)!;
        const fromPt = getOutPoint(from);
        const toPt = getInPoint(to, from.side);
        const midX = (fromPt.x + toPt.x) / 2;
        return (
          <path
            key={`conn-${i}`}
            d={`M ${fromPt.x} ${fromPt.y} H ${midX} V ${toPt.y} H ${toPt.x}`}
            stroke="#d6d3d1"
            strokeWidth={1}
            fill="none"
          />
        );
      })}

      {MATCHES.map(match => {
        const { x, y } = getMatchPosition(match);
        const isFinal = match.round === 'final';
        const isThird = match.round === 'third';
        const boxColor = isFinal ? '#fff7ed' : '#ffffff';
        const borderColor = isFinal ? '#fdba74' : '#e7e5e4';
        return (
          <g key={match.id} transform={`translate(${x}, ${y})`}>
            <rect x={0} y={0} width={MATCH_WIDTH} height={MATCH_HEIGHT} fill={boxColor} stroke={borderColor} strokeWidth={1} rx={3} />
            <line x1={3} y1={MATCH_HEIGHT / 2} x2={MATCH_WIDTH - 3} y2={MATCH_HEIGHT / 2} stroke={borderColor} />
            <text x={MATCH_WIDTH / 2} y={MATCH_HEIGHT / 4 + 4} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#44403c">{match.topTeam}</text>
            <text x={MATCH_WIDTH / 2} y={3 * MATCH_HEIGHT / 4 + 3} textAnchor="middle" fontSize={9} fontFamily="monospace" fill="#44403c">{match.bottomTeam}</text>
            <text x={MATCH_WIDTH / 2} y={MATCH_HEIGHT + 11} textAnchor="middle" fontSize={8} fill="#a8a29e">{match.date} · {match.time}</text>
            {isFinal && <text x={MATCH_WIDTH / 2} y={-6} textAnchor="middle" fontSize={9} fontWeight={700} fill="#9a3412" letterSpacing="0.1em">FINAL</text>}
            {isThird && <text x={MATCH_WIDTH / 2} y={-6} textAnchor="middle" fontSize={9} fontWeight={600} fill="#78716c" letterSpacing="0.1em">3° puesto</text>}
          </g>
        );
      })}
    </svg>
  );
}
