"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createTeam, getUserTeams, joinTeamByCode, Team } from "@/lib/firestore";

export default function EquiposPage() {
  const { user, loading: authLoading } = useAuth();

  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const userDisplayName = useMemo(() => {
    if (!user) return "";
    return user.displayName || user.email || "Usuario";
  }, [user]);

  const loadTeams = async () => {
    if (!user?.uid) {
      setTeams([]);
      setTeamsLoading(false);
      return;
    }
    try {
      setTeamsLoading(true);
      const fetched = await getUserTeams(user.uid);
      setTeams(fetched);
    } catch {
      setError("No fue posible cargar tus equipos.");
    } finally {
      setTeamsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadTeams();
  }, [authLoading, user?.uid]);

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedName = teamName.trim();
    if (!user?.uid) { setError("Debes iniciar sesión para crear un equipo."); return; }
    if (!cleanedName) { setError("El nombre del equipo es obligatorio."); return; }

    try {
      setError("");
      setSuccessMsg("");
      setIsCreating(true);
      await createTeam(cleanedName, user.uid, userDisplayName);
      setTeamName("");
      setSuccessMsg("Equipo creado correctamente.");
      await loadTeams();
    } catch {
      setError("No fue posible crear el equipo.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.uid) { setError("Debes iniciar sesión para unirte."); return; }
    if (!inviteCode.trim()) { setError("Ingresa un código de invitación."); return; }

    try {
      setError("");
      setSuccessMsg("");
      setIsJoining(true);
      await joinTeamByCode(inviteCode, user.uid, userDisplayName);
      setInviteCode("");
      setSuccessMsg("Te uniste al equipo correctamente.");
      await loadTeams();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No fue posible unirte al equipo.");
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <main className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Equipos</h1>
        <p className="text-sm text-slate-500">Crea un equipo nuevo o únete con un código.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Crear equipo */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
            Crear equipo
          </h2>
          <form onSubmit={handleCreateTeam} className="flex flex-col gap-3">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nombre del equipo"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {isCreating ? "Creando..." : "Crear equipo"}
            </button>
          </form>
        </section>

        {/* Unirse con código */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
            Unirse con código
          </h2>
          <form onSubmit={handleJoinTeam} className="flex flex-col gap-3">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Código de 6 letras (ej: A3BX9K)"
              maxLength={6}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm text-slate-900 uppercase outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            <button
              type="submit"
              disabled={isJoining}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {isJoining ? "Uniéndose..." : "Unirse al equipo"}
            </button>
          </form>
        </section>
      </div>

      {/* Mensajes */}
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {successMsg && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMsg}
        </p>
      )}

      {/* Lista de equipos */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Mis equipos
        </h2>

        {teamsLoading ? (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Aún no tienes equipos. Crea uno o únete con un código.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <Link key={team.id} href={`/dashboard/equipos/${team.id}`} className="block">
                <div className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md">
                  <h3 className="text-base font-semibold text-slate-900">{team.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {team.members.length} miembro{team.members.length !== 1 ? "s" : ""}
                  </p>
                  {team.inviteCode && (
                    <p className="mt-2 font-mono text-xs text-slate-400">
                      Código: <span className="font-semibold text-slate-600">{team.inviteCode}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
