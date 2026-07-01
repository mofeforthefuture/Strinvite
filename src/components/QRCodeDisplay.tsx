"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QRCodeDisplay({ code }: { code: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, code, {
      width: 260,
      margin: 2,
      color: { dark: "#111827", light: "#ffffff" },
    });
  }, [code]);

  return <canvas ref={canvasRef} className="rounded-xl" />;
}
