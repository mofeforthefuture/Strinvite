import { createEvent } from "./actions";
import Link from "next/link";
import ActionButton from "@/components/ActionButton";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <Link href="/admin/events" className="text-sm text-indigo-400 hover:text-indigo-300">
            ← Back to events
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">New Event</h1>
        </div>

        {params.error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
            {params.error}
          </p>
        )}

        <form className="space-y-4 rounded-xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Event name *
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              RSVP headline (optional)
            </label>
            <input
              name="tagline"
              type="text"
              placeholder="e.g. RSVP for E&M Imogu 30th Anniversary"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-slate-500">
              Shown at the top of the RSVP page before the form.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Date & time
            </label>
            <input
              name="event_date"
              type="datetime-local"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Venue
            </label>
            <input
              name="venue"
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <ActionButton action={createEvent} className="w-full" loadingText="Creating event" style="dots">
            Create event
          </ActionButton>
        </form>
      </div>
    </main>
  );
}
