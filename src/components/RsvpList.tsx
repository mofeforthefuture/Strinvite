"use client";

import { useMemo, useState, useTransition } from "react";
import LocalTime from "@/components/LocalTime";

export type RsvpTicket = {
  id: string;
  name: string;
  confirmation_code: string;
  checked_in: boolean;
  checked_in_at: string | null;
};

export type RsvpListItem = {
  id: string;
  lead_name: string;
  email?: string | null;
  phone?: string | null;
  created_at: string;
  invites: { label: string | null; slug: string } | null;
  tickets: RsvpTicket[];
};

type StatusFilter = "all" | "in" | "out";

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "in", label: "Checked in" },
  { key: "out", label: "Not arrived" },
];

export default function RsvpList({
  eventId,
  rsvps: initialRsvps,
  showEmail = false,
}: {
  eventId: string;
  rsvps: RsvpListItem[];
  showEmail?: boolean;
}) {
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const allTickets = rsvps.flatMap((r) => r.tickets ?? []);
  const checkedInCount = allTickets.filter((t) => t.checked_in).length;
  const notArrivedCount = allTickets.length - checkedInCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rsvps
      .map((rsvp) => {
        const tickets = (rsvp.tickets ?? []).filter((ticket) => {
          if (statusFilter === "in" && !ticket.checked_in) return false;
          if (statusFilter === "out" && ticket.checked_in) return false;
          return true;
        });
        return { ...rsvp, tickets };
      })
      .filter((rsvp) => {
        if (!rsvp.tickets.length) return false;
        if (!q) return true;
        const invite = (
          rsvp.invites?.label ??
          rsvp.invites?.slug ??
          ""
        ).toLowerCase();
        const lead = rsvp.lead_name.toLowerCase();
        const guestMatch = rsvp.tickets.some(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.confirmation_code.toLowerCase().includes(q)
        );
        return lead.includes(q) || invite.includes(q) || guestMatch;
      });
  }, [rsvps, statusFilter, query]);

  const counts: Record<StatusFilter, number> = {
    all: allTickets.length,
    in: checkedInCount,
    out: notArrivedCount,
  };

  async function checkInTicket(ticketId: string) {
    setError(null);
    setPendingId(ticketId);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, eventId, manual: true }),
      });
      const data = await res.json();

      if (!data.ok) {
        const messages: Record<string, string> = {
          already_used: "Already checked in",
          invalid: "Could not check in this guest",
          unauthorized: "Please sign in again",
          forbidden: "Not allowed for this event",
          wrong_event: "Ticket is for a different event",
        };
        setError(messages[data.reason] ?? "Check-in failed");
        return;
      }

      const checkedInAt =
        typeof data.checked_in_at === "string"
          ? data.checked_in_at
          : new Date().toISOString();

      startTransition(() => {
        setRsvps((prev) =>
          prev.map((rsvp) => ({
            ...rsvp,
            tickets: rsvp.tickets.map((ticket) =>
              ticket.id === ticketId
                ? { ...ticket, checked_in: true, checked_in_at: checkedInAt }
                : ticket
            ),
          }))
        );
      });
    } catch {
      setError("Check-in failed. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, invite, or code..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.key
                  ? f.key === "in"
                    ? "bg-emerald-600 text-white"
                    : f.key === "out"
                      ? "bg-amber-600 text-white"
                      : "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 ring-1 ring-slate-700 hover:bg-slate-700"
              }`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
          {error}
        </p>
      )}

      {!filtered.length ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
          {statusFilter === "in"
            ? "No checked-in guests yet."
            : statusFilter === "out"
              ? "Everyone on the list has checked in."
              : "No RSVPs match your search."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rsvp) => (
            <div
              key={rsvp.id}
              className="overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
                <div>
                  <span className="font-semibold text-slate-100">
                    {rsvp.lead_name}
                  </span>
                  {showEmail && rsvp.email && (
                    <span className="ml-2 text-sm text-slate-500">
                      {rsvp.email}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>
                    {rsvp.invites?.label ?? rsvp.invites?.slug ?? "—"}
                  </span>
                  <span>{new Date(rsvp.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="divide-y divide-slate-800/50">
                {rsvp.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between gap-3 px-5 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          ticket.checked_in
                            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                            : "bg-slate-600"
                        }`}
                      />
                      <span className="truncate text-sm text-slate-200">
                        {ticket.name}
                      </span>
                      <span className="hidden font-mono text-xs text-slate-600 sm:inline">
                        {ticket.confirmation_code}
                      </span>
                    </div>
                    {ticket.checked_in ? (
                      <span className="shrink-0 text-xs text-emerald-400">
                        In · <LocalTime iso={ticket.checked_in_at} />
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={pendingId === ticket.id}
                        onClick={() => checkInTicket(ticket.id)}
                        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingId === ticket.id ? "Checking in…" : "Check in"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
