export interface TeamElo {
  name: string;
  elo: number;
}

export const ELO_INITIAL: Record<string, number> = {
  'México': 1881, 'Sudáfrica': 1511, 'Corea del Sur': 1786, 'República Checa': 1712, 'Canadá': 1788, 'Bosnia y Herzegovina': 1595, 'Estados Unidos': 1726, 'Paraguay': 1834, 'Catar': 1421, 'Suiza': 1891, 'Brasil': 1991, 'Marruecos': 1827, 'Haití': 1548, 'Escocia': 1782, 'Australia': 1777, 'Turquía': 1911, 'Alemania': 1932, 'Curazao': 1434, 'Países Bajos': 1948, 'Japón': 1906, 'Costa de Marfil': 1695, 'Ecuador': 1938, 'Suecia': 1712, 'Túnez': 1628, 'España': 2157, 'Cabo Verde': 1578, 'Bélgica': 1894, 'Egipto': 1696, 'Arabia Saudita': 1576, 'Uruguay': 1892, 'Irán': 1772, 'Nueva Zelanda': 1562, 'Francia': 2063, 'Senegal': 1860, 'Irak': 1607, 'Noruega': 1914, 'Argentina': 2115, 'Argelia': 1772, 'Austria': 1830, 'Jordania': 1680, 'Portugal': 1989, 'RD del Congo': 1652, 'Inglaterra': 2024, 'Croacia': 1912, 'Ghana': 1510, 'Panamá': 1730, 'Uzbekistán': 1714, 'Colombia': 1982
};

export const HOST_TEAMS = ['México', 'Estados Unidos', 'Canadá'] as const;
export const HOST_ADVANTAGE = 65;
export const ELO_K = 40;

export function getInitialElo(team: string): number {
  return ELO_INITIAL[team] ?? 1500;
}

export function expectedScore(eloA: number, eloB: number): number {
  return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
}

export function updateElo(eloWinner: number, eloLoser: number, draw: boolean): { winner: number; loser: number } {
  const sWinner = draw ? 0.5 : 1;
  const sLoser = draw ? 0.5 : 0;

  const eWinner = expectedScore(eloWinner, eloLoser);
  const eLoser = expectedScore(eloLoser, eloWinner);

  const newWinner = Math.round(eloWinner + ELO_K * (sWinner - eWinner));
  const newLoser = Math.round(eloLoser + ELO_K * (sLoser - eLoser));

  return { winner: newWinner, loser: newLoser };
}

export function eloWithHost(team: string, elo: number): number {
  if ((HOST_TEAMS as readonly string[]).includes(team)) {
    return elo + HOST_ADVANTAGE;
  }
  return elo;
}
