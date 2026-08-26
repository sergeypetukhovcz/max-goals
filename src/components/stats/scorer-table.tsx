import { UNKNOWN_SCORER, type ScorerRow } from "@/lib/scorer-stats";

interface ScorerTableProps {
  rows: ScorerRow[];
  title?: string;
}

/** Přehled střelců: Hráč | Góly, seřazeno sestupně. */
export function ScorerTable({ rows, title = "Střelci" }: ScorerTableProps) {
  if (rows.length === 0) return null;

  const total = rows.reduce((sum, r) => sum + r.goals, 0);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h3>
        <span className="text-xs text-zinc-500">
          {total} {total === 1 ? "gól" : total < 5 ? "góly" : "gólů"}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          <span>Hráč</span>
          <span>Góly</span>
        </div>
        {rows.map((r) => {
          const unknown = r.name === UNKNOWN_SCORER;
          return (
            <div
              key={r.key}
              className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5 last:border-b-0"
            >
              <span className={`text-sm ${unknown ? "italic text-zinc-500" : "font-medium text-white"}`}>
                {r.name}
              </span>
              <span className="font-mono text-sm font-bold tabular-nums text-white">{r.goals}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
