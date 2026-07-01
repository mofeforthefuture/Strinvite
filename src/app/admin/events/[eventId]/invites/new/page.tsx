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

  const defaultExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <Link
            href={`/admin/events/${eventId}`}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            ← Back to event
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">New invite link</h1>
        </div>

        {sp.error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
            {sp.error}
          </p>
        )}

        <form className="space-y-4 rounded-xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <input type="hidden" name="eventId" value={eventId} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Label (optional)
            </label>
            <input
              name="label"
              type="text"
              placeholder="e.g. VIP table, Friends & family"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Max guests *
            </label>
            <input
              name="max_guests"
              type="number"
              min={1}
              max={500}
              required
              defaultValue={1}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-slate-500">
              The person who RSVPs can include up to this many people in their party.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Note for guests (optional)
            </label>
            <input
              name="note"
              type="text"
              placeholder="e.g. Couples only, VIP access"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-slate-500">
              This will be shown on the RSVP page.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Invite expires at *
            </label>
            <input
              name="expires_at"
              type="datetime-local"
              required
              defaultValue={defaultExpiry}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <SubmitButton action={createInvite} />
        </form>
      </div>
    </main>
  );
}
