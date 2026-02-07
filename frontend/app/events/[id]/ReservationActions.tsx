"use client";

import { useEffect, useState } from "react";
import { API_BASED_URL } from "../../../lib/api";
import { authFetch, getAuth } from "../../../lib/apiClient";

type Reservation = {
  _id: string;
  status: "PENDING" | "CONFIRMED" | "REFUSED" | "CANCELED";
  event: { _id: string };
};

export default function ReservationActions({
  eventId,
  eventStatus,
}: {
  eventId: string;
  eventStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.accessToken) {
      setNeedsLogin(true);
      return;
    }

    authFetch(`${API_BASED_URL}/reservations/me`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Reservation[]) => {
        const found = list.find((r) => r.event?._id === eventId);
        if (found) setReservation(found);
      })
      .catch(() => {
        setError("Impossible de charger la réservation");
      });
  }, [eventId]);

  const reserve = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const auth = getAuth();
      if (!auth?.accessToken) {
        setError("Veuillez vous connecter");
        setNeedsLogin(true);
        return;
      }
      const res = await authFetch(`${API_BASED_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Réservation échouée");
      }
      setReservation(body);
      setMessage("Réservation créée");
    } catch (e: any) {
      setError(e?.message || "Réservation échouée");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    if (!reservation?._id) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const auth = getAuth();
      if (!auth?.accessToken) {
        setError("Veuillez vous connecter");
        setNeedsLogin(true);
        return;
      }
      const res = await authFetch(
        `${API_BASED_URL}/reservations/${reservation._id}/cancel`,
        { method: "PATCH" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Annulation échouée");
      }
      setReservation(body);
      setMessage("Réservation annulée");
    } catch (e: any) {
      setError(e?.message || "Annulation échouée");
    } finally {
      setLoading(false);
    }
  };

  const isPublished = eventStatus === "PUBLISHED";
  const canReserve =
    isPublished &&
    (!reservation ||
      reservation.status === "REFUSED" ||
      reservation.status === "CANCELED");

  return (
    <div className="glass rounded-3xl p-6">
      <h2
        className="text-xl font-semibold text-[var(--color-ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Réservation
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {reservation
          ? `Statut actuel : ${reservation.status}`
          : "Aucune réservation pour cet événement."}
      </p>
      {needsLogin && (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Connectez-vous pour réserver.{" "}
          <a
            className="font-semibold text-[var(--color-ink)] underline underline-offset-4"
            href="/login"
          >
            Se connecter
          </a>
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reserve}
          disabled={!canReserve || loading || needsLogin}
          className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Traitement..." : "Réserver"}
        </button>
        {reservation &&
          (reservation.status === "PENDING" ||
            reservation.status === "CONFIRMED") && (
            <button
              type="button"
              onClick={cancel}
              disabled={loading}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#f3eee6] disabled:opacity-60"
            >
              {loading ? "Traitement..." : "Annuler"}
            </button>
          )}
      </div>
      {!isPublished && (
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          Les réservations sont disponibles uniquement pour les événements publiés.
        </p>
      )}
    </div>
  );
}
