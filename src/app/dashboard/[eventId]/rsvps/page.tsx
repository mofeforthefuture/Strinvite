import { requireStaffAccess } from "@/lib/staff";
import { notFound } from "next/navigation";
import Link from "next/link";
import LocalTime from "@/components/LocalTime";

export default async function StaffRsvpsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const { supabase } = await requireStaffAccess(eventId);

  const { data: event } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select(
      "id, lead_name, phone, party_size, confirmation_code, created_at, invites(label, slug), tickets(id, name, confirmation_code, checked_in, checked_in_at)"
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
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-100">
              RSVPs — {event.name}
            </h1>
            <p className="text-sm text-slate-400">
              {checkedInCount} / {totalTickets.length} tickets checked in ·{" "}
              {rows.length} RSVPs
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/export/${eventId}?filter=in`}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
            >
              Download checked in
            </a>
            <a
              href={`/api/export/${eventId}?filter=out`}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800 transition-colors"
            >
              Download yet to arrive
            </a>
          </div>
        </div>

        {!rows.length ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
            No RSVPs yet.
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((rsvp) => (
              <div key={rsvp.id} className="rounded-xl bg-slate-900 ring-1 ring-slate-800 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
                  <div>
                    <span className="font-semibold text-slate-100">{rsvp.lead_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{rsvp.invites?.label ?? rsvp.invites?.slug ?? "—"}</span>
                    <span>{new Date(rsvp.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/50">
                  {(rsvp.tickets ?? []).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between px-5 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            ticket.checked_in ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "bg-slate-600"
                          }`}
                        />
                        <span className="text-sm text-slate-200">{ticket.name}</span>
                        <span className="font-mono text-xs text-slate-600">
                          {ticket.confirmation_code}
                        </span>
                      </div>
                      {ticket.checked_in ? (
                        <span className="text-xs text-emerald-400">
                          In · <LocalTime iso={ticket.checked_in_at} />
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">Not arrived</span>
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
