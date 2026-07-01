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
    <main className="flex min-h-screen flex-col items-center gap-6 bg-gray-900 p-6 text-white">
      <div className="w-full max-w-sm">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{event.name}</h1>
        <p className="text-sm text-gray-400">Door scanner</p>
      </div>

      {!event.scanning_enabled && (
        <div className="w-full max-w-sm rounded-xl bg-yellow-500/20 p-4 text-center text-sm text-yellow-300">
          Scanning is currently paused by the event admin.
        </div>
      )}

      <QRScannerClient eventId={eventId} />
    </main>
  );
}
