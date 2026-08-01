"use client";

import { useMemo, useState } from "react";
import { deactivateInvite, reactivateInvite } from "./actions";
import CopyButton from "./CopyButton";
import DeleteInviteButton from "./DeleteInviteButton";
import ActionButton from "@/components/ActionButton";

type InviteStatus = "Open" | "Expired" | "Full" | "Deactivated";

export type InviteWithStatus = {
  id: string;
  label: string | null;
  max_guests: number;
  expires_at: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  used: number;
  remaining: number;
  expired: boolean;
  full: boolean;
  dead: boolean;
  status: InviteStatus;
  unconfirmedExtras: number;
};

type FilterKey = "All" | InviteStatus | "Unconfirmed";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "All", label: "All" },
  { key: "Open", label: "Open" },
  { key: "Full", label: "Full" },
  { key: "Expired", label: "Expired · seats left" },
  { key: "Unconfirmed", label: "Unconfirmed extras" },
  { key: "Deactivated", label: "Deactivated" },
];

const PAGE_SIZE = 8;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function seatLabel(n: number) {
  return n === 1 ? "1 seat" : `${n} seats`;
}

function helperText(invite: InviteWithStatus) {
  if (invite.unconfirmedExtras > 0) {
    const n = invite.unconfirmedExtras;
    const extras = n === 1 ? "1 unconfirmed extra seat" : `${n} unconfirmed extra seats`;
    return `${invite.used} / ${invite.max_guests} guests · ${extras}`;
  }
  if (invite.status === "Full") {
    return invite.expired
      ? `Complete · link ended ${formatDate(invite.expires_at)}`
      : `Complete · ${invite.used} / ${invite.max_guests} guests`;
  }
  if (invite.status === "Expired") {
    return `Link expired · ${seatLabel(invite.remaining)} unused`;
  }
  if (invite.status === "Deactivated") {
    return invite.remaining > 0
      ? `Deactivated · ${seatLabel(invite.remaining)} unused`
      : `Deactivated · ${invite.used} / ${invite.max_guests} guests`;
  }
  // Open
  return `Expires ${formatDateTime(invite.expires_at)} · ${seatLabel(invite.remaining)} left`;
}

function badgeClass(status: InviteStatus) {
  switch (status) {
    case "Open":
      return "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20";
    case "Full":
      return "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20";
    case "Expired":
      return "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20";
    case "Deactivated":
      return "bg-slate-800 text-slate-500 ring-1 ring-slate-700";
  }
}

export default function InvitesList({
  eventId,
  siteUrl,
  event,
  invites,
}: {
  eventId: string;
  siteUrl: string;
  event: { tagline: string | null; venue: string | null; event_date: string | null };
  invites: InviteWithStatus[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterKey>("All");
  const [page, setPage] = useState(1);

  const statusCounts = useMemo(() => {
    const counts: Record<InviteStatus, number> = {
      Open: 0,
      Full: 0,
      Expired: 0,
      Deactivated: 0,
    };
    let unconfirmed = 0;
    for (const invite of invites) {
      counts[invite.status] += 1;
      if (invite.unconfirmedExtras > 0) unconfirmed += 1;
    }
    return { ...counts, Unconfirmed: unconfirmed };
  }, [invites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invites.filter((invite) => {
      const matchesQuery =
        !q ||
        (invite.label ?? "").toLowerCase().includes(q) ||
        invite.slug.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Unconfirmed"
            ? invite.unconfirmedExtras > 0
            : invite.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [invites, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  if (!invites.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
        No invite links yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search by label or link..."
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const count =
              f.key === "All"
                ? invites.length
                : f.key === "Unconfirmed"
                  ? statusCounts.Unconfirmed
                  : statusCounts[f.key as InviteStatus];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setStatusFilter(f.key);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === f.key
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 ring-1 ring-slate-700 hover:bg-slate-700"
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {!filtered.length ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
          No invite links match your search.
        </div>
      ) : (
        <ul className="space-y-3">
          {paginated.map((invite) => (
            <li key={invite.id} className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-100 truncate">
                    {invite.label || "Invite link"}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-xs text-slate-500 truncate">
                      {siteUrl}/rsvp/{invite.slug}
                    </p>
                    <CopyButton
                      tagline={event.tagline}
                      venue={event.venue}
                      eventDate={event.event_date}
                      expiresAt={invite.expires_at}
                      link={`${siteUrl}/rsvp/${invite.slug}`}
                    />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>
                      {invite.used} / {invite.max_guests} guests
                    </span>
                    <span>{helperText(invite)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {invite.unconfirmedExtras > 0 && (
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-400 ring-1 ring-violet-500/20">
                      Unconfirmed extras
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(invite.status)}`}
                  >
                    {invite.status === "Expired" ? "Expired · seats left" : invite.status}
                  </span>
                  {invite.is_active ? (
                    <form>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <input type="hidden" name="eventId" value={eventId} />
                      <ActionButton
                        action={deactivateInvite}
                        variant="link-danger"
                        loadingText="Deactivating"
                        style="dots"
                      >
                        Deactivate
                      </ActionButton>
                    </form>
                  ) : (
                    <form>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <input type="hidden" name="eventId" value={eventId} />
                      <ActionButton
                        action={reactivateInvite}
                        loadingText="Reactivating"
                        style="dots"
                        className="!text-emerald-400 hover:!text-emerald-300"
                      >
                        Reactivate
                      </ActionButton>
                    </form>
                  )}
                  <DeleteInviteButton inviteId={invite.id} eventId={eventId} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
