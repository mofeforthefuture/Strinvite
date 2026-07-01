import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, name, checked_in, rsvps(invite_id, invites(event_id, events(scanning_enabled, name)))"
    )
    .eq("confirmation_code", code.trim().toUpperCase())
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ ok: false, reason: "invalid" });
  }

  if (ticket.checked_in) {
    return NextResponse.json({ ok: false, reason: "already_used" });
  }

  type NestedInvite = {
    event_id: string;
    events: { scanning_enabled: boolean; name: string } | null;
  };
  type NestedRsvp = { invite_id: string; invites: NestedInvite | null };

  const rsvp = ticket.rsvps as unknown as NestedRsvp | null;
  const event = rsvp?.invites?.events ?? null;

  if (!event?.scanning_enabled) {
    return NextResponse.json({ ok: false, reason: "scanning_disabled" });
  }

  const { error } = await supabase
    .from("tickets")
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq("id", ticket.id);

  if (error) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    lead_name: ticket.name,
    party_size: 1,
    guest_names: [],
    event_name: event.name,
  });
}
