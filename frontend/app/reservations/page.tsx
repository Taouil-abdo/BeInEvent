"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASED_URL } from "../../lib/api";
import { authFetch, getAuth } from "../../lib/apiClient";
import { useRequireAuth } from "../../lib/requireAuth";

type Reservation = {
  _id: string;
  status: "PENDING" | "CONFIRMED" | "REFUSED" | "CANCELED";
  event?: {
    _id: string;
    title?: string;
    date?: string;
    location?: string;
  };
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const router = useRouter();

  useRequireAuth("participant");

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.accessToken) {
      router.push("/login");
      setLoading(false);
      return;
    }
    authFetch(`${API_BASED_URL}/reservations/me`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setReservations(Array.isArray(data) ? data : []))
      .catch(() => setError("Impossible de charger vos réservations"))
      .finally(() => setLoading(false));
  }, [router]);

  const downloadTicket = async (reservationId: string) => {
    setDownloadingId(reservationId);
    try {
      const auth = getAuth();
      if (!auth?.accessToken) {
        router.push("/login");
        return;
      }
      const res = await authFetch(
        `${API_BASED_URL}/reservations/${reservationId}/ticket`,
      );
      if (!res.ok) {
        throw new Error("Impossible de télécharger le ticket");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ticket-${reservationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Impossible de télécharger le ticket");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Espace participant
            </p>
            <h1
              className="mt-2 text-3xl font-semibold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Mes réservations
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#f3eee6]"
          >
            Voir les événements
          </Link>
        </div>

        {loading && (
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            Chargement...
          </p>
        )}
        {error && (
          <p className="mt-6 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && reservations.length === 0 && (
          <div className="glass mt-6 rounded-3xl p-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              Aucune réservation pour le moment.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {reservations.map((r) => (
            <div
              key={r._id}
              className="glass rounded-3xl p-6 transition hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    {r.event?.title || "Événement"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {formatDate(r.event?.date)}
                    {r.event?.location ? ` · ${r.event.location}` : ""}
                  </p>
                </div>
                <span
                  className={`badge ${
                    r.status === "CONFIRMED"
                      ? "badge--ok"
                      : r.status === "PENDING"
                        ? "badge--warn"
                        : r.status === "REFUSED"
                          ? "badge--danger"
                          : "badge--accent"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                {r.event?._id && (
                  <Link
                    href={`/events/${r.event._id}`}
                    className="text-sm font-semibold text-[var(--color-ink)] underline underline-offset-4"
                  >
                    Voir l&apos;événement
                  </Link>
                )}
                {r.status === "CONFIRMED" && (
                  <button
                    type="button"
                    onClick={() => downloadTicket(r._id)}
                    className="text-sm font-semibold text-[var(--color-ink)] underline underline-offset-4"
                  >
                    {downloadingId === r._id
                      ? "Téléchargement..."
                      : "Télécharger le ticket"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
