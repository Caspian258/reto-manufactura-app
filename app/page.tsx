"use client";

import Image from "next/image";
import Link from "next/link";
import LoginButton from "@/components/LoginButton";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
	const { user, logout } = useAuth();

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-6 py-12">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(34,197,94,0.1),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(15,23,42,0.12),transparent_40%)]" />

			<section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur sm:p-10">
				{!user ? (
					<div className="space-y-6 text-center">
						<span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
							Consola de Manufactura Avanzada
						</span>

						<h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
							Plataforma Open Source para planificacion y colaboracion industrial
						</h1>

						<p className="mx-auto max-w-xl text-pretty text-sm text-slate-600 sm:text-base">
							Inicia sesion con tu cuenta de Google para crear equipos privados, visualizar
							cronogramas y tomar decisiones con herramientas de manufactura avanzada.
						</p>

						<div className="flex justify-center">
							<LoginButton />
						</div>
					</div>
				) : (
					<div className="space-y-6 text-center">
						<span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
							Sesion iniciada
						</span>

						<div className="flex justify-center">
							<div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg ring-2 ring-slate-200">
								{user.photoURL ? (
									<Image
										src={user.photoURL}
										alt="Foto de perfil"
										fill
										sizes="96px"
										className="object-cover"
										unoptimized
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-slate-200 text-2xl font-bold text-slate-700">
										{(user.displayName || user.email || "U").charAt(0).toUpperCase()}
									</div>
								)}
							</div>
						</div>

						<h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
							Bienvenido, {user.displayName || "Usuario"}
						</h1>

						<p className="text-sm text-slate-600 sm:text-base">
							Tu espacio de trabajo esta listo. Continua al panel principal para gestionar
							equipos, planes y analisis.
						</p>

						<div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
							<Link
								href="/dashboard"
								className="inline-flex min-w-52 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
							>
								Entrar al Dashboard
							</Link>

							<button
								type="button"
								onClick={logout}
								className="inline-flex min-w-52 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
							>
								Cerrar Sesion
							</button>
						</div>
					</div>
				)}
			</section>
		</main>
	);
}
