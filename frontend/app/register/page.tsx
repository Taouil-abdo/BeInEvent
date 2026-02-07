"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "../hooks";
import { setCredentials } from "../authSlice";
import { API_BASED_URL } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASED_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Register failed");
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
          Nouveau compte
        </p>
        <h1
          className="mt-2 text-3xl font-semibold text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Créer un compte
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Rejoignez BeInEvent pour réserver vos prochaines places.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--color-muted)]">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] shadow-sm focus:border-[var(--color-ink)] focus:outline-none"
            />
          </div>
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
            {loading ? "Création..." : "Créer le compte"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Déjà un compte ?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-semibold text-[var(--color-ink)] underline underline-offset-4"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
