import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Surface a match that is not finished so the user can jump back into it.
  const { data: activeMatch } = await supabase
    .from("matches")
    .select("id, home_team_name, away_team_name, status, current_period, periods_count")
    .in("status", ["not_started", "in_progress", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const statusLabel: Record<string, string> = {
    not_started: "Nezahájený",
    in_progress: "Probíhá",
    paused: "Pauza",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Ahoj!</h2>
        <p className="text-zinc-400">{user?.email}</p>
      </div>

      {/* Resume active match */}
      {activeMatch && (
        <Link
          href={`/matches/${activeMatch.id}`}
          className="block rounded-xl border border-red-600/50 bg-red-600/10 p-4 transition-colors hover:border-red-500"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-red-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              {statusLabel[activeMatch.status] ?? "Rozehraný"} · Třetina {activeMatch.current_period}/{activeMatch.periods_count}
            </span>
            <span className="text-xs text-red-400">Pokračovat →</span>
          </div>
          <p className="mt-2 font-semibold text-white">
            {activeMatch.home_team_name} <span className="text-zinc-500">vs</span> {activeMatch.away_team_name}
          </p>
        </Link>
      )}

      {/* New Match CTA */}
      <Link
        href="/matches/new"
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-600 py-4 font-semibold text-white text-lg transition-colors hover:bg-red-700 active:bg-red-800"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nový zápas
      </Link>

      <div className="grid gap-4">
        <Link
          href="/schedule"
          className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20">
            <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Turnaje a zápasy</h3>
            <p className="text-sm text-zinc-400">Připrav zápasy a turnaje dopředu</p>
          </div>
        </Link>

        <Link
          href="/players"
          className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600/20">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Hráči</h3>
            <p className="text-sm text-zinc-400">Spravuj profily svých hráčů</p>
          </div>
        </Link>

        <Link
          href="/teams"
          className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/20">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Týmy</h3>
            <p className="text-sm text-zinc-400">Vytvoř a spravuj týmy</p>
          </div>
        </Link>

        <Link
          href="/stats"
          className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600/20">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Statistiky</h3>
            <p className="text-sm text-zinc-400">Přehled zápasů a gólů</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
