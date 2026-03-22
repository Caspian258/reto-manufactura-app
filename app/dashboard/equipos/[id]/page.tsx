"use client";

import "gantt-task-react/dist/index.css";
import "@xyflow/react/dist/style.css";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import type { Task } from "gantt-task-react";
import { Background, Controls, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react";
import type { Edge, Node } from "@xyflow/react";

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

const initialNodes: Node[] = [
  {
    id: "n-red",
    position: { x: 30, y: 180 },
    data: { label: "Diseno de topologia de red" },
    style: nodeStyle,
  },
  {
    id: "n-plc",
    position: { x: 320, y: 180 },
    data: { label: "Integracion PLC Siemens S7-1200" },
    style: nodeStyle,
  },
  {
    id: "n-esp32",
    position: { x: 610, y: 180 },
    data: { label: "Despliegue nodos IoT ESP32" },
    style: nodeStyle,
  },
  {
    id: "n-cognex",
    position: { x: 900, y: 180 },
    data: { label: "Calibracion camara Cognex" },
    style: nodeStyle,
  },
];

const initialEdges: Edge[] = [
  { id: "e-red-plc", source: "n-red", target: "n-plc", animated: true },
  { id: "e-plc-esp32", source: "n-plc", target: "n-esp32", animated: true },
  { id: "e-esp32-cognex", source: "n-esp32", target: "n-cognex", animated: true },
];

export default function TeamControlPage() {
  const params = useParams<{ id: string }>();
  const teamId = params?.id;
  const [activeTab, setActiveTab] = useState<TeamTab>("Gantt");
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const tasks = useMemo<Task[]>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const start1 = new Date(year, month, 3);
    const end1 = new Date(year, month, 7);
    const start2 = new Date(year, month, 8);
    const end2 = new Date(year, month, 12);
    const start3 = new Date(year, month, 13);
    const end3 = new Date(year, month, 18);
    const start4 = new Date(year, month, 19);
    const end4 = new Date(year, month, 24);

    return [
      {
        id: "t1",
        name: "Diseno de topologia de red",
        start: start1,
        end: end1,
        type: "task",
        progress: 100,
      },
      {
        id: "t2",
        name: "Integracion de PLC Siemens S7-1200",
        start: start2,
        end: end2,
        type: "task",
        progress: 65,
        dependencies: ["t1"],
      },
      {
        id: "t3",
        name: "Despliegue de nodos IoT con ESP32",
        start: start3,
        end: end3,
        type: "task",
        progress: 30,
        dependencies: ["t2"],
      },
      {
        id: "t4",
        name: "Calibracion de camara Cognex",
        start: start4,
        end: end4,
        type: "task",
        progress: 10,
        dependencies: ["t3"],
      },
    ];
  }, []);

  return (
    <main className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
          Equipo ID: {teamId}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Panel de Control del Equipo
        </h1>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === "Gantt" ? (
          <div className="h-[520px] w-full max-w-full overflow-x-auto overscroll-none rounded-xl border bg-white text-slate-900 shadow-sm">
            <Gantt
              tasks={tasks}
              viewMode={"Day"}
              locale="es"
              barBackgroundColor="#4f46e5"
              barProgressColor="#312e81"
              listCellWidth="250px"
            />
          </div>
        ) : activeTab === "PERT" ? (
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
        ) : (
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
                  <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="absolute -right-4 top-1/2 h-0 w-4 border-t-2 border-slate-300" />
                    <p className="text-sm font-semibold text-indigo-700">Maquina</p>
                    <p className="mt-1 text-sm text-slate-700">Lente descalibrado</p>
                  </div>

                  <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="absolute -right-4 top-1/2 h-0 w-4 border-t-2 border-slate-300" />
                    <p className="text-sm font-semibold text-indigo-700">Metodo</p>
                    <p className="mt-1 text-sm text-slate-700">Exposicion incorrecta</p>
                  </div>

                  <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="absolute -right-4 top-1/2 h-0 w-4 border-t-2 border-slate-300" />
                    <p className="text-sm font-semibold text-indigo-700">Material</p>
                    <p className="mt-1 text-sm text-slate-700">Piezas con reflejo</p>
                  </div>

                  <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="absolute -right-4 top-1/2 h-0 w-4 border-t-2 border-slate-300" />
                    <p className="text-sm font-semibold text-indigo-700">Mano de Obra</p>
                    <p className="mt-1 text-sm text-slate-700">Operador sin capacitacion</p>
                  </div>
                </div>

                <div className="relative h-10">
                  <div className="absolute left-0 right-0 top-1/2 border-t-2 border-slate-300" />
                  <div className="absolute right-0 top-1/2 h-10 border-r-2 border-slate-300" />
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 top-1/2 h-0 w-6 border-t-2 border-slate-400" />
                <div className="rounded-xl border border-indigo-300 bg-indigo-50 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
                    Efecto
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">
                    Fallo de lectura en Camara Cognex
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
