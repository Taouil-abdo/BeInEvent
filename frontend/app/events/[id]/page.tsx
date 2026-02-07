import Link from "next/link";
import { API_BASED_URL } from "../../../lib/api";
import Header from "../../components/Header";

type EventDetail = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  capacity: number;
  status: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getEvent(id: string): Promise<EventDetail | null> {
  try {
    const res = await fetch(`${API_BASED_URL}/events/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-16">
          <p className="text-zinc-600 dark:text-zinc-400">
            Événement introuvable.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-white"
          >
            Retour à l&apos;accueil
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:underline"
        >
          ← Retour aux événements
        </Link>
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
            {event.title}
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            {formatDate(event.date)}
            {event.location && ` · ${event.location}`}
          </p>
          <p className="mt-4 text-zinc-600 dark:text-zinc-300">
            {event.description || "Aucune description."}
          </p>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            {event.capacity} place{event.capacity > 1 ? "s" : ""} disponibles
          </p>
        </article>
      </main>
    </div>
  );
}
