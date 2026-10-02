const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function formatMoney(cents: number): string {
  return usd.format(cents / 100);
}

export function formatSignedMoney(cents: number): string {
  if (cents > 0) return `+${usd.format(cents / 100)}`;
  if (cents < 0) return `−${usd.format(-cents / 100)}`;
  return usd.format(0);
}

export function formatCompactMoney(cents: number): string {
  return usdCompact.format(cents / 100);
}

export function formatPercent(ratio: number | null, signed = true): string {
  if (ratio === null) return '—';
  const pct = ratio * 100;
  const sign = !signed ? '' : pct > 0 ? '+' : pct < 0 ? '−' : '';
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

export function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const d = parseLocalDate(isoDate);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function formatDate(isoDate: string): string {
  return parseLocalDate(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatLongDate(isoDate: string): string {
  return parseLocalDate(isoDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonth(monthKey: string, style: 'long' | 'short' = 'long'): string {
  const date = parseLocalDate(`${monthKey}-01`);
  return style === 'long'
    ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function formatHour(hour: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${suffix}`;
}

/** Accepts "150", "1,250.5", "$99.99". Returns null unless it's a positive amount with ≤ 2 decimals. */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  if (!/^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(cleaned)) return null;
  const cents = Math.round(parseFloat(cleaned) * 100);
  return cents > 0 ? cents : null;
}

export function centsToInput(cents: number): string {
  return (Math.abs(cents) / 100).toFixed(2);
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return 'Something went wrong. Please try again.';
}
