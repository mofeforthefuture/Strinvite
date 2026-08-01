"use client";

import TicketCard from "@/components/TicketCard";

export type ConfirmedTicket = {
  id: string;
  name: string;
  confirmation_code: string;
  lead_name: string;
};

export default function ConfirmedTicketsDisclosure({
  tickets,
  eventName,
  eventDate,
  venue,
}: {
  tickets: ConfirmedTicket[];
  eventName: string;
  eventDate?: string | null;
  venue?: string | null;
}) {
  if (!tickets.length) return null;

  const count = tickets.length;

  return (
    <details className="mb-6 rounded-xl border border-[#C5A55A]/25 bg-white/80 open:shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm text-[#5C4D3C] marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          <span>
            Already confirmed · {count} ticket{count === 1 ? "" : "s"}
            <span className="ml-1.5 text-[#C5A55A]">View &amp; re-download</span>
          </span>
          <span className="text-xs text-[#C5A55A]/80" aria-hidden>
            ▾
          </span>
        </span>
      </summary>
      <div className="border-t border-[#C5A55A]/15 px-3 py-4 sm:px-4">
        <p className="mb-4 text-center text-xs text-[#8A7B6A]">
          Same ticket codes and QR as before. Download again if you need a copy.
        </p>
        <div className="flex flex-col items-center gap-5">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="w-full max-w-72">
              <p className="mb-2 text-center text-[11px] text-[#8A7B6A]">
                {ticket.lead_name}
              </p>
              <TicketCard
                name={ticket.name}
                confirmationCode={ticket.confirmation_code}
                eventName={eventName}
                eventDate={eventDate}
                venue={venue}
                tone="onLight"
              />
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
