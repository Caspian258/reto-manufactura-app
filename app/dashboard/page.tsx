"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserTeams, Team } from "@/lib/firestore";

export default function DashboardPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getUserTeams(user.uid)
      .then(setTeams)
      .finally(() => setLoading(false));
  }, [user?.uid]);

  return (
    <main className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Hola, {user?.displayName?.split(" ")[0] ?? "Usuario"} 👋
        </h1>
        <p className="text-sm text-slate-500">
          Aquí tienes un resumen de tu actividad.
        </p>
      </header>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Equipos
          </p>
          <p className="mt-2 text-4xl font-semibold text-slate-900">
            {loading ? "—" : teams.length}
          </p>
          <Link
            href="/dashboard/equipos"
            className="mt-3 inline-block text-xs font-medium text-indigo-600 hover:underline"
          >
            Ver equipos →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Herramientas
          </p>
          <p className="mt-2 text-4xl font-semibold text-slate-900">3</p>
          <Link
            href="/dashboard/herramientas/gantt"
            className="mt-3 inline-block text-xs font-medium text-indigo-600 hover:underline"
          >
            Abrir Gantt →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Canvas LMS
          </p>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Integración próxima
          </p>
          <span className="mt-3 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
            En desarrollo
          </span>
        </div>
      </div>

      {/* Accesos rápidos */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Gestionar equipos", href: "/dashboard/equipos", desc: "Crea o únete a un equipo" },
            { label: "Diagrama Gantt", href: "/dashboard/herramientas/gantt", desc: "Visualiza el cronograma" },
            { label: "Diagrama PERT", href: "/dashboard/herramientas/pert", desc: "Analiza dependencias" },
            { label: "Ishikawa", href: "/dashboard/herramientas/ishikawa", desc: "Identifica causas raíz" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-400 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
