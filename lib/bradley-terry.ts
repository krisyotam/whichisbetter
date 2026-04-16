export interface Item {
  id: string;
  name: string;
  imageUrl?: string;
  rating: number;
  comparisons: number;
  wins: number;
  meta: Record<string, string | number | boolean>;
}

export interface Comparison {
  id: string;
  winnerId: string;
  loserId: string;
  weight: number;
  elapsedMs: number;
  timestamp: number;
}

const BASE_LEARNING_RATE = 0.4;
export const MAX_DECISION_TIME_MS = 15000;

export function winProbability(ratingA: number, ratingB: number): number {
  const expA = Math.exp(ratingA);
  const expB = Math.exp(ratingB);
  return expA / (expA + expB);
}

export function updateRatings(
  winner: Item,
  loser: Item,
  weight: number
): { winnerRating: number; loserRating: number } {
  const pWin = winProbability(winner.rating, loser.rating);
  const eta = BASE_LEARNING_RATE * weight;

  return {
    winnerRating: winner.rating + eta * (1 - pWin),
    loserRating: loser.rating - eta * pWin,
  };
}

export function getRankings(items: Item[]): Item[] {
  return [...items].sort((a, b) => b.rating - a.rating);
}

export function selectPair(items: Item[]): [Item, Item] {
  if (items.length < 2) throw new Error('Need at least 2 items');

  const weights = items.map((item) => 1 / (1 + item.comparisons));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const normalized = weights.map((w) => w / totalWeight);

  const pickIndex = (exclude: number): number => {
    let r = Math.random();
    for (let i = 0; i < normalized.length; i++) {
      if (i === exclude) continue;
      const adjusted =
        normalized[i] / (1 - (exclude >= 0 ? normalized[exclude] : 0));
      r -= adjusted;
      if (r <= 0) return i;
    }
    let idx = Math.floor(Math.random() * items.length);
    while (idx === exclude) idx = Math.floor(Math.random() * items.length);
    return idx;
  };

  const a = pickIndex(-1);
  const b = pickIndex(a);
  return [items[a], items[b]];
}

export function detectMetaKeys(entries: Record<string, unknown>[]): string[] {
  const reserved = new Set(['id', 'name', 'imageUrl', 'rating', 'comparisons', 'wins', 'meta']);
  const keys = new Set<string>();
  for (const entry of entries) {
    for (const key of Object.keys(entry)) {
      if (!reserved.has(key)) keys.add(key);
    }
  }
  return [...keys].sort();
}
