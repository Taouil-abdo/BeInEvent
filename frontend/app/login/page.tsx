"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../hooks";
import { setCredentials } from "../authSlice";
import { API_BASED_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("john@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASED_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Login failed");
      }
      dispatch(setCredentials(body));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "auth",
          JSON.stringify({
            user: body.user,
            accessToken: body.access_token,
            refreshToken: body.refresh_token,
          }),
        );
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex items-center justify-center px-4 py-16">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
          Bienvenue
        </p>
        <h1
          className="mt-2 text-3xl font-semibold text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Connexion
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Accédez à votre espace pour gérer vos réservations.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-muted)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] shadow-sm focus:border-[var(--color-ink)] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-muted)]">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] shadow-sm focus:border-[var(--color-ink)] focus:outline-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Pas de compte ?{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="font-semibold text-[var(--color-ink)] underline underline-offset-4"
          >
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  );
}
