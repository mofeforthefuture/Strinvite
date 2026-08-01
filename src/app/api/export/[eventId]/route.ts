import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const filter = request.nextUrl.searchParams.get("filter"); // "in" | "out"
  const checkedIn = filter === "in";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if user is the admin or a staff member (user-scoped client for authz)
  const { data: isOwner } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("admin_id", user.id)
    .maybeSingle();

  const { data: isStaff } = await supabase
    .from("event_staff")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isOwner && !isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Service client bypasses invite RLS so inactive invites still appear in exports
  const service = createServiceClient();

  const { data: event } = await service
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single();

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Same query path as the RSVP list pages (one-level invite filter), then
  // flatten tickets and filter by check-in in app code.
  const { data: rsvps, error } = await service
    .from("rsvps")
    .select(
      "lead_name, email, phone, created_at, invites!inner(event_id), tickets(name, confirmation_code, checked_in, checked_in_at, created_at)"
    )
    .eq("invites.event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load guests", details: error.message },
      { status: 500 }
    );
  }

  type TicketRow = {
    name: string;
    confirmation_code: string;
    checked_in: boolean;
    checked_in_at: string | null;
    created_at: string;
  };

  type RsvpRow = {
    lead_name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    tickets: TicketRow[] | null;
  };

  const tickets = ((rsvps ?? []) as unknown as RsvpRow[])
    .flatMap((rsvp) =>
      (rsvp.tickets ?? []).map((ticket) => ({
        ...ticket,
        lead_name: rsvp.lead_name,
        email: rsvp.email,
        phone: rsvp.phone,
        // Prefer ticket created_at; fall back to RSVP date
        rsvp_date: ticket.created_at ?? rsvp.created_at,
      }))
    )
    .filter((t) => t.checked_in === checkedIn)
    .sort((a, b) => a.name.localeCompare(b.name));

  const rows = [
    ["Name", "RSVP Lead", "Email", "Phone", "Ticket Code", "RSVP Date", "Checked In At"],
    ...tickets.map((t) => [
      t.name,
      t.lead_name,
      t.email ?? "",
      t.phone ?? "",
      t.confirmation_code,
      new Date(t.rsvp_date).toLocaleString(),
      t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : "",
    ]),
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const filename = `${event.name.replace(/\s+/g, "_")}_${
    checkedIn ? "checked_in" : "yet_to_arrive"
  }.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
