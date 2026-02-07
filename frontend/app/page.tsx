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
  } catch (e: any) {
    return {
      events: [],
      error: e?.message || "Erreur lors du chargement des événements",
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
          <p className="text-center text-zinc-500 dark:text-zinc-400">
            Aucun événement à venir pour le moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16" id="events">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Prochains événements
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <a
              key={event._id}
              href={`/events/${event._id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
                <span className="text-4xl font-bold text-zinc-300 dark:text-zinc-500">
                  {event.title.charAt(0)}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="mb-1 font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-white dark:group-hover:text-zinc-200">
                  {event.title}
                </h3>
                <p className="mb-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {event.description || "Aucune description."}
                </p>
                <p className="mt-auto text-xs text-zinc-500 dark:text-zinc-500">
                  {formatDate(event.date)}
                  {event.location && ` · ${event.location}`}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {event.capacity} place{event.capacity > 1 ? "s" : ""}
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Voir l&apos;événement →
                </span>
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-b from-white to-zinc-50 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
              BeInEvent
            </h1>
            <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
              Découvrez et réservez votre place aux prochains événements :
              formations, ateliers, conférences et plus encore.
            </p>
            <a
              href="#events"
              className="mt-8 inline-block rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Voir les événements
            </a>
          </div>
        </section>

        {/* Liste des événements (SSR) */}
        <EventsSection events={events} error={error} />
      </main>
    </div>
  );
}
