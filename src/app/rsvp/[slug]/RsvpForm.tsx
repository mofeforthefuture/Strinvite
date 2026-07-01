"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function RsvpSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full overflow-hidden rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Securing your spot
          <span className="inline-flex gap-0.5">
            <span className="animate-bounce [animation-delay:0ms] h-1.5 w-1.5 rounded-full bg-white" />
            <span className="animate-bounce [animation-delay:150ms] h-1.5 w-1.5 rounded-full bg-white" />
            <span className="animate-bounce [animation-delay:300ms] h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          Confirm RSVP
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      )}
    </button>
  );
}

type Props = {
  slug: string;
  maxGuests: number;
  submitAction: (formData: FormData) => Promise<void>;
};

export default function RsvpForm({ slug, maxGuests, submitAction }: Props) {
  const [partySize, setPartySize] = useState(1);

  return (
    <form action={submitAction} className="space-y-4 rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800 shadow-2xl">
      <input type="hidden" name="slug" value={slug} />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          Your name *
        </label>
        <input
          name="lead_name"
          type="text"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          Phone (optional)
        </label>
        <input
          name="phone"
          type="tel"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          Party size *{" "}
          <span className="font-normal text-slate-500">(max {maxGuests})</span>
        </label>
        <select
          name="party_size"
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "person" : "people"}
            </option>
          ))}
        </select>
      </div>

      {partySize > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-300">
            Guest names{" "}
            <span className="font-normal text-slate-500">— each person gets their own ticket</span>
          </p>
          {Array.from({ length: partySize - 1 }, (_, i) => (
            <input
              key={i}
              name={`guest_name_${i}`}
              type="text"
              required
              placeholder={`Guest ${i + 2} full name`}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          ))}
        </div>
      )}

      <RsvpSubmitButton />
    </form>
  );
}
