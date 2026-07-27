import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { updateEvent, toggleScanning, addStaff, removeStaff, createStaffAccount } from "./actions";
import DeleteEventButton from "./DeleteEventButton";
import ActionButton from "@/components/ActionButton";
import InvitesList from "./InvitesList";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const { data: invites } = await supabase
    .from("invites")
    .select("id, label, max_guests, expires_at, slug, is_active, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const inviteIds = invites?.map((i) => i.id) ?? [];
  const { data: rsvpCounts } = inviteIds.length
    ? await supabase
        .from("rsvps")
        .select("invite_id, party_size")
        .in("invite_id", inviteIds)
    : { data: [] };

  const usedCapacity = (inviteId: string) =>
    (rsvpCounts ?? [])
      .filter((r) => r.invite_id === inviteId)
      .reduce((sum, r) => sum + r.party_size, 0);

  const invitesWithStatus = (invites ?? []).map((invite) => {
    const used = usedCapacity(invite.id);
    const expired = new Date(invite.expires_at) < new Date();
    const full = used >= invite.max_guests;
    const dead = !invite.is_active || expired || full;
    const status: "Active" | "Expired" | "Full" | "Deactivated" = !invite.is_active
      ? "Deactivated"
      : expired
      ? "Expired"
      : full
      ? "Full"
      : "Active";
    return { ...invite, used, expired, full, dead, status };
  });

  const { data: staff } = await supabase
    .from("event_staff")
    .select("id, email")
    .eq("event_id", eventId);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/admin/events" className="text-sm text-indigo-400 hover:text-indigo-300">
              ← All events
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-100">{event.name}</h1>
            <p className="text-sm text-slate-400">
              {event.venue && `${event.venue} · `}
              {event.event_date
                ? new Date(event.event_date).toLocaleString()
                : "No date set"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/events/${eventId}/scan`}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-slate-700 hover:bg-slate-700 transition-colors"
            >
              Scanner
            </Link>
            <Link
              href={`/admin/events/${eventId}/rsvps`}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800 transition-colors"
            >
              RSVPs
            </Link>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <p className="text-sm font-medium text-slate-400">Invites sent</p>
            <p className="mt-1 text-2xl font-bold text-slate-100">{invitesWithStatus.length}</p>
          </div>
          <div className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
            <p className="text-sm font-medium text-slate-400">Expected guests</p>
            <p className="mt-1 text-2xl font-bold text-slate-100">
              {(rsvpCounts ?? []).reduce((sum, r) => sum + r.party_size, 0)}
            </p>
          </div>
        </div>

        {sp.error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
            {sp.error}
          </p>
        )}

        {/* Edit event details */}
        <div className="rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Event details</h2>
          <form className="space-y-4">
            <input type="hidden" name="eventId" value={eventId} />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Event name *
              </label>
              <input
                name="name"
                type="text"
                required
                defaultValue={event.name}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                RSVP headline
              </label>
              <input
                name="tagline"
                type="text"
                defaultValue={event.tagline ?? ""}
                placeholder="e.g. RSVP for E&M Imogu 30th Anniversary"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Date & time
              </label>
              <input
                name="event_date"
                type="datetime-local"
                defaultValue={event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : ""}
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
                defaultValue={event.venue ?? ""}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Contact phone number
              </label>
              <input
                name="phone"
                type="tel"
                defaultValue={event.phone ?? ""}
                placeholder="e.g. +1 (555) 123-4567"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-slate-500">
                Guests can reach out to this number for enquiries.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Dress code
              </label>
              <select
                name="dress_code"
                defaultValue={event.dress_code ?? ""}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">-- Select dress code --</option>
                <option value="Formal">Formal</option>
                <option value="Semi-Formal">Semi-Formal</option>
                <option value="Smart Casual">Smart Casual</option>
                <option value="Casual">Casual</option>
                <option value="Traditional">Traditional</option>
                <option value="Black Tie">Black Tie</option>
                <option value="Cocktail">Cocktail</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Dress color for guests
              </label>
              <input
                name="dress_color"
                type="text"
                defaultValue={event.dress_color ?? ""}
                placeholder="e.g. White, Yellow, Red and Black"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-slate-500">
                The recommended color(s) guests should wear.
              </p>
            </div>
            <ActionButton action={updateEvent} loadingText="Saving" style="dots">
              Save changes
            </ActionButton>
          </form>
        </div>

        {/* Scanning toggle */}
        <div className="flex items-center justify-between rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <div>
            <p className="font-medium text-slate-100">Door scanning</p>
            <p className="text-sm text-slate-400">
              {event.scanning_enabled
                ? "Ushers can currently scan tickets"
                : "Scanning is paused — ushers will see an error when scanning"}
            </p>
          </div>
          <form>
            <input type="hidden" name="eventId" value={eventId} />
            <ActionButton
              action={toggleScanning.bind(null, eventId, event.scanning_enabled)}
              variant={event.scanning_enabled ? "warning" : "ghost"}
              loadingText="Updating"
              style="dots"
              className={
                event.scanning_enabled
                  ? "!bg-yellow-500/10 !text-yellow-400 ring-1 ring-yellow-500/20 hover:!bg-yellow-500/20"
                  : "!bg-emerald-500/10 !text-emerald-400 ring-1 ring-emerald-500/20 hover:!bg-emerald-500/20"
              }
            >
              {event.scanning_enabled ? "Pause scanning" : "Resume scanning"}
            </ActionButton>
          </form>
        </div>

        {/* Invites */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Invite links</h2>
            <Link
              href={`/admin/events/${eventId}/invites/new`}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              + New invite
            </Link>
          </div>

          <InvitesList
            eventId={eventId}
            siteUrl={siteUrl}
            event={{ tagline: event.tagline, venue: event.venue, event_date: event.event_date }}
            invites={invitesWithStatus}
          />
        </div>

        {/* Staff */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Staff</h2>
          <div className="rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800 space-y-5">
            <p className="text-sm text-slate-400">
              Staff members can scan tickets and view/download RSVP lists for this event.
            </p>

            {/* Create new staff account */}
            <div className="rounded-lg bg-slate-800/50 p-4 ring-1 ring-slate-700">
              <p className="mb-3 text-sm font-medium text-slate-200">Create staff account</p>
              <p className="mb-3 text-xs text-slate-500">
                Create an account for a new staff member. They can log in with the email and password you set.
              </p>
              <form className="space-y-2">
                <input type="hidden" name="eventId" value={eventId} />
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Full name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email address"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  name="password"
                  type="text"
                  required
                  minLength={6}
                  placeholder="Login password (min 6 characters)"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <ActionButton action={createStaffAccount} loadingText="Creating" style="dots">
                  Create &amp; add to event
                </ActionButton>
              </form>
            </div>

            {/* Add existing user as staff */}
            <div>
              <p className="mb-2 text-xs text-slate-500">Or add an existing account by email:</p>
              <form className="flex gap-2">
                <input type="hidden" name="eventId" value={eventId} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Existing user's email"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <ActionButton action={addStaff} loadingText="Adding" style="dots">
                  Add
                </ActionButton>
              </form>
            </div>

            {(staff ?? []).length > 0 && (
              <ul className="divide-y divide-slate-800">
                {(staff ?? []).map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-300">{s.email}</span>
                    <form>
                      <input type="hidden" name="staffId" value={s.id} />
                      <input type="hidden" name="eventId" value={eventId} />
                      <ActionButton
                        action={removeStaff}
                        variant="link-danger"
                        loadingText="Removing"
                        style="dots"
                      >
                        Remove
                      </ActionButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl bg-red-500/5 p-5 ring-1 ring-red-500/20">
          <p className="mb-3 text-sm font-medium text-red-400">Danger zone</p>
          <DeleteEventButton eventId={eventId} />
        </div>
      </div>
    </main>
  );
}
