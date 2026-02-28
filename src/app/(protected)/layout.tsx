import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import Link from "next/link";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-white">Max Goals</h1>
          <LogoutButton />
        </div>
      </header>
      <main className="px-4 py-4 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <NavLink href="/dashboard" label="Domů" icon="home" />
          <NavLink href="/players" label="Hráči" icon="players" />
          <NavLink href="/teams" label="Týmy" icon="teams" />
          <NavLink href="/stats" label="Statistiky" icon="stats" />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const icons: Record<string, string> = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
    players: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    teams: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    stats: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  };

  return (
    <Link href={href} className="flex flex-col items-center gap-1 px-3 py-1 text-zinc-400 hover:text-white transition-colors">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
      </svg>
      <span className="text-xs">{label}</span>
    </Link>
  );
}
