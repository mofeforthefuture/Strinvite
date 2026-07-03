import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

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
    .select("label, events(name, tagline, event_date, venue)")
    .eq("slug", slug)
    .maybeSingle();

  const event = invite?.events as unknown as {
    name: string;
    tagline: string | null;
    event_date: string | null;
    venue: string | null;
  } | null;

  const eventName = event?.name ?? "RSVP for E & M 30th anniversary";
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

  // Read the invitation logo from the public directory
  const logoPath = join(process.cwd(), "public", "invitation-logo.png");
  const logoData = await readFile(logoPath);
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #FFFDF7 0%, #FFF9E6 50%, #FFFDF7 100%)",
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

        {/* Logo side */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 420,
            height: "100%",
            paddingLeft: 60,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoBase64}
            alt="Event logo"
            width={300}
            height={300}
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Event details side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "50px 60px 50px 20px",
            textAlign: "center",
          }}
        >
          {/* Small decorative text */}
          <div
            style={{
              fontSize: 16,
              color: "#C5A55A",
              letterSpacing: "5px",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            You are cordially invited
          </div>

          {/* Decorative line */}
          <div
            style={{
              width: 100,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #C5A55A, transparent)",
              marginBottom: 20,
              display: "flex",
            }}
          />

          {/* Event name */}
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#2D2417",
              lineHeight: 1.2,
              marginBottom: tagline ? 10 : 16,
              maxWidth: 550,
            }}
          >
            {eventName}
          </div>

          {/* Tagline */}
          {tagline && (
            <div
              style={{
                fontSize: 22,
                color: "#C5A55A",
                fontStyle: "italic",
                marginBottom: 16,
              }}
            >
              {tagline}
            </div>
          )}

          {/* Decorative line */}
          <div
            style={{
              width: 60,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #C5A55A, transparent)",
              marginBottom: 18,
              display: "flex",
            }}
          />

          {/* Date and venue */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            {eventDate && (
              <div
                style={{
                  fontSize: 18,
                  color: "#5C4D3C",
                  letterSpacing: "1px",
                }}
              >
                {eventDate}
              </div>
            )}
            {venue && (
              <div style={{ fontSize: 17, color: "#8B7355" }}>{venue}</div>
            )}
          </div>

          {/* RSVP badge */}
          <div
            style={{
              marginTop: 26,
              padding: "8px 36px",
              border: "2px solid #C5A55A",
              borderRadius: 40,
              fontSize: 15,
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
