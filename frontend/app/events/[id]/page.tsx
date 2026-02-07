import { API_BASED_URL } from "../../../lib/api";
import Link from "next/link";
import ReservationActions from "./ReservationActions";

type EventItem = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  capacity: number;
  status: string;
  createdBy?: { name?: string; email?: string };
};

function formatDate(dateStr: string) {
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

async function getEvent(
  id: string,
): Promise<{ event?: EventItem; error?: string }> {
  try {
    const res = await fetch(`${API_BASED_URL}/events/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Unable to load event");
    }
    const data = await res.json();
    return { event: data };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Error while loading event" };
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { event, error } = await getEvent(id);

  if (error) {
    return (
      <div className="app-shell">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="glass rounded-3xl p-10 text-center">
            <p className="text-lg font-semibold text-[var(--color-ink)]">
              {error}
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#f3eee6]"
              >
                Retour aux événements
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="app-shell">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="glass rounded-3xl p-10 text-center">
            <p className="text-lg font-semibold text-[var(--color-ink)]">
              Événement introuvable.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#f3eee6]"
              >
                Retour aux événements
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ← Retour aux événements
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass rounded-3xl p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge badge--accent">
                {event.capacity} places
              </span>
              <span
                className={`badge ${
                  event.status === "PUBLISHED"
                    ? "badge--ok"
                    : event.status === "DRAFT"
                      ? "badge--warn"
                      : "badge--danger"
                }`}
              >
                {event.status}
              </span>
            </div>
            <h1
              className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {event.title}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {formatDate(event.date)}
              {event.location ? ` · ${event.location}` : ""}
            </p>
            <p className="mt-6 text-base leading-relaxed text-[var(--color-muted)]">
              {event.description || "Aucune description pour cet événement."}
            </p>
            {event.createdBy?.name && (
              <p className="mt-6 text-sm text-[var(--color-muted)]">
                Organisé par {event.createdBy.name}
              </p>
            )}
          </div>

          <div>
            <ReservationActions eventId={event._id} eventStatus={event.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
