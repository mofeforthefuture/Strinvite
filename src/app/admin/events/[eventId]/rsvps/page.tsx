import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function RsvpsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  // Load RSVPs with their individual tickets
  const { data: rsvps } = await supabase
    .from("rsvps")
    .select(
      "id, lead_name, email, phone, party_size, confirmation_code, created_at, invites(label, slug), tickets(id, name, confirmation_code, checked_in, checked_in_at)"
    )
    .eq("invites.event_id", eventId)
    .order("created_at", { ascending: false });

  type TicketRow = {
    id: string;
    name: string;
    confirmation_code: string;
    checked_in: boolean;
    checked_in_at: string | null;
  };

  type RsvpRow = {
    id: string;
    lead_name: string;
    email: string | null;
    phone: string | null;
    party_size: number;
    confirmation_code: string;
    created_at: string;
    invites: { label: string | null; slug: string } | null;
    tickets: TicketRow[];
  };

  const rows = (rsvps ?? []) as unknown as RsvpRow[];
  const totalTickets = rows.flatMap((r) => r.tickets ?? []);
  const checkedInCount = totalTickets.filter((t) => t.checked_in).length;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Link
              href={`/admin/events/${eventId}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              ← Back to event
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              RSVPs — {event.name}
            </h1>
            <p className="text-sm text-gray-500">
              {checkedInCount} / {totalTickets.length} tickets checked in ·{" "}
              {rows.length} RSVPs
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/export/${eventId}?filter=in`}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Download checked in
            </a>
            <a
              href={`/api/export/${eventId}?filter=out`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Download yet to arrive
            </a>
          </div>
        </div>

        {!rows.length ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No RSVPs yet.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((rsvp) => (
              <div key={rsvp.id} className="rounded-xl bg-white shadow-sm overflow-hidden">
                {/* RSVP header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                  <div>
                    <span className="font-semibold text-gray-900">{rsvp.lead_name}</span>
                    {rsvp.email && (
                      <span className="ml-2 text-sm text-gray-500">{rsvp.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{rsvp.invites?.label ?? rsvp.invites?.slug ?? "—"}</span>
                    <span>{new Date(rsvp.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Individual tickets */}
                <div className="divide-y divide-gray-50">
                  {(rsvp.tickets ?? []).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between px-5 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            ticket.checked_in ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <span className="text-sm text-gray-800">{ticket.name}</span>
                        <span className="font-mono text-xs text-gray-400">
                          {ticket.confirmation_code}
                        </span>
                      </div>
                      {ticket.checked_in ? (
                        <span className="text-xs text-green-600">
                          In ·{" "}
                          {ticket.checked_in_at &&
                            new Date(ticket.checked_in_at).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not arrived</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
