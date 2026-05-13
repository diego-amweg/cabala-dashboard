const SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-4 w-6',
  md: 'h-6 w-9',
  lg: 'h-12 w-16',
};

const ISO_MAP: Record<string, string> = {
  ARG: 'ar',
  BRA: 'br',
  MAR: 'ma',
  JPN: 'jp',
  MEX: 'mx',
  ESP: 'es',
  FRA: 'fr',
  ENG: 'gb-eng',
};

interface Props {
  code: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function TeamBadge({ code, size = 'sm' }: Props) {
  const iso = ISO_MAP[code];
  if (!iso) {
    return <div className={`${SIZES[size]} rounded bg-stone-100`} aria-hidden="true" />;
  }
  return (
    <img
      src={`https://flagcdn.com/w160/${iso}.png`}
      alt={code}
      className={`${SIZES[size]} rounded object-cover`}
      loading="lazy"
    />
  );
}
