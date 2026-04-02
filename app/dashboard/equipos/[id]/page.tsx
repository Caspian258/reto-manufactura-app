"use client";

import "gantt-task-react/dist/index.css";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import type { Task as GanttTask } from "gantt-task-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  getTeamTasks,
  createTask,
  updateTask,
  deleteTask,
  deleteTeam,
  leaveTeam,
  removeMember,
  getTaskComments,
  addComment,
  deleteComment,
  Task,
  Team,
  TeamMember,
  Comment,
} from "@/lib/firestore";
import { getUserTeams } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";

const Gantt = dynamic(
  () => import("gantt-task-react").then((mod) => mod.Gantt as ComponentType<any>),
  { ssr: false }
);

type TeamTab = "Tareas" | "Kanban" | "Gantt" | "Miembros";
const tabs: TeamTab[] = ["Tareas", "Kanban", "Gantt", "Miembros"];

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
const statusLabel: Record<Task["status"], string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completado",
};
const statusColor: Record<Task["status"], string> = {
  pending: "bg-blue-50 text-blue-800",
  in_progress: "bg-amber-50 text-amber-800",
  completed: "bg-green-50 text-green-800",
};

function daysRemaining(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function relativeTime(createdAt: unknown): string {
  if (!createdAt) return "";
  let date: Date | null = null;
  if (createdAt instanceof Date) {
    date = createdAt;
  } else if (
    typeof createdAt === "object" &&
    createdAt !== null &&
    "toDate" in createdAt &&
    typeof (createdAt as { toDate: unknown }).toDate === "function"
  ) {
    date = (createdAt as { toDate: () => Date }).toDate();
  }
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours} h`;
  if (days === 1) return "hace 1 día";
  return `hace ${days} días`;
}

// ── Kanban sub-components ──

function KanbanCard({ task }: { task: Task }) {
  const days = daysRemaining(task.dueDate);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold text-slate-900 leading-snug">{task.name}</p>
      {task.assignedToName && (
        <p className="mt-1 text-xs text-slate-500">{task.assignedToName}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColor[task.priority]}`}>
          {priorityLabel[task.priority]}
        </span>
        <span
          className={`text-xs font-medium ${
            days < 0 ? "text-red-500" : days <= 2 ? "text-amber-500" : "text-slate-400"
          }`}
        >
          {task.dueDate.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
        </span>
      </div>
    </div>
  );
}

function DraggableCard({ task, isActive }: { task: Task; isActive: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing transition-opacity ${
        isActive ? "opacity-40" : "opacity-100"
      }`}
    >
      <KanbanCard task={task} />
    </div>
  );
}

function DroppableColumn({
  id,
  label,
  count,
  children,
}: {
  id: Task["status"];
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border bg-white shadow-sm transition-all ${
        isOver ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
      }`}
    >
      <div className="border-b border-slate-100 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-slate-700">
          {label}{" "}
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {count}
          </span>
        </h3>
      </div>
      <div className="flex-1 space-y-2 p-3 min-h-[120px]">{children}</div>
    </div>
  );
}

// ── TaskForm type ──

type TaskForm = {
  name: string;
  description: string;
  priority: Task["priority"];
  assignedTo: string;
  assignedToName: string;
  startDate: string;
  dueDate: string;
  progress: number;
};

const emptyForm: TaskForm = {
  name: "",
  description: "",
  priority: "medium",
  assignedTo: "",
  assignedToName: "",
  startDate: "",
  dueDate: "",
  progress: 0,
};

// ── Main component ──

