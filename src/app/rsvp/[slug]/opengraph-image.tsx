import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "Event Invitation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invites")
    .select(
      "label, events(name, tagline, event_date, venue)"
    )
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
  const venue = event?.venue ?? "";
  const eventDate = event?.event_date
    ? new Date(event.event_date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFFDF7 0%, #FFF9E6 50%, #FFFDF7 100%)",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Gold border frame */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: "3px solid #C5A55A",
            borderRadius: 16,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: "1px solid #D4B96E",
            borderRadius: 12,
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 80px",
            textAlign: "center",
          }}
        >
          {/* Small decorative text */}
          <div
            style={{
              fontSize: 20,
              color: "#C5A55A",
              letterSpacing: "6px",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            You are cordially invited
          </div>

          {/* Decorative line */}
          <div
            style={{
              width: 120,
              height: 2,
              background: "linear-gradient(90deg, transparent, #C5A55A, transparent)",
              marginBottom: 24,
              display: "flex",
            }}
          />

          {/* Event name */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#2D2417",
              lineHeight: 1.2,
              marginBottom: tagline ? 12 : 20,
              maxWidth: 900,
            }}
          >
            {eventName}
          </div>

          {/* Tagline */}
          {tagline && (
            <div
              style={{
                fontSize: 26,
                color: "#C5A55A",
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              {tagline}
            </div>
          )}

          {/* Decorative line */}
          <div
            style={{
              width: 80,
              height: 2,
              background: "linear-gradient(90deg, transparent, #C5A55A, transparent)",
              marginBottom: 24,
              display: "flex",
            }}
          />

          {/* Date and venue */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            {eventDate && (
              <div
                style={{
                  fontSize: 22,
                  color: "#5C4D3C",
                  letterSpacing: "2px",
                }}
              >
                {eventDate}
              </div>
            )}
            {venue && (
              <div
                style={{
                  fontSize: 20,
                  color: "#8B7355",
                }}
              >
                {venue}
              </div>
            )}
          </div>

          {/* RSVP badge */}
          <div
            style={{
              marginTop: 32,
              padding: "10px 40px",
              border: "2px solid #C5A55A",
              borderRadius: 40,
              fontSize: 18,
              color: "#C5A55A",
              letterSpacing: "4px",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            RSVP Now
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
