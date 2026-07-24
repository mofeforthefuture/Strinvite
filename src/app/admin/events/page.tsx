import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import ActionButton from "@/components/ActionButton";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, venue, scanning_enabled")
    .order("event_date", { ascending: true });

  const eventIds = events?.map((e) => e.id) ?? [];

  const { data: allInvites } = eventIds.length
    ? await supabase
        .from("invites")
        .select("id, event_id")
        .in("event_id", eventIds)
    : { data: [] as { id: string; event_id: string }[] };

  const inviteIds = allInvites?.map((i) => i.id) ?? [];

  const { data: allRsvps } = inviteIds.length
    ? await supabase
        .from("rsvps")
        .select("invite_id, party_size")
        .in("invite_id", inviteIds)
    : { data: [] as { invite_id: string; party_size: number }[] };

  const inviteToEvent = new Map<string, string>();
  for (const inv of allInvites ?? []) {
    inviteToEvent.set(inv.id, inv.event_id);
  }

  const eventStats = new Map<string, { inviteCount: number; expectedGuests: number }>();
  for (const e of events ?? []) {
    const inviteCount = (allInvites ?? []).filter((i) => i.event_id === e.id).length;
    const expectedGuests = (allRsvps ?? [])
      .filter((r) => inviteToEvent.get(r.invite_id) === e.id)
      .reduce((sum, r) => sum + r.party_size, 0);
    eventStats.set(e.id, { inviteCount, expectedGuests });
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Events</h1>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/events/new"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              + New event
            </Link>
            <form>
              <ActionButton action={signOut} variant="outline" loadingText="Signing out" style="dots">
                Sign out
              </ActionButton>
            </form>
          </div>
        </div>

        {!events?.length ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
            No events yet. Create your first one.
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/admin/events/${event.id}`}
                  className="flex items-center justify-between rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800 hover:ring-slate-700 transition-all"
                >
                  <div>
                    <p className="font-semibold text-slate-100">{event.name}</p>
                    <p className="text-sm text-slate-400">
                      {event.venue && `${event.venue} · `}
                      {event.event_date
                        ? new Date(event.event_date).toLocaleString()
                        : "No date set"}
                    </p>
                    {(() => {
                      const stats = eventStats.get(event.id);
                      return (
                        <p className="mt-1 text-xs text-slate-500">
                          {stats?.inviteCount ?? 0} invite{(stats?.inviteCount ?? 0) !== 1 ? "s" : ""} sent
                          {" · "}
                          {stats?.expectedGuests ?? 0} expected guest{(stats?.expectedGuests ?? 0) !== 1 ? "s" : ""}
                        </p>
                      );
                    })()}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      event.scanning_enabled
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20"
                    }`}
                  >
                    {event.scanning_enabled ? "Scanning on" : "Scanning off"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
