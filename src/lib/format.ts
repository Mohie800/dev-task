const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function formatMoney(amount: number | null | undefined): string {
  return usd.format(amount ?? 0);
}

/** 90 → "1h 30m", 45 → "45m", null → "" */
export function formatMinutes(min: number | null | undefined): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function parseMinutesInput(text: string): number | null {
  const t = text.trim().toLowerCase();
  const m = t.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)?$/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  const unit = m[2] ?? 'm';
  const mins = /h/.test(unit) ? Math.round(v * 60) : Math.round(v);
  return mins > 0 ? mins : null;
}
