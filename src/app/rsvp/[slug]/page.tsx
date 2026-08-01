import { createServiceClient } from "@/lib/supabase/service";
import { submitRsvp } from "./actions";
import RsvpForm from "./RsvpForm";
import ConfirmedTicketsDisclosure from "./ConfirmedTicketsDisclosure";
import type { Metadata } from "next";
import Image from "next/image";

type EventInfo = {
  name: string;
  tagline: string | null;
  event_date: string | null;
  venue: string | null;
  phone: string | null;
  dress_code: string | null;
  dress_color: string | null;
};

async function loadInviteAndEvent(slug: string) {
  const service = createServiceClient();

  const { data: invite } = await service
    .from("invites")
    .select("id, label, note, max_guests, expires_at, is_active, event_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!invite) return { invite: null, event: null as EventInfo | null };

  const { data: event } = await service
    .from("events")
    .select("name, tagline, event_date, venue, phone, dress_code, dress_color")
    .eq("id", invite.event_id)
    .single();

  return { invite, event: (event as EventInfo | null) ?? null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { event } = await loadInviteAndEvent(slug);

  const eventName = event?.name ?? "E&M Imogu 30th Anniversary";
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
    : "RSVP for E&M Imogu 30th Anniversary. Confirm your attendance now!";

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
  const service = createServiceClient();
  const { invite, event } = await loadInviteAndEvent(slug);

  if (!invite) {
    return <ErrorScreen message="Invite link not found." />;
  }

  const expired = new Date(invite.expires_at) < new Date();

  const { data: existingRsvps } = await service
    .from("rsvps")
    .select("id, lead_name, party_size, created_at")
    .eq("invite_id", invite.id)
    .order("created_at", { ascending: true });

  const used = (existingRsvps ?? []).reduce((s, r) => s + r.party_size, 0);
  const remaining = invite.max_guests - used;
  const full = remaining <= 0;

  // Capacity first: fully booked beats link expiry (matches admin)
  // RSVP may be closed, but the page stays viewable for event details + tickets
  const statusMessage = !invite.is_active
    ? "New RSVPs are closed for this invite."
    : full
    ? "This invite is fully booked — new RSVPs are closed."
    : expired
    ? "This invite link has expired — new RSVPs are closed."
    : null;

  const statusHint = !invite.is_active
    ? "You can still view the event details above, and any confirmed tickets below."
    : full
    ? "You can still view the event details above. If you already confirmed, open the tickets section to re-download."
    : expired
    ? "You can still view the date, venue, and dress details above. Anyone already confirmed can re-download tickets below."
    : null;

  const rsvpIds = (existingRsvps ?? []).map((r) => r.id);
  const { data: ticketRows } = rsvpIds.length
    ? await service
        .from("tickets")
        .select("id, name, confirmation_code, rsvp_id, created_at")
        .in("rsvp_id", rsvpIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const leadByRsvp = new Map(
    (existingRsvps ?? []).map((r) => [r.id, r.lead_name] as const)
  );

  const confirmedTickets = (ticketRows ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    confirmation_code: t.confirmation_code,
    lead_name: leadByRsvp.get(t.rsvp_id) ?? "",
  }));

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

  const canRsvp = !statusMessage;

  return (
    <main className="min-h-screen bg-[#FFFDF7] p-4 sm:p-6">
      <div className="mx-auto max-w-lg">
        {/* Invitation header card */}
        <div className="mb-6 rounded-2xl border-2 border-[#C5A55A]/30 bg-white px-5 py-6 text-center shadow-lg sm:p-8">
          <Image
            src="/invitation-logo.png"
            alt="Event logo"
            width={240}
            height={240}
            className="mx-auto mb-4 h-auto w-40 sm:w-60"
            priority
          />

          <div className="mx-auto mb-4 flex items-center justify-center gap-2 sm:gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#C5A55A] sm:w-12" />
            <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#C5A55A] sm:text-xs">
              You are cordially invited
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#C5A55A] sm:w-12" />
          </div>

          {event?.tagline && (
            <p className="mb-2 text-sm font-medium italic text-[#C5A55A]">
              {event.tagline}
            </p>
          )}

          <h1
            className="text-2xl font-bold text-[#2D2417] sm:text-4xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {event?.name ?? "E&M Imogu 30th Anniversary"}
          </h1>

          <div className="mx-auto my-3 h-px w-24 bg-gradient-to-r from-transparent via-[#C5A55A] to-transparent sm:my-4" />

          {(formattedDate || event?.venue) && (
            <div className="space-y-1">
              {formattedDate && (
                <p className="text-sm font-semibold tracking-wide text-[#3D2E1E]">
                  {formattedDate}
                  {formattedTime && (
                    <span className="text-[#5C4D3C]"> at {formattedTime}</span>
                  )}
                </p>
              )}
              {event?.venue && (
                <p className="text-sm font-medium text-[#5C4D3C]">{event.venue}</p>
              )}
            </div>
          )}

          {(event?.dress_code || event?.dress_color) && (
            <div className="mt-3 space-y-1 rounded-lg border border-[#C5A55A]/30 bg-[#FFFDF7] px-4 py-3 sm:mt-4">
              {event.dress_code && (
                <p className="text-sm font-medium text-[#3D2E1E]">
                  Dress Code for Guests is{" "}
                  <span className="text-[#C5A55A]">{event.dress_code}</span>
                </p>
              )}
              {event.dress_color && (
                <p className="text-sm font-medium text-[#3D2E1E]">
                  Dress Color for Guests is{" "}
                  <span className="text-[#C5A55A]">{event.dress_color}</span>
                </p>
              )}
            </div>
          )}

          {invite.note && (
            <p className="mt-3 rounded-lg border border-[#C5A55A]/30 bg-[#FFFDF7] px-4 py-2 text-sm font-medium text-[#5C4D3C] sm:mt-4">
              {invite.note}
            </p>
          )}

          {event?.phone && (
            <p className="mt-3 text-sm text-[#5C4D3C]">
              For enquiries, call or text{" "}
              <a
                href={`tel:${event.phone}`}
                className="font-semibold text-[#C5A55A] underline"
              >
                {event.phone}
              </a>
            </p>
          )}

          {canRsvp && (
            <p className="mt-3 text-sm font-semibold text-[#C5A55A] sm:mt-4">
              RSVP now to retain your seat, link expires in 7 days.
            </p>
          )}
        </div>

        {/* Subtle revisit: confirmed tickets (collapsed by default) */}
        <ConfirmedTicketsDisclosure
          tickets={confirmedTickets}
          eventName={event?.name ?? "Event"}
          eventDate={event?.event_date}
          venue={event?.venue}
        />

        {statusMessage ? (
          <div className="rounded-2xl border-2 border-[#C5A55A]/20 bg-white px-5 py-6 text-center shadow-lg sm:p-6">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#C5A55A]/30">
              <span className="text-base text-[#C5A55A]">!</span>
            </div>
            <p className="text-base font-medium text-[#2D2417]">{statusMessage}</p>
            {statusHint && (
              <p className="mt-2 text-sm text-[#8A7B6A]">{statusHint}</p>
            )}
          </div>
        ) : (
          <>
            {sp.error && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {sp.error}
              </p>
            )}

            <RsvpForm slug={slug} maxGuests={remaining} submitAction={submitRsvp} />
          </>
        )}
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
