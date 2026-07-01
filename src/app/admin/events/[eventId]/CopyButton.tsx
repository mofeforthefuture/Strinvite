"use client";

import { useState } from "react";

export default function CopyButton({
  tagline,
  venue,
  eventDate,
  link,
}: {
  tagline?: string | null;
  venue?: string | null;
  eventDate?: string | null;
  link: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const parts: string[] = [];
    if (tagline) parts.push(tagline);
    const details: string[] = [];
    if (venue) details.push(venue);
    if (eventDate) details.push(new Date(eventDate).toLocaleString());
    if (details.length) parts.push(details.join(" · "));
    parts.push("Expiring soon");
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
