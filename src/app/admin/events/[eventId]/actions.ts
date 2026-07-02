"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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

export async function addStaff(formData: FormData) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const eventId = formData.get("eventId") as string;
  const email = (formData.get("email") as string).trim().toLowerCase();

  // Look up the user by email using the admin API
  const { data: userList } = await serviceClient.auth.admin.listUsers();
  const staffUser = userList?.users?.find((u) => u.email === email);

  if (!staffUser) {
    redirect(
      `/admin/events/${eventId}?error=${encodeURIComponent("No account found with that email. They must sign up first.")}`
    );
  }

  const { error } = await supabase.from("event_staff").insert({
    event_id: eventId,
    user_id: staffUser.id,
    email,
  });

  if (error?.code === "23505") {
    // Already added
  } else if (error) {
    redirect(
      `/admin/events/${eventId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/events/${eventId}`);
}

export async function removeStaff(formData: FormData) {
  const supabase = await createClient();
  const staffId = formData.get("staffId") as string;
  const eventId = formData.get("eventId") as string;
  await supabase.from("event_staff").delete().eq("id", staffId);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function createStaffAccount(formData: FormData) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const eventId = formData.get("eventId") as string;
  const name = (formData.get("name") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    redirect(
      `/admin/events/${eventId}?error=${encodeURIComponent("Name, email, and password are required.")}`
    );
  }

  if (password.length < 6) {
    redirect(
      `/admin/events/${eventId}?error=${encodeURIComponent("Password must be at least 6 characters.")}`
    );
  }

  // Check if user already exists
  const { data: userList } = await serviceClient.auth.admin.listUsers();
  const existingUser = userList?.users?.find((u) => u.email === email);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    // Create the user account via admin API (no email confirmation needed)
    const { data: newUser, error: createError } =
      await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
      });

    if (createError || !newUser?.user) {
      redirect(
        `/admin/events/${eventId}?error=${encodeURIComponent(createError?.message ?? "Failed to create account.")}`
      );
    }

    userId = newUser.user.id;
  }

  // Add as event staff
  const { error } = await supabase.from("event_staff").insert({
    event_id: eventId,
    user_id: userId,
    email,
  });

  if (error?.code === "23505") {
    // Already added — ignore
  } else if (error) {
    redirect(
      `/admin/events/${eventId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/admin/events/${eventId}`);
}
