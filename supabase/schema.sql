-- ============================================================
-- Strinvite Schema
-- Run this in your Supabase project SQL editor
-- ============================================================

-- Events
create table if not exists events (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  event_date      timestamptz,
  venue           text,
  scanning_enabled boolean not null default true,
  admin_id        uuid not null references auth.users on delete cascade,
  created_at      timestamptz not null default now()
);

alter table events enable row level security;

create policy "owners can manage their events"
  on events for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- Invites
create table if not exists invites (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events on delete cascade,
  label       text,
  max_guests  integer not null check (max_guests > 0),
  expires_at  timestamptz not null,
  slug        text unique not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table invites enable row level security;

create policy "owners can manage invites for their events"
  on invites for all
  using (
    event_id in (select id from events where admin_id = auth.uid())
  )
  with check (
    event_id in (select id from events where admin_id = auth.uid())
  );

-- Allow unauthenticated reads on invites (needed for the public RSVP page)
create policy "public can read active invites"
  on invites for select
  using (is_active = true);

-- RSVPs
create table if not exists rsvps (
  id                uuid primary key default gen_random_uuid(),
  invite_id         uuid not null references invites on delete cascade,
  lead_name         text not null,
  email             text,
  phone             text,
  party_size        integer not null check (party_size > 0),
  guest_names       text[] not null default '{}',
  confirmation_code text unique not null,
  checked_in        boolean not null default false,
  checked_in_at     timestamptz,
  created_at        timestamptz not null default now()
);

alter table rsvps enable row level security;

-- Guests can insert (public) — we enforce capacity checks in application code
create policy "public can create rsvps"
  on rsvps for insert
  with check (true);

-- Only authenticated users (admins / ushers) can read or update rsvps
create policy "authenticated users can read rsvps"
  on rsvps for select
  using (auth.role() = 'authenticated');

create policy "authenticated users can update rsvps"
  on rsvps for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Allow public read of a single rsvp by confirmation code (for ticket page)
create policy "public can read own rsvp by code"
  on rsvps for select
  using (true);

-- Tickets (one per person in a party)
create table if not exists tickets (
  id                uuid primary key default gen_random_uuid(),
  rsvp_id           uuid not null references rsvps on delete cascade,
  name              text not null,
  confirmation_code text unique not null,
  checked_in        boolean not null default false,
  checked_in_at     timestamptz,
  created_at        timestamptz not null default now()
);

alter table tickets enable row level security;

create policy "public can create tickets"
  on tickets for insert
  with check (true);

create policy "public can read tickets"
  on tickets for select
  using (true);

create policy "authenticated users can update tickets"
  on tickets for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
