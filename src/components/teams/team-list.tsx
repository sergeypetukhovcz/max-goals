"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TeamForm } from "./team-form";

interface TeamListProps {
  teams: Team[];
}

export function TeamList({ teams }: TeamListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Opravdu smazat tento tým?")) return;
    setDeletingId(id);
    await supabase.from("teams").delete().eq("id", id);
    setDeletingId(null);
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Týmy</h2>
        <Button size="sm" onClick={() => setShowForm(true)}>+ Nový tým</Button>
      </div>

      <div className="space-y-3">
        {teams.map((team) => (
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
              <span className="font-semibold text-white truncate block">{team.name}</span>
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
        ))}
      </div>

      <TeamForm team={editTeam} open={showForm} onClose={closeForm} />
    </>
  );
}
