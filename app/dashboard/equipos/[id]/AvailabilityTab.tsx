"use client";

import { useEffect, useRef, useState } from "react";
import {
  AvailabilityPoll,
  AvailabilityResponse,
  Team,
  confirmPollSlot,
  createAvailabilityPoll,
  deletePoll,
  getAvailabilityPolls,
  getPollResponses,
  saveMyAvailability,
} from "@/lib/firestore";

// ── Helpers ──────────────────────────────────

function generateSlots(
  date: string,
  timeStart: string,
  timeEnd: string,
  slotMinutes: number
): string[] {
  const slots: string[] = [];
  const [sh, sm] = timeStart.split(":").map(Number);
  const [eh, em] = timeEnd.split(":").map(Number);
  let h = sh,
    m = sm;
  while (h * 60 + m < eh * 60 + em) {
    slots.push(
      `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
    m += slotMinutes;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }
  }
  return slots;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return "";
  if (dates.length === 1) return formatDateHeader(dates[0]);
  const first = new Date(dates[0] + "T00:00:00");
  const last = new Date(dates[dates.length - 1] + "T00:00:00");
  const MONTHS = [
    "ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic",
  ];
  return `${first.getDate()} ${MONTHS[first.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]}`;
}

function formatSlotLabel(date: string, time: string): string {
  const d = new Date(date + "T00:00:00");
  const day = d.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${day} a las ${time}`;
}

// ── AvailabilityGrid (interactive) ───────────

function AvailabilityGrid({
  poll,
  selectedSlots,
  onChange,
}: {
  poll: AvailabilityPoll;
  selectedSlots: Set<string>;
  onChange: (slots: Set<string>) => void;
}) {
  const isDragging = useRef(false);
  const dragMode = useRef<"add" | "remove">("add");

  const timeLabels = generateSlots(
    "2000-01-01",
    poll.timeStart,
    poll.timeEnd,
    poll.slotMinutes
  ).map((s) => s.split("T")[1]);

  function applyToggle(key: string, current: Set<string>) {
    const next = new Set(current);
    if (dragMode.current === "add") next.add(key);
    else next.delete(key);
    onChange(next);
  }

  function handleMouseDown(key: string) {
    isDragging.current = true;
    dragMode.current = selectedSlots.has(key) ? "remove" : "add";
    applyToggle(key, selectedSlots);
  }

  function handleMouseEnter(key: string) {
    if (!isDragging.current) return;
    applyToggle(key, selectedSlots);
  }

  useEffect(() => {
    const stop = () => {
      isDragging.current = false;
    };
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  return (
    <div className="overflow-x-auto" style={{ userSelect: "none" }}>
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[3rem] bg-white py-1 pr-2 text-right font-normal text-slate-400" />
            {poll.dates.map((date) => (
              <th
                key={date}
                className="min-w-[48px] px-1 py-1 text-center text-xs font-semibold text-slate-600"
              >
                {formatDateHeader(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeLabels.map((time) => (
            <tr key={time}>
              <td className="sticky left-0 z-10 whitespace-nowrap bg-white py-0.5 pr-2 text-right text-slate-400">
                {time}
              </td>
              {poll.dates.map((date) => {
                const key = `${date}T${time}`;
                const selected = selectedSlots.has(key);
                return (
                  <td key={date} className="px-0.5 py-0.5">
                    <div
                      onMouseDown={() => handleMouseDown(key)}
                      onMouseEnter={() => handleMouseEnter(key)}
                      className="h-6 w-12 cursor-pointer rounded transition-colors"
                      style={{
                        backgroundColor: selected ? "#185FA5" : "#f1f5f9",
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── HeatmapGrid (read-only) ───────────────────

function heatmapBg(count: number, total: number): string {
  if (total === 0 || count === 0) return "#ffffff";
  const pct = count / total;
  if (pct >= 1) return "#0C447C";
  if (pct >= 0.67) return "#185FA5";
  if (pct >= 0.34) return "#378ADD";
  return "#E6F1FB";
}

function HeatmapGrid({
  poll,
  responses,
  memberCount,
  isAdmin,
  onCellClick,
}: {
  poll: AvailabilityPoll;
  responses: AvailabilityResponse[];
  memberCount: number;
  isAdmin: boolean;
  onCellClick?: (date: string, time: string) => void;
}) {
  const confirmedKey = poll.confirmedSlot
    ? `${poll.confirmedSlot.date}T${poll.confirmedSlot.time}`
    : null;

  const timeLabels = generateSlots(
    "2000-01-01",
    poll.timeStart,
    poll.timeEnd,
    poll.slotMinutes
  ).map((s) => s.split("T")[1]);

  const countMap: Record<string, string[]> = {};
  for (const resp of responses) {
    for (const slot of resp.slots) {
      if (!countMap[slot]) countMap[slot] = [];
      countMap[slot].push(resp.userName);
    }
  }

  return (
    <div className="overflow-x-auto" style={{ userSelect: "none" }}>
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[3rem] bg-white py-1 pr-2 text-right font-normal text-slate-400" />
            {poll.dates.map((date) => (
              <th
                key={date}
                className="min-w-[48px] px-1 py-1 text-center text-xs font-semibold text-slate-600"
              >
                {formatDateHeader(date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeLabels.map((time) => (
            <tr key={time}>
              <td className="sticky left-0 z-10 whitespace-nowrap bg-white py-0.5 pr-2 text-right text-slate-400">
                {time}
              </td>
              {poll.dates.map((date) => {
                const key = `${date}T${time}`;
                const names = countMap[key] ?? [];
                const count = names.length;
                const isConfirmed = confirmedKey === key;
                const tooltip =
                  count === 0
                    ? "0 disponibles"
                    : `${count} de ${memberCount} disponibles: ${names.join(", ")}`;
                return (
                  <td key={date} className="px-0.5 py-0.5">
                    <div
                      title={tooltip}
                      onClick={() => isAdmin && onCellClick?.(date, time)}
                      className={`relative h-6 w-12 rounded transition-opacity ${
                        isAdmin ? "cursor-pointer hover:opacity-75" : ""
                      }`}
                      style={{
                        backgroundColor: heatmapBg(count, memberCount),
                        outline: isConfirmed
                          ? "2px solid #16a34a"
                          : count === memberCount && memberCount > 0
                          ? "2px solid #0C447C"
                          : "none",
                      }}
                    >
                      {isConfirmed && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-700">
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── PollDetail ────────────────────────────────

function PollDetail({
  poll,
  team,
  userId,
  userName,
  isAdmin,
  onRefresh,
}: {
  poll: AvailabilityPoll;
  team: Team;
  userId: string;
  userName: string;
  isAdmin: boolean;
  onRefresh: () => void;
}) {
  const [responses, setResponses] = useState<AvailabilityResponse[]>([]);
  const [mySlots, setMySlots] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [confirmPending, setConfirmPending] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id]);

  async function loadResponses() {
    const r = await getPollResponses(team.id, poll.id);
    setResponses(r);
    const mine = r.find((resp) => resp.userId === userId);
    if (mine) setMySlots(new Set(mine.slots));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    try {
      await saveMyAvailability(
        team.id,
        poll.id,
        userId,
        userName,
        Array.from(mySlots)
      );
      setSaveMsg("Guardado");
      await loadResponses();
      setTimeout(() => setSaveMsg(""), 2500);
    } catch {
      setSaveMsg("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    if (!confirmPending) return;
    setConfirming(true);
    try {
      await confirmPollSlot(
        team.id,
        poll.id,
        confirmPending.date,
        confirmPending.time
      );
      setConfirmPending(null);
      onRefresh();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Panel izquierdo: Mi disponibilidad */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Mi disponibilidad
          </h4>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <AvailabilityGrid
              poll={poll}
              selectedSlots={mySlots}
              onChange={setMySlots}
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ backgroundColor: saving ? "#378ADD" : "#185FA5" }}
            >
              {saving ? "Guardando..." : "Guardar mi disponibilidad"}
            </button>
            {saveMsg && (
              <span
                className={`text-sm font-medium ${
                  saveMsg === "Guardado" ? "text-green-600" : "text-red-600"
                }`}
              >
                {saveMsg}
              </span>
            )}
          </div>
        </div>

        {/* Panel derecho: Heatmap del equipo */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Disponibilidad del equipo ({responses.length}/{team.members.length}{" "}
            respondieron)
          </h4>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <HeatmapGrid
              poll={poll}
              responses={responses}
              memberCount={team.members.length}
              isAdmin={isAdmin}
              onCellClick={
                isAdmin && !poll.confirmedSlot
                  ? (date, time) => setConfirmPending({ date, time })
                  : undefined
              }
            />
          </div>

          {isAdmin && !poll.confirmedSlot && (
            <p className="text-xs text-slate-500">
              Haz click en cualquier celda del heatmap para confirmar ese
              horario para el equipo.
            </p>
          )}

          {poll.confirmedSlot && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
              <span className="text-sm font-semibold text-green-700">
                Confirmado:{" "}
                {formatSlotLabel(
                  poll.confirmedSlot.date,
                  poll.confirmedSlot.time
                )}
              </span>
            </div>
          )}

          {confirmPending && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-sm text-slate-700">
                ¿Confirmar reunión el{" "}
                {formatSlotLabel(confirmPending.date, confirmPending.time)}?
              </span>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {confirming ? "..." : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmPending(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CreatePollForm ────────────────────────────

function CreatePollForm({
  teamId,
  userId,
  onCreated,
}: {
  teamId: string;
  userId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [timeStart, setTimeStart] = useState("08:00");
  const [timeEnd, setTimeEnd] = useState("20:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const next3Weeks: string[] = [];
  const todayBase = new Date();
  todayBase.setHours(0, 0, 0, 0);
  for (let i = 0; i < 21; i++) {
    const d = new Date(todayBase);
    d.setDate(todayBase.getDate() + i);
    next3Weeks.push(d.toISOString().split("T")[0]);
  }

  const timeOptions: string[] = [];
  for (let h = 6; h <= 22; h++) {
    timeOptions.push(`${String(h).padStart(2, "0")}:00`);
  }

  function toggleDate(dateStr: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else if (next.size < 14) {
        next.add(dateStr);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (selectedDates.size === 0) {
      setError("Selecciona al menos un día.");
      return;
    }
    if (timeStart >= timeEnd) {
      setError("La hora de fin debe ser mayor que la de inicio.");
      return;
    }
    setSubmitting(true);
    try {
      await createAvailabilityPoll(teamId, {
        title: title.trim(),
        dates: Array.from(selectedDates).sort(),
        timeStart,
        timeEnd,
        slotMinutes: 30,
        confirmedSlot: null,
        createdBy: userId,
      });
      setTitle("");
      setSelectedDates(new Set());
      setTimeStart("08:00");
      setTimeEnd("20:00");
      setOpen(false);
      onCreated();
    } catch {
      setError("No fue posible crear la encuesta.");
    } finally {
      setSubmitting(false);
    }
  }

  const firstDayOffset = new Date(next3Weeks[0] + "T00:00:00").getDay();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <span>+ Nueva encuesta de horarios</span>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 border-t border-slate-100 px-5 py-4"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Nombre del evento *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Reunión semanal"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">
              Fechas ({selectedDates.size}/14 seleccionadas)
            </label>
            <div className="grid grid-cols-7 gap-1">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-xs font-semibold text-slate-400"
                >
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDayOffset }, (_, i) => (
                <div key={`off-${i}`} />
              ))}
              {next3Weeks.map((dateStr) => {
                const d = new Date(dateStr + "T00:00:00");
                const selected = selectedDates.has(dateStr);
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => toggleDate(dateStr)}
                    className="rounded-lg py-1.5 text-xs font-medium transition"
                    style={{
                      backgroundColor: selected ? "#185FA5" : "#f1f5f9",
                      color: selected ? "#ffffff" : "#334155",
                    }}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Hora inicio
              </label>
              <select
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Hora fin
              </label>
              <select
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {submitting ? "Creando..." : "Crear encuesta"}
          </button>
        </form>
      )}
    </div>
  );
}

// ── AvailabilityTab (main export) ─────────────

export function AvailabilityTab({
  team,
  userId,
  userName,
  isAdmin,
}: {
  team: Team;
  userId: string;
  userName: string;
  isAdmin: boolean;
}) {
  const [polls, setPolls] = useState<AvailabilityPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>(
    {}
  );
  const [openPollId, setOpenPollId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadPolls = async () => {
    setLoading(true);
    try {
      const p = await getAvailabilityPolls(team.id);
      setPolls(p);
      const counts: Record<string, number> = {};
      await Promise.all(
        p.map(async (poll) => {
          const r = await getPollResponses(team.id, poll.id);
          counts[poll.id] = r.length;
        })
      );
      setResponseCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id]);

  async function handleDeletePoll(pollId: string) {
    setDeleting(pollId);
    try {
      await deletePoll(team.id, pollId);
      if (openPollId === pollId) setOpenPollId(null);
      await loadPolls();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="space-y-4">
      {/* Lista de polls */}
      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
        </div>
      ) : polls.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No hay encuestas de horarios todavía.
        </div>
      ) : (
        <div className="space-y-2">
          {polls.map((poll) => {
            const isOpen = openPollId === poll.id;
            const respCount = responseCounts[poll.id] ?? 0;
            return (
              <div
                key={poll.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{poll.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatDateRange(poll.dates)} ·{" "}
                      {respCount} miembro{respCount !== 1 ? "s" : ""} respondió
                    </p>
                  </div>
                  {poll.confirmedSlot ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Confirmado:{" "}
                      {formatDateHeader(poll.confirmedSlot.date)}{" "}
                      {poll.confirmedSlot.time}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      Pendiente
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpenPollId(isOpen ? null : poll.id)}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {isOpen ? "Cerrar" : "Abrir"}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeletePoll(poll.id)}
                      disabled={deleting === poll.id}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      {deleting === poll.id ? "..." : "Borrar"}
                    </button>
                  )}
                </div>

                {isOpen && (
                  <PollDetail
                    poll={poll}
                    team={team}
                    userId={userId}
                    userName={userName}
                    isAdmin={isAdmin}
                    onRefresh={loadPolls}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Crear nuevo poll (solo admin) */}
      {isAdmin && (
        <CreatePollForm
          teamId={team.id}
          userId={userId}
          onCreated={loadPolls}
        />
      )}
    </section>
  );
}
