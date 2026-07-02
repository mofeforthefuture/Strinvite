import { createClient } from "@/lib/supabase/server";
import { submitRsvp } from "./actions";
import RsvpForm from "./RsvpForm";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("label, events(name, tagline, event_date, venue)")
    .eq("slug", slug)
    .maybeSingle();

  const event = invite?.events as unknown as {
    name: string;
    tagline: string | null;
    event_date: string | null;
    venue: string | null;
  } | null;

  const eventName = event?.name ?? "You're Invited";
  const tagline = event?.tagline ?? "";
  const details: string[] = [];
  if (event?.venue) details.push(event.venue);
  if (event?.event_date) {
    details.push(
      new Date(event.event_date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }

  const description = tagline
    ? `${tagline}${details.length ? " | " + details.join(" - ") : ""}`
    : details.length
    ? `Join us! ${details.join(" - ")}`
    : "You're invited to a special event. RSVP now to confirm your attendance.";

  return {
    title: `${eventName} | RSVP`,
    description,
    openGraph: {
      title: eventName,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: eventName,
      description,
    },
  };
}

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("id, label, note, max_guests, expires_at, is_active, events(name, tagline, event_date, venue)")
    .eq("slug", slug)
    .maybeSingle();

  if (!invite) {
    return <ErrorScreen message="Invite link not found." />;
  }

  const expired = new Date(invite.expires_at) < new Date();
  if (!invite.is_active || expired) {
    return (
      <ErrorScreen
        message={expired ? "This invite has expired." : "This invite is no longer active."}
      />
    );
  }

  const { data: existing } = await supabase
    .from("rsvps")
    .select("party_size")
    .eq("invite_id", invite.id);

  const used = (existing ?? []).reduce((s, r) => s + r.party_size, 0);
  const remaining = invite.max_guests - used;

  if (remaining <= 0) {
    return <ErrorScreen message="This invite is fully booked." />;
  }

  const event = invite.events as unknown as {
    name: string;
    tagline: string | null;
    event_date: string | null;
    venue: string | null;
  } | null;

  const formattedDate = event?.event_date
    ? new Date(event.event_date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const formattedTime = event?.event_date
    ? new Date(event.event_date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <main className="min-h-screen bg-[#FFFDF7] p-4 sm:p-6">
      <div className="mx-auto max-w-lg">
        {/* Invitation header card */}
        <div className="mb-6 rounded-2xl border-2 border-[#C5A55A]/30 bg-white p-8 text-center shadow-lg">
          {/* Decorative top element */}
          <div className="mx-auto mb-4 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C5A55A]" />
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#C5A55A]">
              You are cordially invited
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C5A55A]" />
          </div>

          {event?.tagline && (
            <p className="mb-2 text-sm font-medium italic text-[#C5A55A]">
              {event.tagline}
            </p>
          )}

          <h1 className="text-3xl font-bold text-[#2D2417] sm:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
            {event?.name ?? "You're Invited"}
          </h1>

          {/* Decorative divider */}
          <div className="mx-auto my-4 h-px w-24 bg-gradient-to-r from-transparent via-[#C5A55A] to-transparent" />

          {/* Date & venue */}
          {(formattedDate || event?.venue) && (
            <div className="space-y-1">
              {formattedDate && (
                <p className="text-sm font-semibold tracking-wide text-[#5C4D3C]">
                  {formattedDate}
                  {formattedTime && (
                    <span className="text-[#8B7355]"> at {formattedTime}</span>
                  )}
                </p>
              )}
              {event?.venue && (
                <p className="text-sm text-[#8B7355]">{event.venue}</p>
              )}
            </div>
          )}

          {invite.note && (
            <p className="mt-4 rounded-lg border border-[#C5A55A]/20 bg-[#FFFDF7] px-4 py-2 text-sm font-medium text-[#8B7355]">
              {invite.note}
            </p>
          )}

          <p className="mt-4 text-xs font-medium text-[#C5A55A]">
            {remaining} spot{remaining === 1 ? "" : "s"} remaining
          </p>
        </div>

        {sp.error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {sp.error}
          </p>
        )}

        <RsvpForm slug={slug} maxGuests={remaining} submitAction={submitRsvp} />
      </div>
    </main>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFDF7] p-6">
      <div className="rounded-2xl border-2 border-[#C5A55A]/20 bg-white p-10 text-center shadow-lg">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#C5A55A]/30">
          <span className="text-lg text-[#C5A55A]">!</span>
        </div>
        <p className="text-lg font-medium text-[#2D2417]">{message}</p>
      </div>
    </main>
  );
}
