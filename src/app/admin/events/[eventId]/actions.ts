"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function toggleScanning(eventId: string, currentValue: boolean) {
  const supabase = await createClient();
  await supabase
    .from("events")
    .update({ scanning_enabled: !currentValue })
    .eq("id", eventId);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();
  const eventId = formData.get("eventId") as string;
  await supabase.from("events").delete().eq("id", eventId);
  redirect("/admin/events");
}

export async function deactivateInvite(formData: FormData) {
  const supabase = await createClient();
  const inviteId = formData.get("inviteId") as string;
  const eventId = formData.get("eventId") as string;
  await supabase.from("invites").update({ is_active: false }).eq("id", inviteId);
  revalidatePath(`/admin/events/${eventId}`);
}
