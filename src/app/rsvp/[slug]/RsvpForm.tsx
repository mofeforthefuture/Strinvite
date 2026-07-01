"use client";

import { useState } from "react";

type Props = {
  slug: string;
  maxGuests: number;
  submitAction: (formData: FormData) => Promise<void>;
};

export default function RsvpForm({ slug, maxGuests, submitAction }: Props) {
  const [partySize, setPartySize] = useState(1);

  return (
    <form action={submitAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-md">
      <input type="hidden" name="slug" value={slug} />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Your name *
        </label>
        <input
          name="lead_name"
          type="text"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Email (optional)
        </label>
        <input
          name="email"
          type="email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Phone (optional)
        </label>
        <input
          name="phone"
          type="tel"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Party size *{" "}
          <span className="font-normal text-gray-400">(max {maxGuests})</span>
        </label>
        <select
          name="party_size"
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <p className="text-sm font-medium text-gray-700">
            Guest names{" "}
            <span className="font-normal text-gray-400">— each person gets their own ticket</span>
          </p>
          {Array.from({ length: partySize - 1 }, (_, i) => (
            <input
              key={i}
              name={`guest_name_${i}`}
              type="text"
              required
              placeholder={`Guest ${i + 2} full name`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Confirm RSVP →
      </button>
    </form>
  );
}
