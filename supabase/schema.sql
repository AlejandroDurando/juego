-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Rooms table
create table if not exists rooms (
    id uuid primary key default uuid_generate_v4(),
    code text unique not null,
    status text not null default 'waiting', -- waiting, active, finished
    game_length int not null default 5, -- 5, 10, 15
    current_level int not null default 1, -- 1, 2, 3
    score int not null default 0,
    turn_player uuid,
    created_at timestamptz not null default now()
);

-- Players table
create table if not exists players (
    id uuid primary key default uuid_generate_v4(),
    room_id uuid not null references rooms(id) on delete cascade,
    device_id text not null,
    role text not null, -- host, guest
    nickname text,
    joined_at timestamptz not null default now()
);

-- Turns table
create table if not exists turns (
    id uuid primary key default uuid_generate_v4(),
    room_id uuid not null references rooms(id) on delete cascade,
    actor_player uuid not null references players(id) on delete cascade,
    answers_turn_id uuid references turns(id) on delete cascade,
    answer_text text,
    answer_pose_id text,
    answer_variant text,
    answer_media_url text,
    new_question_id text,
    new_question_text text not null,
    level int not null,
    created_at timestamptz not null default now()
);

-- Favorites table
create table if not exists favorites (
    id uuid primary key default uuid_generate_v4(),
    room_id uuid not null references rooms(id) on delete cascade,
    turn_id uuid not null references turns(id) on delete cascade,
    marked_by uuid not null references players(id) on delete cascade,
    created_at timestamptz not null default now()
);

-- Chat messages table
create table if not exists chat_messages (
    id uuid primary key default uuid_generate_v4(),
    room_id uuid not null references rooms(id) on delete cascade,
    favorite_id uuid references favorites(id) on delete cascade,
    sender uuid not null references players(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now()
);

-- Row Level Security (RLS)
alter table rooms enable row level security;
alter table players enable row level security;
alter table turns enable row level security;
alter table favorites enable row level security;
alter table chat_messages enable row level security;

-- Policies allowing access to 'anon' role (public read/write)
-- For a true production app without auth we rely on room codes being unguessable.
create policy "Allow public access to rooms" on rooms for all to anon using (true) with check (true);
create policy "Allow public access to players" on players for all to anon using (true) with check (true);
create policy "Allow public access to turns" on turns for all to anon using (true) with check (true);
create policy "Allow public access to favorites" on favorites for all to anon using (true) with check (true);
create policy "Allow public access to chat_messages" on chat_messages for all to anon using (true) with check (true);

-- Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table turns;
alter publication supabase_realtime add table favorites;
alter publication supabase_realtime add table chat_messages;
