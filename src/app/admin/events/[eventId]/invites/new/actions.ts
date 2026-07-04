"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils";
import { redirect } from "next/navigation";

export async function createInvite(formData: FormData) {
  const supabase = await createClient();
  const eventId = formData.get("eventId") as string;
  const label = formData.get("label") as string;
  const note = formData.get("note") as string;
  const max_guests = parseInt(formData.get("max_guests") as string, 10);
  const expiresIn = formData.get("expires_in") as string;

  let expires_at: string;
  if (expiresIn === "never") {
    expires_at = new Date("2099-12-31T23:59:59Z").toISOString();
  } else {
    const days = parseInt(expiresIn, 10) || 7;
    expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  if (!eventId || !max_guests) {
    redirect(`/admin/events/${eventId}/invites/new?error=Missing+required+fields`);
  }

  // Verify event ownership
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .single();

  if (!event) redirect("/admin/events");

  // Retry on slug collision (extremely unlikely)
  let slug = generateSlug();
  for (let i = 0; i < 5; i++) {
    const { error } = await supabase.from("invites").insert({
      event_id: eventId,
      label: label || null,
      note: note || null,
      max_guests,
      expires_at,
      slug,
    });

    if (!error) break;
    if (error.code === "23505") {
      slug = generateSlug();
    } else {
      redirect(
        `/admin/events/${eventId}/invites/new?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  redirect(`/admin/events/${eventId}`);
}
