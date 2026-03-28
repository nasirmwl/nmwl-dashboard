"use client";

/** Edit values (0–100). `name` is used for accessibility; UI shows first letter only. */
const ME_STATS = [
  { name: "Discipline", value: 68 },
  { name: "Health", value: 72 },
  { name: "Finance", value: 55 },
  { name: "Focus", value: 74 },
  { name: "Energy", value: 62 },
] as const;

function StatBar({ name, value }: { name: string; value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const letter = name.charAt(0).toUpperCase();
  return (
    <div className="me-stat-row crt-text-plain">
      <span className="me-stat-label" title={name} aria-label={name}>
        {letter}
      </span>
      <div
        className="me-stat-track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name}: ${clamped} percent`}
      >
        <div className="me-stat-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="me-stat-value">{clamped}</span>
    </div>
  );
}

export default function MeSection() {
  return (
    <div className="crt-panel overflow-hidden rounded-sm">
      <div className="h-36 w-full overflow-hidden sm:h-40">
        <img
          src="/girl-green-eye.png"
          alt=""
          className="block h-full w-full object-cover object-center"
          decoding="async"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-6">
        {ME_STATS.map((s) => (
          <StatBar key={s.name} name={s.name} value={s.value} />
        ))}
      </div>
    </div>
  );
}
