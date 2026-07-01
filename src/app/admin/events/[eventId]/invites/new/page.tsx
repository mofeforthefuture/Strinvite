import { createInvite } from "./actions";
import Link from "next/link";
import { SubmitButton } from "./SubmitButton";

export default async function NewInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;

  // Default expiry: 7 days from now, local time
  const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <Link
            href={`/admin/events/${eventId}`}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Back to event
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">New invite link</h1>
        </div>

        {sp.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {sp.error}
          </p>
        )}

        <form className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <input type="hidden" name="eventId" value={eventId} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Label (optional)
            </label>
            <input
              name="label"
              type="text"
              placeholder="e.g. VIP table, Friends & family"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Max guests *
            </label>
            <input
              name="max_guests"
              type="number"
              min={1}
              max={500}
              required
              defaultValue={1}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              The person who RSVPs can include up to this many people in their party.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Invite expires at *
            </label>
            <input
              name="expires_at"
              type="datetime-local"
              required
              defaultValue={defaultExpiry}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <SubmitButton action={createInvite} />
        </form>
      </div>
    </main>
  );
}
