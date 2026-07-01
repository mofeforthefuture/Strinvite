"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  // Check if user owns any events — if so, go to admin; otherwise dashboard
  const { data: ownedEvents } = await supabase
    .from("events")
    .select("id")
    .limit(1);

  if (ownedEvents && ownedEvents.length > 0) {
    redirect("/admin/events");
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
