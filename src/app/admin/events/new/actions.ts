"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const tagline = formData.get("tagline") as string;
  const event_date = formData.get("event_date") as string;
  const venue = formData.get("venue") as string;
  const phone = formData.get("phone") as string;
  const dress_code = formData.get("dress_code") as string;
  const dress_color = formData.get("dress_color") as string;

  const { data, error } = await supabase
    .from("events")
    .insert({
      name,
      tagline: tagline || null,
      event_date: event_date || null,
      venue: venue || null,
      phone: phone || null,
      dress_code: dress_code || null,
      dress_color: dress_color || null,
      admin_id: user.id,
    })
    .select("id")
    .single();

  if (error) redirect(`/admin/events/new?error=${encodeURIComponent(error.message)}`);

  redirect(`/admin/events/${data.id}`);
}
