import { createClient } from "@/lib/supabase/server";
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

  const { data: event } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single();

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check if user is the admin or a staff member
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

  // One row per ticket (per person)
  const { data: tickets } = await supabase
    .from("tickets")
    .select(
      "name, confirmation_code, checked_in, checked_in_at, created_at, rsvps!inner(lead_name, email, phone, invites!inner(event_id))"
    )
    .eq("rsvps.invites.event_id", eventId)
    .eq("checked_in", checkedIn)
    .order("name");

  type TicketRow = {
    name: string;
    confirmation_code: string;
    checked_in: boolean;
    checked_in_at: string | null;
    created_at: string;
    rsvps: { lead_name: string; email: string | null; phone: string | null } | null;
  };

  const rows = [
    ["Name", "RSVP Lead", "Email", "Phone", "Ticket Code", "RSVP Date", "Checked In At"],
    ...(tickets ?? []).map((t) => {
      const r = t.rsvps as unknown as TicketRow["rsvps"];
      return [
        t.name,
        r?.lead_name ?? "",
        r?.email ?? "",
        r?.phone ?? "",
        t.confirmation_code,
        new Date(t.created_at).toLocaleString(),
        t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : "",
      ];
    }),
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
