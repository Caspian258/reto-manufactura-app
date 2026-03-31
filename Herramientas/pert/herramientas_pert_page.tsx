"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type { Edge, Node } from "@xyflow/react";

const nodeStyle = {
  border: "1px solid #4f46e5",
  borderRadius: 12,
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 600,
  padding: "8px 14px",
};

const initialNodes: Node[] = [
  { id: "n1", position: { x: 30, y: 180 }, data: { label: "Inicio" }, style: nodeStyle },
  { id: "n2", position: { x: 260, y: 80 }, data: { label: "Tarea A" }, style: nodeStyle },
  { id: "n3", position: { x: 260, y: 280 }, data: { label: "Tarea B" }, style: nodeStyle },
  { id: "n4", position: { x: 490, y: 80 }, data: { label: "Tarea C" }, style: nodeStyle },
  { id: "n5", position: { x: 490, y: 280 }, data: { label: "Tarea D" }, style: nodeStyle },
  { id: "n6", position: { x: 720, y: 180 }, data: { label: "Fin" }, style: nodeStyle },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "n1", target: "n2", animated: true, label: "3d" },
  { id: "e2", source: "n1", target: "n3", animated: true, label: "5d" },
  { id: "e3", source: "n2", target: "n4", animated: true, label: "4d" },
  { id: "e4", source: "n3", target: "n5", animated: true, label: "2d" },
  { id: "e5", source: "n4", target: "n6", animated: true, label: "3d" },
  { id: "e6", source: "n5", target: "n6", animated: true, label: "6d" },
];

export default function PertPage() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Diagrama PERT</h1>
        <p className="text-sm text-slate-500">
          Analiza la ruta crítica y dependencias entre actividades.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-[520px] w-full overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
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
      </section>
    </main>
  );
}
