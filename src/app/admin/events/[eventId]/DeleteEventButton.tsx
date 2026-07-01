"use client";

import { deleteEvent } from "./actions";

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  return (
    <form
      onSubmit={(e) => {
        if (!confirm("Delete this event and all its invites and RSVPs?"))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <button
        formAction={deleteEvent}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Delete event
      </button>
    </form>
  );
}
