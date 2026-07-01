"use client";

import { useFormStatus } from "react-dom";
import { deleteEvent } from "./actions";

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      formAction={deleteEvent}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Deleting
          <span className="inline-flex gap-0.5">
            <span className="animate-bounce [animation-delay:0ms] h-1 w-1 rounded-full bg-white" />
            <span className="animate-bounce [animation-delay:150ms] h-1 w-1 rounded-full bg-white" />
            <span className="animate-bounce [animation-delay:300ms] h-1 w-1 rounded-full bg-white" />
          </span>
        </>
      ) : (
        "Delete event"
      )}
    </button>
  );
}

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  return (
    <form
      onSubmit={(e) => {
        if (!confirm("Delete this event and all its invites and RSVPs?"))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <DeleteButton />
    </form>
  );
}
