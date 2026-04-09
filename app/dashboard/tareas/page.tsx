"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserTeams, getTeamTasks, Task, Team } from "@/lib/firestore";

type TaskWithTeam = Task & { teamName: string };

const statusLabel: Record<Task["status"], string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
};

const statusColor: Record<Task["status"], string> = {
  pending: "bg-blue-50 text-blue-800",
  in_progress: "bg-amber-50 text-amber-800",
  completed: "bg-green-50 text-green-800",
};

const priorityLabel: Record<Task["priority"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const priorityColor: Record<Task["priority"], string> = {
  high: "bg-red-50 text-red-800",
  medium: "bg-amber-50 text-amber-800",
  low: "bg-slate-100 text-slate-600",
};

function daysRemaining(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

const TableHeader = () => (
  <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-slate-400 sm:grid">
    <span>Tarea</span>
    <span>Equipo</span>
    <span>Responsable</span>
    <span>Prioridad</span>
    <span>Estado</span>
    <span>Fecha límite</span>
  </div>
);

function TaskRow({ task, i, completed }: { task: TaskWithTeam; i: number; completed?: boolean }) {
  const days = daysRemaining(task.dueDate);
  return (
    <div
      className={`grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-4 ${
        i !== 0 ? "border-t border-slate-100" : ""
      } ${completed ? "opacity-60" : ""}`}
    >
      <p className={`font-semibold text-slate-900 ${completed ? "line-through" : ""}`}>
        {task.name}
      </p>
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
}

function TareasContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<Task["status"] | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Task["priority"] | "all">("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [completedOpen, setCompletedOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("filter") === "mine" && user?.uid) {
      setFilterAssignee(user.uid);
    }
  }, [searchParams, user?.uid]);

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

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of allTasks) {
      if (t.assignedTo && t.assignedToName) {
        map.set(t.assignedTo, t.assignedToName);
      }
    }
    return Array.from(map.entries());
  }, [allTasks]);

  const filtered = allTasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterTeam !== "all" && t.teamId !== filterTeam) return false;
    if (filterAssignee !== "all" && t.assignedTo !== filterAssignee) return false;
    return true;
  });

  const activas = filtered.filter((t) => t.status !== "completed");
  const completadas = filtered.filter((t) => t.status === "completed");

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

        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className={selectClass}
        >
          <option value="all">Todos los responsables</option>
          {uniqueAssignees.map(([uid, name]) => (
            <option key={uid} value={uid}>
              {uid === user?.uid ? `${name} (yo)` : name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
        </div>
      ) : activas.length === 0 && completadas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No hay tareas con los filtros seleccionados.
        </div>
      ) : (
        <div className="space-y-4">
          {activas.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <TableHeader />
              {activas.map((task, i) => (
                <TaskRow key={task.id} task={task} i={i} />
              ))}
            </div>
          )}

          {completadas.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setCompletedOpen((o) => !o)}
                className="flex w-full items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <span className="text-xs">{completedOpen ? "▼" : "▶"}</span>
                {completadas.length} tarea{completadas.length !== 1 ? "s" : ""} completada{completadas.length !== 1 ? "s" : ""}
              </button>
              {completedOpen && (
                <div className="border-t border-slate-100">
                  <TableHeader />
                  {completadas.map((task, i) => (
                    <TaskRow key={task.id} task={task} i={i} completed />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function TareasPage() {
  return (
    <Suspense>
      <TareasContent />
    </Suspense>
  );
}
