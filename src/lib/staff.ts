import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireStaffAccess(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("event_staff")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) redirect("/dashboard");

  return { supabase, user };
}
