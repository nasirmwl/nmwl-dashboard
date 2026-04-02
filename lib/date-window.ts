/** ISO `yyyy-MM-dd` strings for the last `n` calendar days ending today, UTC. Oldest first. */
export function getLastNDatesUtcEndingToday(n: number): string[] {
  const end = new Date();
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i),
    );
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

export function normalizeEntryDate(raw: string): string {
  return raw.slice(0, 10);
}
