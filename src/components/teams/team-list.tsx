"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { TeamForm } from "./team-form";

interface TeamListProps {
  teams: Team[];
  myPlayerTeamIds: string[];
}

export function TeamList({ teams, myPlayerTeamIds }: TeamListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const myIdSet = useMemo(() => new Set(myPlayerTeamIds), [myPlayerTeamIds]);

  const q = search.trim().toLowerCase();
  const filtered = teams.filter(
    (t) => !q || t.name.toLowerCase().includes(q) || (t.city ?? "").toLowerCase().includes(q)
  );
  // Teams with my player first; within each group the DB order (newest first) is kept.
  const myTeams = filtered.filter((t) => myIdSet.has(t.id));
  const otherTeams = filtered.filter((t) => !myIdSet.has(t.id));
  const showGroupHeadings = myTeams.length > 0 && otherTeams.length > 0;

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Opravdu smazat tento tým? Smaže se i celá jeho soupiska.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("teams").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      setError("Nepodařilo se smazat tým");
      return;
    }
    router.refresh();
  }

  function openEdit(e: React.MouseEvent, team: Team) {
    e.preventDefault();
    e.stopPropagation();
    setEditTeam(team);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTeam(undefined);
  }

  function renderTeam(team: Team) {
    const isMine = myIdSet.has(team.id);
    return (
      <Link
        key={team.id}
        href={`/teams/${team.id}`}
        className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
      >
        <div className="flex gap-1">
          <div className="h-10 w-5 rounded-l-lg" style={{ backgroundColor: team.color_primary }} />
          <div className="h-10 w-5 rounded-r-lg" style={{ backgroundColor: team.color_secondary }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">{team.name}</span>
            {isMine && (
              <span className="shrink-0 rounded bg-red-600/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
                ★ můj hráč
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {team.city && <span>{team.city}</span>}
            {team.city && team.birth_year && <span>·</span>}
            {team.birth_year && <span>Ročník {team.birth_year}</span>}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={(e) => openEdit(e, team)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleDelete(e, team.id)}
            disabled={deletingId === team.id}
            className="rounded-lg p-2 text-zinc-400 hover:bg-red-600/20 hover:text-red-400 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </Link>
    );
  }

  if (teams.length === 0) {
    return (
      <>
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="Zatím žádné týmy"
          description="Vytvoř první tým"
          action={
            <Button onClick={() => setShowForm(true)}>+ Nový tým</Button>
          }
        />
        <TeamForm open={showForm} onClose={closeForm} />
      </>
    );
  }

  return (
    <>
      <ErrorBanner error={error} onDismiss={() => setError(null)} className="mb-4" />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Týmy</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>+ Nový tým</Button>
      </div>

      {/* Search — quickly check whether a team already exists before creating it */}
      <div className="relative mb-4">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat tým podle názvu nebo města…"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-10 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            aria-label="Vymazat hledání"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          Žádný tým neodpovídá „{search}“. Můžeš{" "}
          <button onClick={() => setShowForm(true)} className="text-red-400 hover:underline">
            vytvořit nový
          </button>
          .
        </p>
      ) : (
        <div className="space-y-4">
          {myTeams.length > 0 && (
            <div className="space-y-3">
              {showGroupHeadings && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">S mým hráčem</h3>
              )}
              {myTeams.map(renderTeam)}
            </div>
          )}
          {otherTeams.length > 0 && (
            <div className="space-y-3">
              {showGroupHeadings && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Ostatní týmy</h3>
              )}
              {otherTeams.map(renderTeam)}
            </div>
          )}
        </div>
      )}

      <TeamForm team={editTeam} open={showForm} onClose={closeForm} />
    </>
  );
}
