"use client";

import { useState } from "react";

export default function CopyButton({
  tagline,
  link,
}: {
  tagline?: string | null;
  link: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const parts: string[] = [];
    if (tagline) parts.push(tagline);
    parts.push("Expiring soon");
    parts.push(link);
    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
