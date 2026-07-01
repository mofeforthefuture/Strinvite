import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import ActionButton from "@/components/ActionButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
          <form>
            <ActionButton action={signOut} variant="outline" loadingText="Signing out" style="dots">
              Sign out
            </ActionButton>
          </form>
        </div>

        {!rows.length ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
            You haven&apos;t been assigned to any events yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((a) => {
              const event = a.events;
              if (!event) return null;
              return (
                <li key={event.id} className="rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
                  <p className="font-semibold text-slate-100">{event.name}</p>
                  <p className="text-sm text-slate-400">
                    {event.venue && `${event.venue} · `}
                    {event.event_date
                      ? new Date(event.event_date).toLocaleString()
                      : "No date set"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/dashboard/${event.id}/scan`}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      Scanner
                    </Link>
                    <Link
                      href={`/dashboard/${event.id}/rsvps`}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800 transition-colors"
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
