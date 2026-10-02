import type { Entry } from './types';

export const TAX_RATE = 0.117;
export const TAX_RATE_LABEL = '11.7%';

export function signedCents(entry: Entry): number {
  return entry.type === 'payout' ? entry.amountCents : -entry.amountCents;
}

/** Tax is only set aside on a positive net; losses never produce a credit. */
export function taxSetAside(netCents: number): number {
  return netCents > 0 ? Math.round(netCents * TAX_RATE) : 0;
}

export function netAfterTax(netCents: number): number {
  return netCents - taxSetAside(netCents);
}

export interface Totals {
  moneyIn: number;
  moneyOut: number;
  net: number;
  tax: number;
  netAfterTax: number;
  /** Ratio (0.25 = 25%), or null when there's no money out to measure against. */
  roi: number | null;
  roiAfterTax: number | null;
}

export function computeTotals(entries: Entry[]): Totals {
  let moneyIn = 0;
  let moneyOut = 0;
  for (const e of entries) {
    if (e.type === 'payout') moneyIn += e.amountCents;
    else moneyOut += e.amountCents;
  }
  const net = moneyIn - moneyOut;
  const tax = taxSetAside(net);
  const after = net - tax;
  return {
    moneyIn,
    moneyOut,
    net,
    tax,
    netAfterTax: after,
    roi: moneyOut > 0 ? net / moneyOut : null,
    roiAfterTax: moneyOut > 0 ? after / moneyOut : null,
  };
}

export interface MonthBucket {
  /** `YYYY-MM` */
  key: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
  netAfterTax: number;
}

function nextMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/** One bucket per calendar month from the first to the last entry, including empty months. */
export function monthlyBreakdown(entries: Entry[]): MonthBucket[] {
  if (entries.length === 0) return [];

  const sums = new Map<string, { moneyIn: number; moneyOut: number }>();
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    const bucket = sums.get(key) ?? { moneyIn: 0, moneyOut: 0 };
    if (e.type === 'payout') bucket.moneyIn += e.amountCents;
    else bucket.moneyOut += e.amountCents;
    sums.set(key, bucket);
  }

  const keys = [...sums.keys()].sort();
  const last = keys[keys.length - 1];
  const result: MonthBucket[] = [];
  for (let key = keys[0]; key <= last; key = nextMonthKey(key)) {
    const { moneyIn, moneyOut } = sums.get(key) ?? { moneyIn: 0, moneyOut: 0 };
    const net = moneyIn - moneyOut;
    result.push({ key, moneyIn, moneyOut, net, netAfterTax: netAfterTax(net) });
  }
  return result;
}
