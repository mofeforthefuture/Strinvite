"use client";

export default function LocalTime({ iso }: { iso: string | null }) {
  if (!iso) return null;
  return <>{new Date(iso).toLocaleTimeString()}</>;
}
