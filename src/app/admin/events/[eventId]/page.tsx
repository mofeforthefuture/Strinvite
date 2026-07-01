import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { toggleScanning, deactivateInvite, addStaff, removeStaff } from "./actions";
import DeleteEventButton from "./DeleteEventButton";
import CopyButton from "./CopyButton";
import ActionButton from "@/components/ActionButton";

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

        {sp.error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
            {sp.error}
          </p>
        )}

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

          {!invites?.length ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
              No invite links yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {invites.map((invite) => {
                const used = usedCapacity(invite.id);
                const expired = new Date(invite.expires_at) < new Date();
                const full = used >= invite.max_guests;
                const dead = !invite.is_active || expired || full;

                return (
                  <li
                    key={invite.id}
                    className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-100 truncate">
                          {invite.label || "Invite link"}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="text-xs text-slate-500 truncate">
                            {siteUrl}/rsvp/{invite.slug}
                          </p>
                          <CopyButton
                            tagline={event.tagline}
                            venue={event.venue}
                            eventDate={event.event_date}
                            link={`${siteUrl}/rsvp/${invite.slug}`}
                          />
                        </div>
                        <div className="mt-1 flex gap-3 text-xs text-slate-500">
                          <span>
                            {used} / {invite.max_guests} guests
                          </span>
                          <span>
                            Expires{" "}
                            {new Date(invite.expires_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            dead
                              ? "bg-slate-800 text-slate-500"
                              : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                          }`}
                        >
                          {!invite.is_active
                            ? "Deactivated"
                            : expired
                            ? "Expired"
                            : full
                            ? "Full"
                            : "Active"}
                        </span>
                        {invite.is_active && (
                          <form>
                            <input type="hidden" name="inviteId" value={invite.id} />
                            <input type="hidden" name="eventId" value={eventId} />
                            <ActionButton
                              action={deactivateInvite}
                              variant="link-danger"
                              loadingText="Deactivating"
                              style="dots"
                            >
                              Deactivate
                            </ActionButton>
                          </form>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Staff */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-100">Staff</h2>
          <div className="rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800 space-y-4">
            <p className="text-sm text-slate-400">
              Staff members can scan tickets and view/download RSVP lists for this event.
            </p>
            <form className="flex gap-2">
              <input type="hidden" name="eventId" value={eventId} />
              <input
                name="email"
                type="email"
                required
                placeholder="Staff member's email"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <ActionButton action={addStaff} loadingText="Adding" style="dots">
                Add
              </ActionButton>
            </form>
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
