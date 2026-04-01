export interface DiscountTier {
  minItems: number;
  maxItems: number;
  discountPct: number;
}

export interface PriceCalc {
  count: number;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
}

export const DISCOUNT_TIERS: DiscountTier[] = [
  { minItems: 1,  maxItems: 2,        discountPct: 0  },
  { minItems: 3,  maxItems: 5,        discountPct: 10 },
  { minItems: 6,  maxItems: Infinity, discountPct: 15 },
];

export function getDiscountTier(count: number): DiscountTier | null {
  if (count <= 0) return null;
  return DISCOUNT_TIERS.find(t => count >= t.minItems && count <= t.maxItems) ?? null;
}

export function calcTotal(prices: number[]): PriceCalc {
  const count = prices.length;
  if (count === 0) return { count: 0, subtotal: 0, discountPct: 0, discountAmount: 0, total: 0 };
  const subtotal = prices.reduce((sum, p) => sum + p, 0);
  const tier = getDiscountTier(count);
  const discountPct = tier?.discountPct ?? 0;
  const discountAmount = subtotal * (discountPct / 100);
  return { count, subtotal, discountPct, discountAmount, total: subtotal - discountAmount };
}
