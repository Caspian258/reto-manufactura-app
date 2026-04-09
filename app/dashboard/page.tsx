"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserTeams, getTeamTasks, Task, Team } from "@/lib/firestore";

type TaskWithTeam = Task & { teamName: string };

const priorityLabel: Record<Task["priority"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const priorityColor: Record<Task["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

function daysRemaining(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      setLoading(true);
      try {
        const fetchedTeams = await getUserTeams(user.uid);
        setTeams(fetchedTeams);
        const taskArrays = await Promise.all(
          fetchedTeams.map((t) =>
            getTeamTasks(t.id).then((tasks) =>
              tasks.map((task) => ({ ...task, teamName: t.name }))
            )
          )
        );
        setAllTasks(taskArrays.flat());
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  const relevantes = allTasks.filter(
    (t) => t.assignedTo === user?.uid || !t.assignedTo
  );
  const pendingCount = relevantes.filter((t) => t.status === "pending").length;
  const inProgressCount = relevantes.filter((t) => t.status === "in_progress").length;
  const completedWeekCount = relevantes.filter(
    (t) => t.status === "completed" && isThisWeek(t.dueDate)
  ).length;

  const upcoming = [...relevantes]
    .filter((t) => t.status !== "completed")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  return (
    <main className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Hola, {user?.displayName?.split(" ")[0] ?? "Usuario"}
        </h1>
        <p className="text-sm text-slate-500">Aquí tienes un resumen de tu actividad.</p>
      </header>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Equipos", value: loading ? "—" : teams.length, href: "/dashboard/equipos" },
          { label: "Pendientes", value: loading ? "—" : pendingCount, href: "/dashboard/tareas?filter=mine" },
          { label: "En progreso", value: loading ? "—" : inProgressCount, href: "/dashboard/tareas?filter=mine" },
          { label: "Completadas esta semana", value: loading ? "—" : completedWeekCount, href: "/dashboard/tareas?filter=mine" },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {card.label}
            </p>
            <p className="mt-2 text-4xl font-semibold text-slate-900">{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Mis tareas próximas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Mis tareas próximas
          </h2>
          <Link href="/dashboard/tareas" className="text-xs font-medium text-indigo-600 hover:underline">
            Ver todas →
          </Link>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No tienes tareas pendientes próximas
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {upcoming.map((task, i) => {
              const days = daysRemaining(task.dueDate);
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    i !== 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{task.name}</p>
                    <p className="text-xs text-slate-500">{task.teamName}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColor[task.priority]}`}
                  >
                    {priorityLabel[task.priority]}
                  </span>
                  <span
                    className={`shrink-0 text-xs font-medium ${
                      days < 0 ? "text-red-600" : days <= 2 ? "text-amber-600" : "text-slate-500"
                    }`}
                  >
                    {days < 0
                      ? `${Math.abs(days)}d vencida`
                      : days === 0
                      ? "Hoy"
                      : `${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Mis equipos */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Mis equipos
        </h2>
        {loading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Aún no tienes equipos.{" "}
            <Link href="/dashboard/equipos" className="font-medium text-indigo-600 hover:underline">
              Crear o unirse a uno →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/dashboard/equipos/${team.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-400 hover:shadow-md"
              >
                <h3 className="text-base font-semibold text-slate-900">{team.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {team.members.length} miembro{team.members.length !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
