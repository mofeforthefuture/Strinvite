"use client";

import { useState } from "react";

export default function CopyButton({
  tagline,
  venue,
  eventDate,
  expiresAt,
  link,
}: {
  tagline?: string | null;
  venue?: string | null;
  eventDate?: string | null;
  expiresAt?: string | null;
  link: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const parts: string[] = [];
    if (tagline) parts.push(tagline);
    const details: string[] = [];
    if (venue) details.push(venue);
    if (eventDate) {
      details.push(
        new Date(eventDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    }
    if (details.length) parts.push(details.join(" - "));
    if (expiresAt) {
      const expiry = new Date(expiresAt);
      const now = new Date();
      const diffMs = expiry.getTime() - now.getTime();
      if (diffMs <= 0) {
        parts.push("Link expired");
      } else {
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (diffDays > 0) {
          parts.push(`RSVP closes in ${diffDays} day${diffDays === 1 ? "" : "s"}`);
        } else if (diffHours > 0) {
          parts.push(`RSVP closes in ${diffHours} hour${diffHours === 1 ? "" : "s"}`);
        } else {
          parts.push("RSVP closing very soon");
        }
      }
    }
    parts.push(link);
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-400 ring-1 ring-slate-700 hover:bg-slate-800 hover:text-slate-200 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
