"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserTeams, getTeamTasks, Task, Team } from "@/lib/firestore";

type TaskWithTeam = Task & { teamName: string };

const statusLabel: Record<Task["status"], string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
};

const statusColor: Record<Task["status"], string> = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
};

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

export default function TareasPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<Task["status"] | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Task["priority"] | "all">("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");

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

  const filtered = allTasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterTeam !== "all" && t.teamId !== filterTeam) return false;
    return true;
  });

  const selectClass =
    "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mis tareas</h1>
        <p className="text-sm text-slate-500">
          Todas las tareas de tus equipos en un solo lugar.
        </p>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Task["status"] | "all")}
          className={selectClass}
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completadas</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Task["priority"] | "all")}
          className={selectClass}
        >
          <option value="all">Todas las prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>

        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos los equipos</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No hay tareas con los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Encabezado de tabla */}
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400 sm:grid">
            <span>Tarea</span>
            <span>Equipo</span>
            <span>Responsable</span>
            <span>Prioridad</span>
            <span>Estado</span>
            <span>Fecha límite</span>
          </div>

          {filtered.map((task, i) => {
            const days = daysRemaining(task.dueDate);
            return (
              <div
                key={task.id}
                className={`grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-4 ${
                  i !== 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <p className="font-semibold text-slate-900">{task.name}</p>
                <p className="text-sm text-slate-500">{task.teamName}</p>
                <p className="text-sm text-slate-600">{task.assignedToName || "—"}</p>
                <span
                  className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColor[task.priority]}`}
                >
                  {priorityLabel[task.priority]}
                </span>
                <span
                  className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[task.status]}`}
                >
                  {statusLabel[task.status]}
                </span>
                <span
                  className={`text-sm font-medium ${
                    days < 0 ? "text-red-600" : days <= 2 ? "text-amber-600" : "text-slate-500"
                  }`}
                >
                  {task.dueDate.toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                  })}
                  {" "}
                  {days < 0
                    ? `(${Math.abs(days)}d vencida)`
                    : days === 0
                    ? "(hoy)"
                    : `(${days}d)`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
