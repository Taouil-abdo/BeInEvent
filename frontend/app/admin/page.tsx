"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASED_URL } from "../../lib/api";
import { authFetch, getAuth } from "../../lib/apiClient";
import { useRequireAuth } from "../../lib/requireAuth";

type EventItem = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  capacity: number;
  status: "DRAFT" | "PUBLISHED" | "CANCELED";
};

type ReservationItem = {
  _id: string;
  status: "PENDING" | "CONFIRMED" | "REFUSED" | "CANCELED";
  event?: { _id: string; title?: string };
  participant?: { _id: string; name?: string; email?: string };
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCapacity, setEditCapacity] = useState(10);

  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [reservationEventId, setReservationEventId] = useState("");
  const [reservationUserId, setReservationUserId] = useState("");
  const [reservationsError, setReservationsError] = useState<string | null>(
    null,
  );
  const [loadingReservations, setLoadingReservations] = useState(false);

  useRequireAuth("admin");

  useEffect(() => {
    const auth = getAuth();
    if (auth?.accessToken && auth.user?.role === "admin") {
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    setLoadingEvents(true);
    setEventsError(null);
    authFetch(`${API_BASED_URL}/events/admin`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEventsError("Impossible de charger les événements"))
      .finally(() => setLoadingEvents(false));
  }, [ready]);

  const createEvent = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEventsError(null);
    try {
      const res = await authFetch(`${API_BASED_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          date,
          location: location || undefined,
          capacity: Number(capacity),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Impossible de créer l'événement");
      }
      setEvents((prev) => [body, ...prev]);
      setTitle("");
      setDescription("");
      setDate("");
      setLocation("");
      setCapacity(10);
    } catch (err: any) {
      setEventsError(err.message || "Impossible de créer l'événement");
    } finally {
      setSaving(false);
    }
  };

  const updateEventStatus = async (id: string, action: "publish" | "cancel") => {
    setEventsError(null);
    const res = await authFetch(`${API_BASED_URL}/events/${id}/${action}`, {
      method: "PATCH",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEventsError(body.message || "Impossible de mettre à jour le statut");
      return;
    }
    setEvents((prev) => prev.map((e) => (e._id === id ? body : e)));
  };

  const deleteEvent = async (id: string) => {
    setEventsError(null);
    const res = await authFetch(`${API_BASED_URL}/events/${id}`, {
      method: "DELETE",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEventsError(body.message || "Impossible de supprimer l'événement");
      return;
    }
    setEvents((prev) => prev.filter((e) => e._id !== id));
  };

  const startEdit = (event: EventItem) => {
    setEditingId(event._id);
    setEditTitle(event.title);
    setEditDescription(event.description || "");
    setEditDate(event.date ? event.date.slice(0, 16) : "");
    setEditLocation(event.location || "");
    setEditCapacity(event.capacity);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    setEventsError(null);
    const res = await authFetch(`${API_BASED_URL}/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription || undefined,
        date: editDate,
        location: editLocation || undefined,
        capacity: Number(editCapacity),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEventsError(body.message || "Impossible de mettre à jour l'événement");
      return;
    }
    setEvents((prev) => prev.map((e) => (e._id === id ? body : e)));
    setEditingId(null);
  };

  const loadReservationsByEvent = async (eventId: string) => {
    if (!eventId) return;
    setLoadingReservations(true);
    setReservationsError(null);
    const res = await authFetch(
      `${API_BASED_URL}/reservations/by-event/${eventId}`,
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setReservationsError(body.message || "Impossible de charger");
      setLoadingReservations(false);
      return;
    }
    setReservations(Array.isArray(body) ? body : []);
    setLoadingReservations(false);
  };

  const loadReservationsByParticipant = async (userId: string) => {
    if (!userId) return;
    setLoadingReservations(true);
    setReservationsError(null);
    const res = await authFetch(
      `${API_BASED_URL}/reservations/by-participant/${userId}`,
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setReservationsError(body.message || "Impossible de charger");
      setLoadingReservations(false);
      return;
    }
    setReservations(Array.isArray(body) ? body : []);
    setLoadingReservations(false);
  };

  const updateReservationStatus = async (
    id: string,
    status: "CONFIRMED" | "REFUSED" | "CANCELED",
  ) => {
    setReservationsError(null);
    const res = await authFetch(
      `${API_BASED_URL}/reservations/${id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setReservationsError(body.message || "Impossible de mettre à jour");
      return;
    }
    setReservations((prev) => prev.map((r) => (r._id === id ? body : r)));
  };

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-sm text-[var(--color-muted)]">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Espace admin
            </p>
            <h1
              className="mt-2 text-3xl font-semibold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pilotage des événements
            </h1>
          </div>
          <span className="badge badge--accent">Admin</span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass rounded-3xl p-6">
            <h2
              className="text-xl font-semibold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Créer un événement
            </h2>
            <form onSubmit={createEvent} className="mt-4 grid gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre"
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optionnel)"
                rows={3}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
              />
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Lieu (optionnel)"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
              />
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                placeholder="Capacité"
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
              />
              {eventsError && (
                <p className="text-sm text-red-600">{eventsError}</p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="w-fit rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Créer"}
              </button>
            </form>

            <div className="mt-6 grid gap-3">
              {loadingEvents && (
                <p className="text-sm text-[var(--color-muted)]">
                  Chargement...
                </p>
              )}
              {!loadingEvents && events.length === 0 && (
                <p className="text-sm text-[var(--color-muted)]">
                  Aucun événement pour le moment.
                </p>
              )}
              {events.map((event) => (
                <div key={event._id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  {editingId === event._id ? (
                    <div className="grid gap-3">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
                      />
                      <input
                        type="datetime-local"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
                      />
                      <input
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
                      />
                      <input
                        type="number"
                        min={1}
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(Number(e.target.value))}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(event._id)}
                          className="rounded-xl bg-[var(--color-ink)] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Sauvegarder
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          {event.title}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {event.status}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(event)}
                          className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => updateEventStatus(event._id, "publish")}
                          disabled={event.status !== "DRAFT"}
                          className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-50"
                        >
                          Publier
                        </button>
                        <button
                          type="button"
                          onClick={() => updateEventStatus(event._id, "cancel")}
                          disabled={event.status === "CANCELED"}
                          className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-50"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEvent(event._id)}
                          className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="glass rounded-3xl p-6">
            <h2
              className="text-xl font-semibold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Réservations
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={reservationEventId}
                  onChange={(e) => setReservationEventId(e.target.value)}
                  placeholder="ID événement"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
                />
                <button
                  type="button"
                  onClick={() => loadReservationsByEvent(reservationEventId)}
                  className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Charger
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={reservationUserId}
                  onChange={(e) => setReservationUserId(e.target.value)}
                  placeholder="ID participant"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)]"
                />
                <button
                  type="button"
                  onClick={() => loadReservationsByParticipant(reservationUserId)}
                  className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Charger
                </button>
              </div>
              {reservationsError && (
                <p className="text-sm text-red-600">{reservationsError}</p>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              {loadingReservations && (
                <p className="text-sm text-[var(--color-muted)]">
                  Chargement...
                </p>
              )}
              {!loadingReservations && reservations.length === 0 && (
                <p className="text-sm text-[var(--color-muted)]">
                  Aucune réservation chargée.
                </p>
              )}
              {reservations.map((r) => (
                <div
                  key={r._id}
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
                >
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {r.event?.title || "Événement"} · {r._id}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Statut: {r.status}
                  </p>
                  {r.participant?.email && (
                    <p className="text-xs text-[var(--color-muted)]">
                      Participant: {r.participant.name} ({r.participant.email})
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateReservationStatus(r._id, "CONFIRMED")}
                      disabled={r.status !== "PENDING"}
                      className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-50"
                    >
                      Confirmer
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReservationStatus(r._id, "REFUSED")}
                      disabled={r.status !== "PENDING"}
                      className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-50"
                    >
                      Refuser
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReservationStatus(r._id, "CANCELED")}
                      disabled={
                        r.status !== "PENDING" && r.status !== "CONFIRMED"
                      }
                      className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
