"use client";

import { deleteInvite } from "./actions";
import ActionButton from "@/components/ActionButton";

export default function DeleteInviteButton({
  inviteId,
  eventId,
}: {
  inviteId: string;
  eventId: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        if (!confirm("Delete this invite link permanently? This cannot be undone."))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="inviteId" value={inviteId} />
      <input type="hidden" name="eventId" value={eventId} />
      <ActionButton action={deleteInvite} variant="link-danger" loadingText="Deleting" style="dots">
        Delete
      </ActionButton>
    </form>
  );
}
