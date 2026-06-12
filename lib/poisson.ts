// lib/poisson.ts
// modelo de goles: convierte ventaja Elo en goles esperados (lambda) y de ahí en
// probabilidades de resultado. dos usos:
//  - matchProbabilities: probabilidades exactas de un partido (local/empate/visitante)
//    con corrección Dixon-Coles para marcadores bajos. lo usa la vista "partido por partido".
//  - sampleScore: muestreo rápido de un marcador para el Monte Carlo (sin DC; en agregados
//    no cambia quién avanza y permite correr 50k simulaciones en segundos).

export const BASE_GOALS = 1.3;
export const ELO_TO_GOALS = 0.0017;
export const DC_RHO = -0.05;

const MAX_GOALS = 8;
// 0!..8! precomputados (constantes; evita recalcular factorial millones de veces)
const FACTORIAL = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];

export function expectedGoals(eloFor: number, eloAgainst: number): number {
  const lambda = BASE_GOALS * Math.exp(ELO_TO_GOALS * (eloFor - eloAgainst));
  return Math.max(0.15, lambda);
}

function poissonPmf(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / FACTORIAL[k];
}

function dixonColesTau(homeGoals: number, awayGoals: number, lambdaHome: number, lambdaAway: number, rho: number): number {
  if (homeGoals === 0 && awayGoals === 0) return 1 - lambdaHome * lambdaAway * rho;
  if (homeGoals === 0 && awayGoals === 1) return 1 + lambdaHome * rho;
  if (homeGoals === 1 && awayGoals === 0) return 1 + lambdaAway * rho;
  if (homeGoals === 1 && awayGoals === 1) return 1 - rho;
  return 1;
}

export interface MatchProbs {
  pHome: number;
  pDraw: number;
  pAway: number;
  topScore: { home: number; away: number };
}

// probabilidades exactas de un partido, con Dixon-Coles. grilla 9x9 ponderada y normalizada.
// se usa donde se muestra la probabilidad de empate como número (vista partido por partido).
export function matchProbabilities(eloHome: number, eloAway: number): MatchProbs {
  const lH = expectedGoals(eloHome, eloAway);
  const lA = expectedGoals(eloAway, eloHome);

  let pHome = 0;
  let pDraw = 0;
  let pAway = 0;
  let maxProb = -1;
  let topScore = { home: 0, away: 0 };

  const grid: number[][] = [];
  let totalProb = 0;

  for (let h = 0; h <= MAX_GOALS; h++) {
    grid[h] = [];
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = poissonPmf(h, lH) * poissonPmf(a, lA) * dixonColesTau(h, a, lH, lA, DC_RHO);
      const val = Math.max(0, p);
      grid[h][a] = val;
      totalProb += val;
    }
  }

  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      const normP = grid[h][a] / totalProb;
      if (normP > maxProb) {
        maxProb = normP;
        topScore = { home: h, away: a };
      }
      if (h > a) pHome += normP;
      else if (h === a) pDraw += normP;
      else pAway += normP;
    }
  }

  return { pHome, pDraw, pAway, topScore };
}

// --- muestreo rápido para el Monte Carlo ---
// la curva Poisson P(0)..P(8) de un lambda dado es siempre la misma; la cacheamos como CDF
// (acumulada) por lambda redondeado, así samplear es un único recorrido de 9 posiciones.
// los goles de local y visitante son Poisson independientes: se samplean por separado
// (dos sorteos de 9) en vez de recorrer una grilla de 81 celdas.

const cdfCache = new Map<number, number[]>();

function poissonCdf(lambda: number): number[] {
  const pmf = new Array<number>(MAX_GOALS + 1);
  const eNeg = Math.exp(-lambda);
  let lambdaPow = 1; // lambda^k
  for (let k = 0; k <= MAX_GOALS; k++) {
    pmf[k] = (lambdaPow * eNeg) / FACTORIAL[k];
    lambdaPow *= lambda;
  }
  let sum = 0;
  for (let k = 0; k <= MAX_GOALS; k++) sum += pmf[k];
  const cdf = new Array<number>(MAX_GOALS + 1);
  let acc = 0;
  for (let k = 0; k <= MAX_GOALS; k++) {
    acc += pmf[k] / sum; // normaliza repartiendo la cola > 8
    cdf[k] = acc;
  }
  return cdf;
}

function getCdf(lambda: number): number[] {
  const key = Math.round(lambda * 1000);
  let cdf = cdfCache.get(key);
  if (!cdf) {
    cdf = poissonCdf(lambda);
    cdfCache.set(key, cdf);
  }
  return cdf;
}

function sampleFromCdf(cdf: number[], r: number): number {
  for (let k = 0; k <= MAX_GOALS; k++) {
    if (r <= cdf[k]) return k;
  }
  return MAX_GOALS;
}

// muestrea un marcador concreto a partir de los Elos efectivos. rng se recibe como parámetro
// (nunca Math.random adentro) para que el Monte Carlo sea reproducible.
export function sampleScore(eloHome: number, eloAway: number, rng: () => number): { home: number; away: number } {
  const lH = expectedGoals(eloHome, eloAway);
  const lA = expectedGoals(eloAway, eloHome);
  const home = sampleFromCdf(getCdf(lH), rng());
  const away = sampleFromCdf(getCdf(lA), rng());
  return { home, away };
}