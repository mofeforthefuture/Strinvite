"use server";

import { createClient } from "@/lib/supabase/server";
import { generateConfirmationCode } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function submitRsvp(formData: FormData) {
  const slug = formData.get("slug") as string;
  const lead_name = formData.get("lead_name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const party_size = parseInt(formData.get("party_size") as string, 10);

  // Collect additional guest names (guests 2…N)
  const guest_names: string[] = [];
  for (const [key, val] of formData.entries()) {
    if (key.startsWith("guest_name_") && typeof val === "string" && val.trim()) {
      guest_names.push(val.trim());
    }
  }

  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("id, max_guests, expires_at, is_active, event_id")
    .eq("slug", slug)
    .single();

  if (!invite) redirect(`/rsvp/${slug}?error=Invite+not+found`);
  if (!invite.is_active) redirect(`/rsvp/${slug}?error=This+invite+is+no+longer+active`);
  if (new Date(invite.expires_at) < new Date())
    redirect(`/rsvp/${slug}?error=This+invite+has+expired`);

  // Check remaining capacity
  const { data: existing } = await supabase
    .from("rsvps")
    .select("party_size")
    .eq("invite_id", invite.id);

  const used = (existing ?? []).reduce((s, r) => s + r.party_size, 0);
  const remaining = invite.max_guests - used;

  if (party_size > remaining) {
    redirect(
      `/rsvp/${slug}?error=Only+${remaining}+spot${remaining === 1 ? "" : "s"}+left+on+this+invite`
    );
  }

  // Generate a group reference code for the ticket page URL
  let group_code = generateConfirmationCode();
  let rsvpId: string | null = null;

  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("rsvps")
      .insert({
        invite_id: invite.id,
        lead_name: lead_name.trim(),
        email,
        phone,
        party_size,
        guest_names,
        confirmation_code: group_code,
      })
      .select("id")
      .single();

    if (!error && data) {
      rsvpId = data.id;
      break;
    }
    if (error?.code === "23505") {
      group_code = generateConfirmationCode();
    } else if (error) {
      redirect(`/rsvp/${slug}?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (!rsvpId) redirect(`/rsvp/${slug}?error=Failed+to+create+RSVP`);

  // Build the list of names: lead first, then additional guests
  const allNames = [lead_name.trim(), ...guest_names].slice(0, party_size);

  // Create one ticket per person
  for (const name of allNames) {
    let ticketCode = generateConfirmationCode();
    for (let i = 0; i < 5; i++) {
      const { error } = await supabase.from("tickets").insert({
        rsvp_id: rsvpId,
        name,
        confirmation_code: ticketCode,
      });
      if (!error) break;
      if (error.code === "23505") {
        ticketCode = generateConfirmationCode();
      } else {
        break;
      }
    }
  }

  redirect(`/ticket/${group_code}`);
}
