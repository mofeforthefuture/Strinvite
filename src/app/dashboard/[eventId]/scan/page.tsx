import { requireStaffAccess } from "@/lib/staff";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRScannerClient from "@/components/QRScannerClient";

export default async function StaffScanPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const { supabase } = await requireStaffAccess(eventId);

  const { data: event } = await supabase
    .from("events")
    .select("name, scanning_enabled")
    .eq("id", eventId)
    .single();

  if (!event) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-slate-950 p-6 text-white">
      <div className="w-full max-w-sm">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-100">{event.name}</h1>
        <p className="text-sm text-slate-500">Door scanner</p>
      </div>

      {!event.scanning_enabled && (
        <div className="w-full max-w-sm rounded-xl bg-yellow-500/10 p-4 text-center text-sm text-yellow-400 ring-1 ring-yellow-500/20">
          Scanning is currently paused by the event admin.
        </div>
      )}

      <QRScannerClient eventId={eventId} />
    </main>
  );
}
