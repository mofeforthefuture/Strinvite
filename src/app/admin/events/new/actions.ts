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
  const event_date = formData.get("event_date") as string;
  const venue = formData.get("venue") as string;

  const { data, error } = await supabase
    .from("events")
    .insert({
      name,
      event_date: event_date || null,
      venue: venue || null,
      admin_id: user.id,
    })
    .select("id")
    .single();

  if (error) redirect(`/admin/events/new?error=${encodeURIComponent(error.message)}`);

  redirect(`/admin/events/${data.id}`);
}
