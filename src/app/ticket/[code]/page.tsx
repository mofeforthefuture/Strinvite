import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import TicketCard from "@/components/TicketCard";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: rsvp } = await supabase
    .from("rsvps")
    .select(
      "id, lead_name, party_size, created_at, invites(label, events(name, event_date, venue))"
    )
    .eq("confirmation_code", code.toUpperCase())
    .maybeSingle();

  if (!rsvp) notFound();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, name, confirmation_code")
    .eq("rsvp_id", rsvp.id)
    .order("created_at");

  const invite = rsvp.invites as unknown as {
    label: string | null;
    events: { name: string; event_date: string | null; venue: string | null } | null;
  } | null;

  const event = invite?.events;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p className="text-4xl">🎉</p>
          <h1 className="mt-2 text-xl font-bold text-slate-100 sm:text-2xl">You&apos;re all set!</h1>
          <p className="mt-1 text-sm text-slate-400 sm:text-base">
            {tickets?.length ?? rsvp.party_size} ticket
            {(tickets?.length ?? rsvp.party_size) !== 1 ? "s" : ""} generated for{" "}
            <span className="font-semibold text-slate-200">{event?.name ?? "your event"}</span>
          </p>
          {(event?.venue || event?.event_date) && (
            <div className="mt-2 space-y-0.5">
              {event.venue && (
                <p className="text-sm text-slate-300">{event.venue}</p>
              )}
              {event.event_date && (
                <p className="text-sm text-slate-300">
                  {new Date(event.event_date).toLocaleString()}
                </p>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Each person presents their own ticket at the door
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:flex-wrap sm:justify-center">
          {(tickets ?? []).map((ticket) => (
            <TicketCard
              key={ticket.id}
              name={ticket.name}
              confirmationCode={ticket.confirmation_code}
              eventName={event?.name ?? "Event"}
              eventDate={event?.event_date}
              venue={event?.venue}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Bookmark this page to access your tickets later
        </p>
      </div>
    </main>
  );
}
