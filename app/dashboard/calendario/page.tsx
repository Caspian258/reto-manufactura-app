"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getUserTeams,
  getTeamTasks,
  getAvailabilityPolls,
  Task,
  AvailabilityPoll,
} from "@/lib/firestore";

type TaskWithTeam = Task & { teamName: string };
type ConfirmedMeeting = AvailabilityPoll & { teamName: string };

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const priorityDot: Record<Task["priority"], string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

const priorityColor: Record<Task["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

const statusLabel: Record<Task["status"], string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
};

export default function CalendarioPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithTeam[]>([]);
  const [meetings, setMeetings] = useState<ConfirmedMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      setLoading(true);
      try {
        const fetchedTeams = await getUserTeams(user.uid);
        const [taskArrays, pollArrays] = await Promise.all([
          Promise.all(
            fetchedTeams.map((t) =>
              getTeamTasks(t.id).then((tasks) =>
                tasks.map((task) => ({ ...task, teamName: t.name }))
              )
            )
          ),
          Promise.all(
            fetchedTeams.map((t) =>
              getAvailabilityPolls(t.id).then((polls) =>
                polls
                  .filter((p) => p.confirmedSlot !== null)
                  .map((p) => ({ ...p, teamName: t.name }))
              )
            )
          ),
        ]);
        setTasks(taskArrays.flat());
        setMeetings(pollArrays.flat());
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  // Agrupar tareas por día del mes actual
  const tasksByDay: Record<number, TaskWithTeam[]> = {};
  for (const task of tasks) {
    const d = task.dueDate;
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(task);
    }
  }

  // Agrupar reuniones confirmadas por día del mes actual
  const meetingsByDay: Record<number, ConfirmedMeeting[]> = {};
  for (const m of meetings) {
    if (!m.confirmedSlot) continue;
    const d = new Date(m.confirmedSlot.date + "T00:00:00");
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!meetingsByDay[day]) meetingsByDay[day] = [];
      meetingsByDay[day].push(m);
    }
  }

  const selectedTasks = selectedDay ? (tasksByDay[selectedDay] ?? []) : [];
  const selectedMeetings = selectedDay ? (meetingsByDay[selectedDay] ?? []) : [];

  const prevMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Celdas: blancos antes del primer día + días del mes
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Calendario</h1>
        <p className="text-sm text-slate-500">Visualiza las fechas límite de tus tareas.</p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Navegación de mes */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            ← Anterior
          </button>
          <h2 className="text-base font-semibold text-slate-900">
            {MONTHS[month]} {year}
          </h2>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Siguiente →
          </button>
        </div>

        {/* Grid de días de la semana */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold uppercase tracking-widest text-slate-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid de celdas */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`blank-${idx}`} className="min-h-[80px] border-b border-r border-slate-100" />;
              }
              const dayTasks = tasksByDay[day] ?? [];
              const dayMeetings = meetingsByDay[day] ?? [];
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[80px] border-b border-r border-slate-100 p-2 text-left transition ${
                    isSelected
                      ? "bg-indigo-50 ring-2 ring-inset ring-indigo-400"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${
                      isToday(day)
                        ? "bg-indigo-600 text-white"
                        : "text-slate-700"
                    }`}
                  >
                    {day}
                  </span>
                  {/* Chips de tareas y reuniones */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayMeetings.slice(0, 2).map((m) => (
                      <span
                        key={m.id}
                        className="h-2 w-2 rounded-full bg-green-500"
                        title={`${m.title} ${m.confirmedSlot?.time}`}
                      />
                    ))}
                    {dayTasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className={`h-2 w-2 rounded-full ${priorityDot[t.priority]}`}
                        title={t.name}
                      />
                    ))}
                    {dayTasks.length + dayMeetings.length > 3 && (
                      <span className="text-xs text-slate-400">
                        +{dayTasks.length + dayMeetings.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel de tareas y reuniones del día seleccionado */}
      {selectedDay !== null && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            {selectedDay} de {MONTHS[month]}
          </h2>
          {selectedMeetings.length === 0 && selectedTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Sin eventos este día.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedMeetings.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 px-5 py-3.5 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-green-900">{m.title}</p>
                    <p className="text-xs text-green-700">{m.teamName}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Reunión {m.confirmedSlot?.time}
                  </span>
                </div>
              ))}
              {selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{task.name}</p>
                    <p className="text-xs text-slate-500">{task.teamName}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${priorityColor[task.priority]}`}
                  >
                    {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {statusLabel[task.status]}
                  </span>
                  {task.assignedToName && (
                    <span className="shrink-0 text-xs text-slate-400">{task.assignedToName}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
