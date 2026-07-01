import { createClient } from "@/lib/supabase/server";
import { submitRsvp } from "./actions";
import RsvpForm from "./RsvpForm";

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("id, label, note, max_guests, expires_at, is_active, events(name, tagline, event_date, venue)")
    .eq("slug", slug)
    .maybeSingle();

  if (!invite) {
    return <ErrorScreen message="Invite link not found." />;
  }

  const expired = new Date(invite.expires_at) < new Date();
  if (!invite.is_active || expired) {
    return (
      <ErrorScreen
        message={expired ? "This invite has expired." : "This invite is no longer active."}
      />
    );
  }

  const { data: existing } = await supabase
    .from("rsvps")
    .select("party_size")
    .eq("invite_id", invite.id);

  const used = (existing ?? []).reduce((s, r) => s + r.party_size, 0);
  const remaining = invite.max_guests - used;

  if (remaining <= 0) {
    return <ErrorScreen message="This invite is fully booked." />;
  }

  const event = invite.events as unknown as {
    name: string;
    tagline: string | null;
    event_date: string | null;
    venue: string | null;
  } | null;

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          {event?.tagline && (
            <p className="mb-2 text-lg font-semibold text-indigo-400">
              {event.tagline}
            </p>
          )}
          <h1 className="text-3xl font-bold text-slate-100">
            {event?.name ?? "You're invited"}
          </h1>
          {(event?.event_date || event?.venue) && (
            <p className="mt-1 text-slate-400">
              {event.venue && `${event.venue}`}
              {event.event_date && event.venue && " · "}
              {event.event_date && new Date(event.event_date).toLocaleString()}
            </p>
          )}
          {invite.note && (
            <p className="mt-3 rounded-lg bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300 ring-1 ring-indigo-500/20">
              {invite.note}
            </p>
          )}
          <p className="mt-3 text-sm text-slate-500">
            {remaining} spot{remaining === 1 ? "" : "s"} remaining
          </p>
        </div>

        {sp.error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20">
            {sp.error}
          </p>
        )}

        <RsvpForm slug={slug} maxGuests={remaining} submitAction={submitRsvp} />
      </div>
    </main>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="rounded-2xl bg-slate-900 p-10 text-center ring-1 ring-slate-800 shadow-2xl">
        <p className="text-2xl">🚫</p>
        <p className="mt-3 text-lg font-medium text-slate-200">{message}</p>
      </div>
    </main>
  );
}
