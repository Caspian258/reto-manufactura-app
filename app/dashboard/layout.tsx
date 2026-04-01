"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserTeams, Team } from "@/lib/firestore";

const generalNav = [
  { label: "Inicio", href: "/dashboard" },
  { label: "Mis tareas", href: "/dashboard/tareas" },
  { label: "Calendario", href: "/dashboard/calendario" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || loading) return;
    if (!user) router.replace("/");
  }, [isHydrated, loading, user, router]);

  useEffect(() => {
    if (!user?.uid) return;
    setTeamsLoading(true);
    getUserTeams(user.uid)
      .then(setTeams)
      .finally(() => setTeamsLoading(false));
  }, [user?.uid]);

  if (!isHydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
          <p className="text-sm font-medium text-slate-700">Cargando consola...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
        {/* Logo */}
        <div className="border-b border-slate-800 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Manufactura
          </p>
          <h2 className="mt-1 text-base font-semibold">Consola de Equipos</h2>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {/* Sección General */}
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            General
          </p>
          <ul className="mb-6 space-y-1">
            {generalNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Sección Equipos */}
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            Equipos
          </p>
          <ul className="space-y-1">
            {teamsLoading ? (
              <li className="px-4 py-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
              </li>
            ) : teams.length === 0 ? (
              <li className="px-4 py-2 text-xs text-slate-600">Sin equipos aún</li>
            ) : (
              teams.map((team) => {
                const href = `/dashboard/equipos/${team.id}`;
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={team.id}>
                    <Link
                      href={href}
                      className={`block truncate rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-slate-800 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {team.name}
                    </Link>
                  </li>
                );
              })
            )}
            <li>
              <Link
                href="/dashboard/equipos"
                className="mt-1 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-slate-800 hover:text-indigo-300"
              >
                <span className="text-base leading-none">+</span>
                Nuevo equipo
              </Link>
            </li>
          </ul>
        </nav>

        {/* Usuario al fondo */}
        <div className="border-t border-slate-800 px-4 py-4">
          <p className="truncate text-xs text-slate-400">
            {user.displayName || user.email}
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <section className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        {children}
      </section>
    </div>
  );
}
