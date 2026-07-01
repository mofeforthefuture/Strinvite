"use client";

import { useEffect, useRef, useState } from "react";

type Result =
  | { ok: true; lead_name: string; party_size: number; guest_names: string[] }
  | { ok: false; reason: "already_used" | "invalid" | "scanning_disabled" };

type Props = { eventId: string };

export default function QRScanner({ eventId }: Props) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [scanning, setScanning] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function startScanner() {
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    setScanning(true);

    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (decodedText) => {
        await scanner.stop();
        setScanning(false);
        await handleScan(decodedText);
      },
      () => {}
    );
  }

  async function handleScan(code: string) {
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setResult(data);

    resetTimer.current = setTimeout(() => {
      setResult(null);
    }, 4000);
  }

  function resetAndScan() {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setResult(null);
    startScanner();
  }

  const reasonLabel: Record<string, string> = {
    already_used: "Already checked in",
    invalid: "Invalid ticket",
    scanning_disabled: "Scanning is paused by admin",
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {!scanning && !result && (
        <button
          onClick={startScanner}
          className="rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Start camera
        </button>
      )}

      <div
        id="qr-reader"
        className={`overflow-hidden rounded-xl ${scanning ? "block w-72" : "hidden"}`}
      />

      {result && (
        <div
          className={`w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl ring-1 ${
            result.ok
              ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
              : "bg-red-500/10 text-red-400 ring-red-500/20"
          }`}
        >
          {result.ok ? (
            <>
              <p className="text-4xl font-bold">✓</p>
              <p className="mt-2 text-xl font-semibold text-emerald-300">{result.lead_name}</p>
              <p className="mt-1 text-lg text-emerald-400">
                Party of {result.party_size}
              </p>
              {result.guest_names.length > 0 && (
                <p className="mt-1 text-sm text-emerald-500">
                  {result.guest_names.join(", ")}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-4xl font-bold">✗</p>
              <p className="mt-2 text-lg font-semibold text-red-300">
                {reasonLabel[result.reason] ?? "Error"}
              </p>
            </>
          )}
          <button
            onClick={resetAndScan}
            className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Scan next
          </button>
        </div>
      )}
    </div>
  );
}
