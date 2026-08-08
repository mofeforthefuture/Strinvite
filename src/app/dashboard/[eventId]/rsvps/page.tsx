import { requireStaffAccess } from "@/lib/staff";
import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import RsvpList, { type RsvpListItem } from "@/components/RsvpList";

export default async function StaffRsvpsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  await requireStaffAccess(eventId);

  // Service client so inactive-invite RSVPs still show for staff
  const service = createServiceClient();

  const { data: event } = await service
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  const { data: rsvps } = await service
    .from("rsvps")
    .select(
      "id, lead_name, phone, party_size, confirmation_code, created_at, invites!inner(label, slug), tickets(id, name, confirmation_code, checked_in, checked_in_at)"
    )
    .eq("invites.event_id", eventId)
    .order("created_at", { ascending: false });

  const rows = (rsvps ?? []) as unknown as RsvpListItem[];
  const totalTickets = rows.flatMap((r) => r.tickets ?? []);
  const checkedInCount = totalTickets.filter((t) => t.checked_in).length;

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 space-y-3">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              ← Dashboard
            </Link>
            <h1 className="mt-1 text-xl font-bold text-slate-100 sm:text-2xl">
              RSVPs — {event.name}
            </h1>
            <p className="text-sm text-slate-400">
              {checkedInCount} / {totalTickets.length} tickets checked in ·{" "}
              {rows.length} RSVPs
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/export/${eventId}?filter=in`}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Download checked in
            </a>
            <a
              href={`/api/export/${eventId}?filter=out`}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700 transition-colors hover:bg-slate-800"
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
          <RsvpList eventId={eventId} rsvps={rows} />
        )}
      </div>
    </main>
  );
}
