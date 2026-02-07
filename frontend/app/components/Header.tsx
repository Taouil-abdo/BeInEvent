"use client";

import Link from "next/link";
import { useAppDispatch, useAppSelector } from "../hooks";
import { clearCredentials } from "../authSlice";

export default function Header() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(clearCredentials());
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("auth");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white/75 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-ink)] text-sm font-semibold text-white">
            BE
          </span>
          <span
            className="text-lg font-semibold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            BeInEvent
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-ink)] sm:flex">
                {user.name}
                <span className="rounded-full bg-[#f3eee6] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                  {user.role}
                </span>
              </span>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[#f3eee6]"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/reservations"
                className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[#f3eee6]"
              >
                Mes réservations
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-[var(--color-ink)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[#f3eee6]"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[var(--color-ink)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                S&apos;inscrire
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
