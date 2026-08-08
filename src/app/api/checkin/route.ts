import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const code = body?.code;
  const ticketId = body?.ticketId;
  const eventId = body?.eventId;
  const manual = Boolean(body?.manual);

  const hasCode = typeof code === "string" && code.trim().length > 0;
  const hasTicketId = typeof ticketId === "string" && ticketId.trim().length > 0;

  if (!hasCode && !hasTicketId) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  if (!eventId || typeof eventId !== "string") {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

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

  if (!isOwner && !isStaff) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const service = createServiceClient();

  let query = service
    .from("tickets")
    .select(
      "id, name, checked_in, rsvps(invite_id, invites(event_id, events(scanning_enabled, name)))"
    );

  if (hasTicketId) {
    query = query.eq("id", ticketId.trim());
  } else {
    query = query.eq("confirmation_code", code.trim().toUpperCase());
  }

  const { data: ticket } = await query.maybeSingle();

  if (!ticket) {
    return NextResponse.json({ ok: false, reason: "invalid" });
  }

  type NestedInvite = {
    event_id: string;
    events: { scanning_enabled: boolean; name: string } | null;
  };
  type NestedRsvp = { invite_id: string; invites: NestedInvite | null };

  const rsvp = ticket.rsvps as unknown as NestedRsvp | null;
  const invite = rsvp?.invites ?? null;
  const event = invite?.events ?? null;

  if (!invite || invite.event_id !== eventId) {
    return NextResponse.json({ ok: false, reason: "wrong_event" });
  }

  if (ticket.checked_in) {
    return NextResponse.json({ ok: false, reason: "already_used" });
  }

  // Manual list check-in is an admin/staff override; camera scans still respect the pause.
  if (!manual && !event?.scanning_enabled) {
    return NextResponse.json({ ok: false, reason: "scanning_disabled" });
  }

  const checkedInAt = new Date().toISOString();
  const { error } = await service
    .from("tickets")
    .update({ checked_in: true, checked_in_at: checkedInAt })
    .eq("id", ticket.id);

  if (error) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    lead_name: ticket.name,
    party_size: 1,
    guest_names: [],
    event_name: event?.name ?? null,
    checked_in_at: checkedInAt,
  });
}
