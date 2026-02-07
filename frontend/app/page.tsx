import Header from "./components/Header";
import { API_BASED_URL } from "../lib/api";

type EventItem = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  capacity: number;
  status: string;
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

async function getEvents(): Promise<{ events: EventItem[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASED_URL}/events`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Impossible de charger les événements");
    }
    const data = await res.json();
    return { events: Array.isArray(data) ? data : [] };
  } catch (e: unknown) {
    return {
      events: [],
      error: e instanceof Error ? e.message : "Erreur lors du chargement des événements",
    };
  }
}

function EventsSection({
  events,
  error,
}: {
  events: EventItem[];
  error?: string;
}) {
  if (error) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="py-16" id="events">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-[var(--color-muted)]">
            Aucun événement à venir pour le moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16" id="events">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            Prochains événements
          </h2>
          <p className="mt-3 text-[var(--color-muted)]">
            Explorez notre sélection d&apos;événements à venir
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <a
              key={event._id}
              href={`/events/${event._id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex h-32 items-center justify-between bg-[#f4efe7] px-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                    {event.location || "Lieu à confirmer"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                    {formatDate(event.date)}
                  </p>
                </div>
                <span className="badge badge--accent">{event.capacity} places</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)]">
                  {event.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">
                  {event.description || "Aucune description disponible."}
                </p>
                <div className="mt-auto pt-4 text-sm font-medium text-[var(--color-ink)]">
                  Voir les détails →
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const { events, error } = await getEvents();

  return (
    <div className="app-shell">
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/80 px-4 py-1.5 text-sm font-medium text-[var(--color-muted)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]"></span>
                  Plateforme de réservation d&apos;événements
                </div>
                <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--color-ink)] sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
                  BeInEvent
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]">
                  Découvrez et réservez votre place aux prochains événements :
                  formations, ateliers, conférences et bien plus encore.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#events"
                    className="rounded-xl bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                  >
                    Voir les événements
                  </a>
                  <a
                    href="/register"
                    className="rounded-xl border border-[var(--color-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[#f3eee6]"
                  >
                    Créer un compte
                  </a>
                </div>
              </div>
              <div className="glass rounded-3xl p-6">
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">À venir</p>
                    <p className="mt-2 text-lg font-semibold">Atelier UX Research</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">Mar 12 · Casablanca</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Bientôt complet</p>
                    <p className="mt-2 text-lg font-semibold">Conférence IA</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">Apr 02 · Rabat</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Nouveau</p>
                    <p className="mt-2 text-lg font-semibold">Formation NestJS</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">Apr 20 · Online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <EventsSection events={events} error={error} />
      </main>

      <footer className="border-t border-[var(--color-border)] bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-[var(--color-muted)]">
              © 2026 BeInEvent. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
              >
                À propos
              </a>
              <a
                href="#"
                className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
              >
                Contact
              </a>
              <a
                href="#"
                className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
              >
                Confidentialité
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
