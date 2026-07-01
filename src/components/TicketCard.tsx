"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";

type Props = {
  name: string;
  confirmationCode: string;
  eventName: string;
  eventDate?: string | null;
  venue?: string | null;
};

export default function TicketCard({
  name,
  confirmationCode,
  eventName,
  eventDate,
  venue,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, confirmationCode, {
      width: 200,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
  }, [confirmationCode]);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `ticket-${confirmationCode}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={cardRef}
        className="w-64 overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-slate-700"
        style={{ fontFamily: "sans-serif" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-75">
            Event ticket
          </p>
          <p className="mt-0.5 text-sm font-bold leading-tight">{eventName}</p>
          {(eventDate || venue) && (
            <p className="mt-0.5 text-[10px] opacity-75">
              {venue}
              {venue && eventDate && " · "}
              {eventDate && new Date(eventDate).toLocaleString()}
            </p>
          )}
        </div>

        {/* Body — keep white for QR scanability */}
        <div className="flex flex-col items-center gap-2 bg-white px-4 py-4">
          <canvas ref={canvasRef} className="rounded-lg" />
          <p className="text-center text-sm font-bold text-slate-900">{name}</p>
          <p className="font-mono text-xs font-bold tracking-widest text-indigo-600">
            {confirmationCode}
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 text-center text-[10px] text-slate-500">
          Single-use · Do not share
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50 transition-colors"
      >
        {downloading ? "Saving…" : "⬇ Download ticket"}
      </button>
    </div>
  );
}
