"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginButton() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async () => {
    try {
      setErrorMessage("");
      setIsSubmitting(true);
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage("No fue posible iniciar sesion con Google.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      setErrorMessage("");
      setIsSubmitting(true);
      await logout();
    } catch (error) {
      setErrorMessage("No fue posible cerrar sesion.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
      >
        Cargando sesion...
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {user ? (
        <>
          <p className="text-sm text-slate-700">
            Sesion activa: <span className="font-semibold">{user.displayName || user.email}</span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Cerrando sesion..." : "Cerrar sesion"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Conectando..." : "Continuar con Google"}
        </button>
      )}

      {errorMessage ? (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
