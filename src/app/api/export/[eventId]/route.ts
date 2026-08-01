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

  const { data: rsvps, error } = await service
    .from("rsvps")
    .select(
      "lead_name, email, phone, created_at, invites!inner(event_id, label, slug), tickets(name, confirmation_code, checked_in, checked_in_at, created_at)"
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
    invites: { event_id: string; label: string | null; slug: string } | null;
    tickets: TicketRow[] | null;
  };

  type ExportRow = {
    invite: string;
    lead_name: string;
    guest_name: string;
    role: "Lead" | "Guest";
    ticket_code: string;
    phone: string;
    email: string;
    rsvp_date: string;
    checked_in_at: string;
  };

  const parties = ((rsvps ?? []) as unknown as RsvpRow[]).map((rsvp) => {
    const inviteLabel =
      (rsvp.invites?.label && rsvp.invites.label.trim()) ||
      rsvp.invites?.slug ||
      "Invite";
    const leadName = rsvp.lead_name ?? "";
    const matchingTickets = (rsvp.tickets ?? []).filter(
      (t) => t.checked_in === checkedIn
    );

    const ordered = [...matchingTickets].sort((a, b) => {
      const aIsLead = a.name.trim().toLowerCase() === leadName.trim().toLowerCase();
      const bIsLead = b.name.trim().toLowerCase() === leadName.trim().toLowerCase();
      if (aIsLead && !bIsLead) return -1;
      if (!aIsLead && bIsLead) return 1;
      return a.name.localeCompare(b.name);
    });

    const rows: ExportRow[] = ordered.map((ticket) => {
      const isLead =
        ticket.name.trim().toLowerCase() === leadName.trim().toLowerCase();
      return {
        invite: inviteLabel,
        lead_name: leadName,
        guest_name: ticket.name,
        role: isLead ? "Lead" : "Guest",
        ticket_code: ticket.confirmation_code,
        phone: rsvp.phone ?? "",
        email: rsvp.email ?? "",
        rsvp_date: new Date(ticket.created_at ?? rsvp.created_at).toLocaleString(),
        checked_in_at: ticket.checked_in_at
          ? new Date(ticket.checked_in_at).toLocaleString()
          : "",
      };
    });

    return { invite: inviteLabel, lead_name: leadName, rows };
  });

  // Party order: invite label, then lead name (skip empty parties after filter)
  parties.sort((a, b) => {
    const byInvite = a.invite.localeCompare(b.invite);
    if (byInvite !== 0) return byInvite;
    return a.lead_name.localeCompare(b.lead_name);
  });

  const exportRows = parties.flatMap((p) => p.rows);

  const rows = [
    [
      "Invite",
      "RSVP Lead",
      "Guest Name",
      "Role",
      "Ticket Code",
      "Phone",
      "Email",
      "RSVP Date",
      "Checked In At",
    ],
    ...exportRows.map((r) => [
      r.invite,
      r.lead_name,
      r.guest_name,
      r.role,
      r.ticket_code,
      r.phone,
      r.email,
      r.rsvp_date,
      r.checked_in_at,
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
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
