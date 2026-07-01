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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <Link href="/admin/events" className="text-sm text-indigo-600 hover:underline">
            ← Back to events
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">New Event</h1>
        </div>

        {params.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {params.error}
          </p>
        )}

        <form className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Event name *
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              RSVP headline (optional)
            </label>
            <input
              name="tagline"
              type="text"
              placeholder="e.g. RSVP for E&M Imogu 30th Anniversary"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Shown at the top of the RSVP page before the form.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date & time
            </label>
            <input
              name="event_date"
              type="datetime-local"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Venue
            </label>
            <input
              name="venue"
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
