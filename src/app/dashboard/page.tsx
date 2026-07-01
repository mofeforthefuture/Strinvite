import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import ActionButton from "@/components/ActionButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get events this user is staff on
  const { data: assignments } = await supabase
    .from("event_staff")
    .select("event_id, events(id, name, event_date, venue, scanning_enabled)")
    .eq("user_id", user!.id);

  type Assignment = {
    event_id: string;
    events: {
      id: string;
      name: string;
      event_date: string | null;
      venue: string | null;
      scanning_enabled: boolean;
    } | null;
  };

  const rows = (assignments ?? []) as unknown as Assignment[];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <form>
            <ActionButton action={signOut} variant="outline" loadingText="Signing out" style="dots">
              Sign out
            </ActionButton>
          </form>
        </div>

        {!rows.length ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            You haven&apos;t been assigned to any events yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((a) => {
              const event = a.events;
              if (!event) return null;
              return (
                <li key={event.id} className="rounded-xl bg-white p-5 shadow-sm">
                  <p className="font-semibold text-gray-900">{event.name}</p>
                  <p className="text-sm text-gray-500">
                    {event.venue && `${event.venue} · `}
                    {event.event_date
                      ? new Date(event.event_date).toLocaleString()
                      : "No date set"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/dashboard/${event.id}/scan`}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                    >
                      Scanner
                    </Link>
                    <Link
                      href={`/dashboard/${event.id}/rsvps`}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      RSVPs
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
