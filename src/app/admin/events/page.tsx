import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import ActionButton from "@/components/ActionButton";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, venue, scanning_enabled")
    .order("event_date", { ascending: true });

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/events/new"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + New event
            </Link>
            <form>
              <ActionButton action={signOut} variant="outline" loadingText="Signing out" style="dots">
                Sign out
              </ActionButton>
            </form>
          </div>
        </div>

        {!events?.length ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
            No events yet. Create your first one.
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/admin/events/${event.id}`}
                  className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-500">
                      {event.venue && `${event.venue} · `}
                      {event.event_date
                        ? new Date(event.event_date).toLocaleString()
                        : "No date set"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      event.scanning_enabled
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {event.scanning_enabled ? "Scanning on" : "Scanning off"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
