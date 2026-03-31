"use client";

import "gantt-task-react/dist/index.css";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ComponentType } from "react";
import type { Task } from "gantt-task-react";

const Gantt = dynamic(
  () => import("gantt-task-react").then((mod) => mod.Gantt as ComponentType<any>),
  { ssr: false }
);

export default function GanttPage() {
  const tasks = useMemo<Task[]>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return [
      { id: "t1", name: "Planificación del proyecto", start: new Date(y, m, 1), end: new Date(y, m, 5), type: "task", progress: 100 },
      { id: "t2", name: "Diseño de arquitectura", start: new Date(y, m, 6), end: new Date(y, m, 12), type: "task", progress: 70, dependencies: ["t1"] },
      { id: "t3", name: "Desarrollo de módulos", start: new Date(y, m, 13), end: new Date(y, m, 22), type: "task", progress: 30, dependencies: ["t2"] },
      { id: "t4", name: "Pruebas y entrega", start: new Date(y, m, 23), end: new Date(y, m, 28), type: "task", progress: 0, dependencies: ["t3"] },
    ];
  }, []);

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Diagrama Gantt</h1>
        <p className="text-sm text-slate-500">
          Visualiza el cronograma general. Para Gantt por equipo, entra al panel del equipo.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-[520px] w-full overflow-x-auto rounded-xl border bg-white text-slate-900 shadow-sm">
          <Gantt
            tasks={tasks}
            viewMode="Day"
            locale="es"
            barBackgroundColor="#4f46e5"
            barProgressColor="#312e81"
            listCellWidth="250px"
          />
        </div>
      </section>
    </main>
  );
}
