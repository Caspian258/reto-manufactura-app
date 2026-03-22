"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { label: "Equipos", href: "/dashboard/equipos" },
  { label: "Gantt", href: "/dashboard/herramientas" },
  { label: "PERT", href: "/dashboard/herramientas" },
  { label: "Ishikawa", href: "/dashboard/herramientas" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || loading) return;

    if (!user) {
      router.replace("/");
    }
  }, [isHydrated, loading, user, router]);

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

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-72 border-r border-slate-800 bg-slate-950 text-slate-100">
        <div className="border-b border-slate-800 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Manufactura
          </p>
          <h2 className="mt-2 text-lg font-semibold">Consola Privada</h2>
        </div>

        <nav className="px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="block cursor-pointer rounded-lg px-4 py-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <section className="flex-1 px-6 py-8 sm:px-10">{children}</section>
    </div>
  );
}
