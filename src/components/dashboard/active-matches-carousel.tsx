"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export interface ActiveMatch {
  id: string;
  home_team_name: string;
  away_team_name: string;
  status: string;
  current_period: number;
  periods_count: number;
}

const statusLabel: Record<string, string> = {
  not_started: "Nezahájený",
  in_progress: "Probíhá",
  paused: "Pauza",
};

function MatchCard({ match }: { match: ActiveMatch }) {
  const live = match.status === "in_progress";
  return (
    <Link
      href={`/matches/${match.id}`}
      className="block h-full rounded-xl border border-red-600/50 bg-red-600/10 p-4 transition-colors hover:border-red-500"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-red-400">
          <span className="relative flex h-2 w-2">
            {live && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          {statusLabel[match.status] ?? "Rozehraný"} · Třetina {match.current_period}/{match.periods_count}
        </span>
        <span className="text-xs text-red-400">Pokračovat →</span>
      </div>
      <p className="mt-2 font-semibold text-white">
        {match.home_team_name} <span className="text-zinc-500">vs</span> {match.away_team_name}
      </p>
    </Link>
  );
}

export function ActiveMatchesCarousel({ matches }: { matches: ActiveMatch[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (matches.length === 0) return null;

  // Single match: no swipe affordance needed, behaves like the classic card.
  if (matches.length === 1) {
    return <MatchCard match={matches[0]} />;
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(matches.length - 1, index)));
  }

  function goTo(index: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="space-y-3">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {matches.map((match) => (
          <div key={match.id} className="w-full shrink-0 snap-center px-1">
            <MatchCard match={match} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {matches.map((match, index) => (
          <button
            key={match.id}
            type="button"
            aria-label={`Zápas ${index + 1} z ${matches.length}`}
            aria-current={index === active}
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === active ? "w-4 bg-red-500" : "w-1.5 bg-zinc-600 hover:bg-zinc-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