export default function TeamPage() {
  const params = useParams<{ id: string }>();
  const teamId = params?.id ?? "";
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TeamTab>("Tareas");
  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Formulario
  const [formOpen, setFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Acciones de equipo
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  // Copiar código
  const [copied, setCopied] = useState(false);

  // Comentarios
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [commentsByTask, setCommentsByTask] = useState<Record<string, Comment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Drag-and-drop
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadData = async () => {
    if (!teamId || !user?.uid) return;
    setTasksLoading(true);
    try {
      const [fetchedTasks, fetchedTeams] = await Promise.all([
        getTeamTasks(teamId),
        getUserTeams(user.uid),
      ]);
      setTasks(fetchedTasks);
      setTeam(fetchedTeams.find((t) => t.id === teamId) ?? null);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teamId, user?.uid]);

  const currentMember: TeamMember | undefined = team?.members.find(
    (m) => m.uid === user?.uid
  );
  const isAdmin = currentMember?.role === "admin";

  // ── Formulario helpers ──

  const openCreate = () => {
    setEditingTaskId(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTaskId(task.id);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    setForm({
      name: task.name,
      description: task.description,
      priority: task.priority,
      assignedTo: task.assignedTo,
      assignedToName: task.assignedToName,
      startDate: fmt(task.startDate),
      dueDate: fmt(task.dueDate),
      progress: task.progress,
    });
    setFormError("");
    setFormOpen(true);
  };

  const setMember = (uid: string) => {
    const member = team?.members.find((m) => m.uid === uid);
    setForm((f) => ({ ...f, assignedTo: uid, assignedToName: member?.name ?? "" }));
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!user?.uid) { setFormError("Debes iniciar sesión."); return; }
    if (!form.name.trim()) { setFormError("El nombre es obligatorio."); return; }
    if (!form.startDate || !form.dueDate) { setFormError("Las fechas son obligatorias."); return; }
    const startDate = new Date(form.startDate);
    const dueDate = new Date(form.dueDate);
    if (dueDate < startDate) { setFormError("La fecha límite debe ser posterior al inicio."); return; }

    try {
      setFormError("");
      setIsSubmitting(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: "pending" as const,
        priority: form.priority,
        assignedTo: form.assignedTo,
        assignedToName: form.assignedToName,
        startDate,
        dueDate,
        progress: form.progress,
        createdBy: user.uid,
      };
      if (editingTaskId) {
        await updateTask(teamId, editingTaskId, payload);
      } else {
        await createTask(teamId, payload, user.uid);
      }
      setFormOpen(false);
      setEditingTaskId(null);
      setForm(emptyForm);
      await loadData();
    } catch {
      setFormError("No fue posible guardar la tarea.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(teamId, taskId);
      await loadData();
    } catch {
      setActionError("No fue posible borrar la tarea.");
    }
  };

  // ── Drag-and-drop handlers ──

  const handleDragStart = (event: DragStartEvent) => {
    setDragActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDragActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task["status"];
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Actualización optimista
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(teamId, taskId, { status: newStatus });
    } catch {
      setActionError("No fue posible mover la tarea.");
      await loadData(); // revertir
    }
  };

  const dragActiveTask = dragActiveId ? tasks.find((t) => t.id === dragActiveId) ?? null : null;

  // ── Acciones de equipo ──

  const handleDeleteTeam = async () => {
    try {
      setActionBusy(true);
      setActionError("");
      await deleteTeam(teamId);
      router.replace("/dashboard/equipos");
    } catch {
      setActionError("No fue posible borrar el equipo.");
      setConfirmDelete(false);
    } finally {
      setActionBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!user?.uid) return;
    try {
      setActionBusy(true);
      setActionError("");
      await leaveTeam(teamId, user.uid);
      router.replace("/dashboard/equipos");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "No fue posible salir del equipo.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveMember = async (targetUid: string) => {
    try {
      setActionBusy(true);
      setActionError("");
      await removeMember(teamId, targetUid);
      await loadData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "No fue posible expulsar al miembro.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCopyCode = () => {
    if (!team?.inviteCode) return;
    navigator.clipboard.writeText(team.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Comentarios ──

  const loadComments = async (taskId: string) => {
    setCommentsLoading(true);
    try {
      const comments = await getTaskComments(teamId, taskId);
      setCommentsByTask((prev) => ({ ...prev, [taskId]: comments }));
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setCommentInput("");
      setExpandedTaskId(taskId);
      loadComments(taskId);
    }
  };

  const handleAddComment = async (taskId: string) => {
    if (!user || !commentInput.trim()) return;
    try {
      setIsSubmittingComment(true);
      await addComment(teamId, taskId, {
        authorId: user.uid,
        authorName: user.displayName || user.email || "Usuario",
        authorPhoto: user.photoURL ?? "",
        content: commentInput.trim(),
      });
      setCommentInput("");
      await loadComments(taskId);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (taskId: string, commentId: string) => {
    await deleteComment(teamId, taskId, commentId);
    await loadComments(taskId);
  };

  // ── Gantt data ──

  const ganttTasks = useMemo<GanttTask[]>(() => {
    if (tasks.length === 0) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      return [
        { id: "demo1", name: "Sin tareas — crea una", start: new Date(y, m, 1), end: new Date(y, m, 5), type: "task", progress: 0 },
      ];
    }
    return tasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.startDate,
      end: t.dueDate,
      type: "task" as const,
      progress: t.progress,
      dependencies: [],
    }));
  }, [tasks]);

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  const kanbanColumns: { key: Task["status"]; label: string }[] = [
    { key: "pending", label: "Pendiente" },
    { key: "in_progress", label: "En progreso" },
    { key: "completed", label: "Completado" },
  ];

  return (
    <main className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
          Equipo · {team?.name ?? teamId}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Panel de Control
        </h1>
        {actionError && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </p>
        )}
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB: Tareas ── */}
      {activeTab === "Tareas" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              {tasks.length} tarea{tasks.length !== 1 ? "s" : ""}
            </h2>
            <button
              type="button"
              onClick={
                formOpen
                  ? () => { setFormOpen(false); setEditingTaskId(null); }
                  : openCreate
              }
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {formOpen ? "Cancelar" : "+ Nueva tarea"}
            </button>
          </div>

          {formOpen && (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-700">
                {editingTaskId ? "Editar tarea" : "Nueva tarea"}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nombre de la tarea"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción opcional"
                    rows={2}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Prioridad</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Task["priority"] }))}
                    className={inputClass}
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Responsable</label>
                  <select
                    value={form.assignedTo}
                    onChange={(e) => setMember(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sin asignar</option>
                    {team?.members.map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Fecha inicio *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Fecha límite *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Progreso: {form.progress}%
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.progress}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        progress: Math.min(100, Math.max(0, Number(e.target.value))),
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isSubmitting
                      ? "Guardando..."
                      : editingTaskId
                      ? "Guardar cambios"
                      : "Crear tarea"}
                  </button>
                </div>
              </div>
              {formError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </p>
              )}
            </form>
          )}

          {tasksLoading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No hay tareas. Crea la primera.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {tasks.map((task, i) => {
                const days = daysRemaining(task.dueDate);
                const isExpanded = expandedTaskId === task.id;
                const taskComments = commentsByTask[task.id] ?? [];
                return (
                  <div key={task.id} className={i !== 0 ? "border-t border-slate-100" : ""}>
                    {/* Fila principal — clickable para abrir acordeón */}
                    <div
                      className="flex cursor-pointer flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
                      onClick={() => handleToggleTask(task.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{task.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {task.assignedToName || "Sin asignar"}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColor[task.priority]}`}>
                        {priorityLabel[task.priority]}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[task.status]}`}>
                        {statusLabel[task.status]}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          days < 0 ? "text-red-600" : days <= 2 ? "text-amber-600" : "text-slate-500"
                        }`}
                      >
                        {task.dueDate.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                        {" "}
                        ({days < 0 ? `${Math.abs(days)}d vencida` : days === 0 ? "hoy" : `${days}d`})
                      </span>
                      {/* Botones editar/borrar — stopPropagation para no abrir el acordeón */}
                      <div
                        className="flex gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openEdit(task)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Borrar
                        </button>
                      </div>
                      <span className="text-xs text-slate-400">{isExpanded ? "▲" : "▼"}</span>
                    </div>

                    {/* Panel de detalle — acordeón */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 px-5 py-5 space-y-4">
                        {/* Descripción */}
                        {task.description && (
                          <p className="text-sm text-slate-700">{task.description}</p>
                        )}

                        {/* Comentarios */}
                        <div>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                            Comentarios
                          </p>

                          {commentsLoading ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                              Cargando...
                            </div>
                          ) : taskComments.length === 0 ? (
                            <p className="py-2 text-xs text-slate-400">
                              Sin comentarios todavía.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {taskComments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                  {/* Avatar */}
                                  {comment.authorPhoto ? (
                                    <img
                                      src={comment.authorPhoto}
                                      alt={comment.authorName}
                                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                      {comment.authorName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-xs font-semibold text-slate-800">
                                        {comment.authorName}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        {relativeTime(comment.createdAt)}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-sm text-slate-700">{comment.content}</p>
                                  </div>
                                  {comment.authorId === user?.uid && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(task.id, comment.id)}
                                      className="shrink-0 self-start text-xs text-slate-400 transition hover:text-red-500"
                                      title="Borrar comentario"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Input nuevo comentario */}
                          <div className="mt-4 flex gap-2">
                            <input
                              type="text"
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(task.id);
                                }
                              }}
                              placeholder="Escribe un comentario..."
                              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(task.id)}
                              disabled={isSubmittingComment || !commentInput.trim()}
                              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                            >
                              {isSubmittingComment ? "..." : "Comentar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Kanban (drag-and-drop) ── */}
      {activeTab === "Kanban" && (
        <section>
          {tasksLoading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {kanbanColumns.map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col.key);
                  return (
                    <DroppableColumn
                      key={col.key}
                      id={col.key}
                      label={col.label}
                      count={colTasks.length}
                    >
                      {colTasks.length === 0 ? (
                        <p className="py-6 text-center text-xs text-slate-400">
                          Arrastra tareas aquí
                        </p>
                      ) : (
                        colTasks.map((task) => (
                          <DraggableCard
                            key={task.id}
                            task={task}
                            isActive={dragActiveId === task.id}
                          />
                        ))
                      )}
                    </DroppableColumn>
                  );
                })}
              </div>

              <DragOverlay dropAnimation={null}>
                {dragActiveTask ? (
                  <div className="rotate-1 scale-105 shadow-xl">
                    <KanbanCard task={dragActiveTask} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </section>
      )}

      {/* ── TAB: Gantt ── */}
      {activeTab === "Gantt" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {tasksLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
            </div>
          ) : (
            <div className="h-[520px] w-full overflow-x-auto rounded-xl border bg-white text-slate-900 shadow-sm">
              <Gantt
                tasks={ganttTasks}
                viewMode="Day"
                locale="es"
                barBackgroundColor="#4f46e5"
                barProgressColor="#312e81"
                listCellWidth="250px"
              />
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Miembros ── */}
      {activeTab === "Miembros" && (
        <section className="space-y-4">
          {team?.inviteCode && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Código de invitación
                </p>
                <p className="mt-1 font-mono text-xl font-bold tracking-[0.2em] text-slate-900">
                  {team.inviteCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {!team || team.members.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No hay miembros cargados.</p>
            ) : (
              team.members.map((member, i) => (
                <div
                  key={member.uid}
                  className={`flex items-center justify-between px-5 py-3.5 ${
                    i !== 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                    <span
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        member.role === "admin"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {member.role === "admin" ? "Admin" : "Miembro"}
                    </span>
                  </div>
                  {isAdmin && member.uid !== user?.uid && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.uid)}
                      disabled={actionBusy}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      Expulsar
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {isAdmin && !confirmDelete && (
              <button
                type="button"
                onClick={() => { setConfirmDelete(true); setActionError(""); }}
                disabled={actionBusy}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
              >
                Borrar equipo
              </button>
            )}
            {isAdmin && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">¿Confirmar borrado?</span>
                <button
                  type="button"
                  onClick={handleDeleteTeam}
                  disabled={actionBusy}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {actionBusy ? "Borrando..." : "Sí, borrar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={actionBusy}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            )}
            {!isAdmin && (
              <button
                type="button"
                onClick={handleLeave}
                disabled={actionBusy}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {actionBusy ? "Saliendo..." : "Salir del equipo"}
              </button>
            )}
          </div>

          {actionError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
