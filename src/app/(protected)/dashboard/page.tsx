import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Ahoj!</h2>
        <p className="text-zinc-400">{user?.email}</p>
      </div>

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
