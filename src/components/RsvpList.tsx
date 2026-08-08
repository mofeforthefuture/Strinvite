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

type StatusFilter = "all" | "recent" | "in" | "out";

const RECENT_WINDOW_MS = 30 * 60 * 1000; // last 30 minutes

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "recent", label: "Recently checked in" },
  { key: "in", label: "Checked in" },
  { key: "out", label: "Not arrived" },
];

type FlatTicket = RsvpTicket & {
  rsvpId: string;
  lead_name: string;
  email?: string | null;
  inviteLabel: string;
};

function checkedInAtMs(ticket: RsvpTicket) {
  if (!ticket.checked_in_at) return 0;
  const ms = new Date(ticket.checked_in_at).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function ticketMatchesQuery(
  query: string,
  lead: string,
  invite: string,
  tickets: RsvpTicket[]
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const guestMatch = tickets.some(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.confirmation_code.toLowerCase().includes(q)
  );
  return (
    lead.toLowerCase().includes(q) ||
    invite.toLowerCase().includes(q) ||
    guestMatch
  );
}

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
  const checkedInTickets = allTickets.filter((t) => t.checked_in);
  const recentCutoff = Date.now() - RECENT_WINDOW_MS;
  const recentCount = checkedInTickets.filter(
    (t) => checkedInAtMs(t) >= recentCutoff
  ).length;
  const notArrivedCount = allTickets.length - checkedInTickets.length;

  const showArrivalOrder =
    statusFilter === "in" || statusFilter === "recent";

  const arrivalTickets = useMemo(() => {
    if (!showArrivalOrder) return [] as FlatTicket[];

    const cutoff =
      statusFilter === "recent" ? Date.now() - RECENT_WINDOW_MS : 0;

    const flat: FlatTicket[] = [];
    for (const rsvp of rsvps) {
      const inviteLabel = rsvp.invites?.label ?? rsvp.invites?.slug ?? "—";
      for (const ticket of rsvp.tickets ?? []) {
        if (!ticket.checked_in) continue;
        if (statusFilter === "recent" && checkedInAtMs(ticket) < cutoff) {
          continue;
        }
        flat.push({
          ...ticket,
          rsvpId: rsvp.id,
          lead_name: rsvp.lead_name,
          email: rsvp.email,
          inviteLabel,
        });
      }
    }

    flat.sort((a, b) => checkedInAtMs(b) - checkedInAtMs(a));

    return flat.filter((ticket) =>
      ticketMatchesQuery(query, ticket.lead_name, ticket.inviteLabel, [ticket])
    );
  }, [rsvps, statusFilter, query, showArrivalOrder]);

  const groupedRsvps = useMemo(() => {
    if (showArrivalOrder) return [] as RsvpListItem[];

    return rsvps
      .map((rsvp) => {
        const tickets = (rsvp.tickets ?? []).filter((ticket) => {
          if (statusFilter === "out") return !ticket.checked_in;
          return true;
        });
        return { ...rsvp, tickets };
      })
      .filter((rsvp) => {
        if (!rsvp.tickets.length) return false;
        return ticketMatchesQuery(
          query,
          rsvp.lead_name,
          rsvp.invites?.label ?? rsvp.invites?.slug ?? "",
          rsvp.tickets
        );
      });
  }, [rsvps, statusFilter, query, showArrivalOrder]);

  const counts: Record<StatusFilter, number> = {
    all: allTickets.length,
    recent: recentCount,
    in: checkedInTickets.length,
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

  function filterButtonClass(key: StatusFilter, active: boolean) {
    if (!active) {
      return "bg-slate-800 text-slate-400 ring-1 ring-slate-700 hover:bg-slate-700";
    }
    if (key === "recent") return "bg-sky-600 text-white";
    if (key === "in") return "bg-emerald-600 text-white";
    if (key === "out") return "bg-amber-600 text-white";
    return "bg-indigo-600 text-white";
  }

  const emptyMessage =
    statusFilter === "recent"
      ? "No check-ins in the last 30 minutes."
      : statusFilter === "in"
        ? "No checked-in guests yet."
        : statusFilter === "out"
          ? "Everyone on the list has checked in."
          : "No RSVPs match your search.";

  const listEmpty = showArrivalOrder
    ? arrivalTickets.length === 0
    : groupedRsvps.length === 0;

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
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filterButtonClass(
                f.key,
                statusFilter === f.key
              )}`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
      </div>

      {showArrivalOrder && (
        <p className="text-xs text-slate-500">
          {statusFilter === "recent"
            ? "Latest arrivals from the last 30 minutes — newest first."
            : "All checked-in guests — newest arrival first."}
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
          {error}
        </p>
      )}

      {listEmpty ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : showArrivalOrder ? (
        <div className="overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800">
          <div className="divide-y divide-slate-800/50">
            {arrivalTickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 shrink-0 text-xs tabular-nums text-slate-600">
                    {index + 1}
                  </span>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {ticket.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {ticket.inviteLabel}
                      {showEmail && ticket.email ? ` · ${ticket.email}` : ""}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-emerald-400">
                  In · <LocalTime iso={ticket.checked_in_at} />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedRsvps.map((rsvp) => (
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
