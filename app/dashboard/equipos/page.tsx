"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createTeam, getUserTeams, Team } from "@/lib/firestore";

export default function EquiposPage() {
  const { user, loading: authLoading } = useAuth();

  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError("");
      setTeamsLoading(true);
      const fetchedTeams = await getUserTeams(user.uid);
      setTeams(fetchedTeams);
    } catch (loadError) {
      console.error(loadError);
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

    if (!user?.uid) {
      setError("Debes iniciar sesion para crear un equipo.");
      return;
    }

    if (!cleanedName) {
      setError("El nombre del equipo es obligatorio.");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      await createTeam(cleanedName, user.uid, userDisplayName);
      setTeamName("");
      await loadTeams();
    } catch (createError) {
      console.error(createError);
      setError("No fue posible crear el equipo.");
    } finally {
      setIsLoading(false);
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
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Equipos</h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Crea y administra tus equipos privados de manufactura.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Crear Nuevo Equipo</h2>

        <form onSubmit={handleCreateTeam} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Ej: Equipo CNC Norte"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isLoading ? "Creando..." : "Crear Nuevo Equipo"}
          </button>
        </form>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Mis Equipos</h2>

        {teamsLoading ? (
          <div className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            Aun no tienes equipos. Crea el primero para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/dashboard/equipos/${team.id}`}
                className="block"
              >
                <div className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-500 hover:shadow-lg">
                  <h3 className="text-base font-semibold text-slate-900">{team.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Miembros: <span className="font-medium text-slate-800">{team.members.length}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">ID: {team.id}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
