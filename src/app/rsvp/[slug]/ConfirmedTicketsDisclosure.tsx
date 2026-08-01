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
    <details className="group mb-6 overflow-hidden rounded-2xl border-2 border-[#C5A55A] bg-[#FFF9E8] shadow-md open:shadow-lg">
      <summary className="cursor-pointer list-none px-4 py-4 sm:px-5 sm:py-5 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-left">
            <span className="block text-base font-bold text-[#2D2417] sm:text-lg">
              Already confirmed · {count} ticket{count === 1 ? "" : "s"}
            </span>
            <span className="mt-1 inline-flex items-center rounded-lg bg-[#C5A55A] px-3 py-1.5 text-sm font-bold text-white sm:mt-1.5">
              Tap to view &amp; re-download
            </span>
          </span>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C5A55A] text-lg font-bold text-white transition-transform group-open:rotate-180"
            aria-hidden
          >
            ▾
          </span>
        </span>
      </summary>
      <div className="border-t-2 border-[#C5A55A]/40 bg-white px-3 py-5 sm:px-5">
        <p className="mb-5 text-center text-sm font-medium text-[#5C4D3C]">
          Same ticket codes and QR as before. Download again if you need a copy.
        </p>
        <div className="flex flex-col items-center gap-5">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="w-full max-w-72">
              <p className="mb-2 text-center text-xs font-semibold text-[#5C4D3C]">
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
