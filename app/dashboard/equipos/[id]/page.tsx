"use client";

import "gantt-task-react/dist/index.css";
import "@xyflow/react/dist/style.css";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import type { Task as GanttTask } from "gantt-task-react";
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type { Edge, Node } from "@xyflow/react";
import { getTeamTasks, Task } from "@/lib/firestore";

const Gantt = dynamic(
  () => import("gantt-task-react").then((mod) => mod.Gantt as ComponentType<any>),
  { ssr: false }
);

type TeamTab = "Gantt" | "PERT" | "Ishikawa";
const tabs: TeamTab[] = ["Gantt", "PERT", "Ishikawa"];

const nodeStyle = {
  border: "1px solid #4f46e5",
  borderRadius: 12,
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 600,
  padding: 8,
};

// PERT nodes y edges por defecto (se actualizarán con los datos reales en futuras iteraciones)
const initialNodes: Node[] = [
  { id: "n1", position: { x: 30, y: 180 }, data: { label: "Inicio" }, style: nodeStyle },
  { id: "n2", position: { x: 260, y: 180 }, data: { label: "Diseño" }, style: nodeStyle },
  { id: "n3", position: { x: 490, y: 180 }, data: { label: "Desarrollo" }, style: nodeStyle },
  { id: "n4", position: { x: 720, y: 180 }, data: { label: "Entrega" }, style: nodeStyle },
];
const initialEdges: Edge[] = [
  { id: "e1", source: "n1", target: "n2", animated: true },
  { id: "e2", source: "n2", target: "n3", animated: true },
  { id: "e3", source: "n3", target: "n4", animated: true },
];

export default function TeamControlPage() {
  const params = useParams<{ id: string }>();
  const teamId = params?.id ?? "";

  const [activeTab, setActiveTab] = useState<TeamTab>("Gantt");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (!teamId) return;
    getTeamTasks(teamId)
      .then(setTasks)
      .finally(() => setTasksLoading(false));
  }, [teamId]);

  // Convertir tareas de Firestore al formato de gantt-task-react
  const ganttTasks = useMemo<GanttTask[]>(() => {
    if (tasks.length === 0) {
      // Tareas de ejemplo mientras no hay datos en Firestore
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      return [
        { id: "demo1", name: "Sin tareas aún — crea una", start: new Date(y, m, 1), end: new Date(y, m, 5), type: "task", progress: 0 },
      ];
    }

    return tasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.start,
      end: t.end,
      type: "task" as const,
      progress: t.progress,
      dependencies: t.dependencies,
    }));
  }, [tasks]);

  return (
    <main className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
          Equipo · {teamId}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Panel de Control del Equipo
        </h1>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Gantt */}
        {activeTab === "Gantt" && (
          tasksLoading ? (
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
          )
        )}

        {/* PERT */}
        {activeTab === "PERT" && (
          <div className="h-[500px] w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        )}

        {/* Ishikawa */}
        {activeTab === "Ishikawa" && (
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Causas
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    { categoria: "Máquina", causa: "Configuración incorrecta" },
                    { categoria: "Método", causa: "Proceso no documentado" },
                    { categoria: "Material", causa: "Especificación fuera de rango" },
                    { categoria: "Mano de obra", causa: "Falta de capacitación" },
                  ].map(({ categoria, causa }) => (
                    <div key={categoria} className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="absolute -right-4 top-1/2 h-0 w-4 border-t-2 border-slate-300" />
                      <p className="text-sm font-semibold text-indigo-700">{categoria}</p>
                      <p className="mt-1 text-sm text-slate-700">{causa}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1/2 h-0 w-6 border-t-2 border-slate-400" />
                <div className="rounded-xl border border-indigo-300 bg-indigo-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                    Efecto
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">
                    Problema a analizar
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
