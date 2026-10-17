-- 0037: Friends group chat. Safe to run more than once. Run after 0036.
--  • A group is a named chat of friends (up to 25). Anyone can start one and add their own friends. Only the group's
--    maker can remove people; anyone can leave.
--  • Messages are text, a photo, a recipe video (a TikTok / Instagram / YouTube link with the ingredients and steps typed in by whoever shares it), or a game card: a Cook Off or Use-It-Up invite (with Join), or Guess the Cook ('cookoff' / 'uiu' / 'guess').
--    Game cards are made by send_chat_game, which checks the game is really yours; the card's details come from the database, not the phone.
--  • Safety: report a message (it vanishes for you right away, and for everyone after 2 different reporters; admins can
--    see reports), mute a person (their messages are hidden for you), mute a group's notifications.
--  • Photos live in their own private bucket, 'chat-photos', and only the group's members can open them.
--  • Chat backgrounds: a small shop of looks for your own view of a chat, paid for with coins. Cosmetic only: they change nothing in any game.
-- Everything goes through the functions below; the tables can't be read or written directly.

create table if not exists public.chat_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 30),
  owner uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_at timestamptz not null default now()
);
create table if not exists public.chat_members (
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  muted boolean not null default false,            -- no push notifications from this group
  last_read_at timestamptz not null default now(),
  last_push_at timestamptz,                        -- at most one push per group per 5 minutes
  primary key (group_id, user_id)
);
create index if not exists chat_members_user_idx on public.chat_members (user_id);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  sender uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'text',
  body text,
  photo_path text,
  meta jsonb,
  hidden_at timestamptz,
  pushed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chat_messages_kind_ck check (kind in ('text', 'photo', 'cookoff', 'uiu', 'guess', 'video')),
  constraint chat_messages_body_ck check (body is null or char_length(body) <= 500),
  constraint chat_messages_photo_ck check (photo_path is null or char_length(photo_path) <= 200),
  constraint chat_messages_shape_ck check ((kind = 'text' and body is not null and btrim(body) <> '') or (kind = 'photo' and photo_path is not null) or (kind in ('cookoff', 'uiu', 'guess', 'video') and meta is not null))
);
create index if not exists chat_messages_group_idx on public.chat_messages (group_id, created_at desc);
create index if not exists chat_messages_photo_idx on public.chat_messages (photo_path) where photo_path is not null;
create table if not exists public.chat_reports (
  message_id uuid not null references public.chat_messages (id) on delete cascade,
  reporter uuid not null references auth.users (id) on delete cascade,
  reason text not null default 'other' check (reason in ('spam', 'rude', 'unsafe', 'other')),
  created_at timestamptz not null default now(),
  primary key (message_id, reporter)
);
create table if not exists public.chat_mutes (
  user_id uuid not null references auth.users (id) on delete cascade,
  muted_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, muted_id),
  check (user_id <> muted_id)
);
alter table public.chat_groups enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_reports enable row level security;
alter table public.chat_mutes enable row level security;
-- no policies: only the functions below (security definer) touch these tables
revoke all on public.chat_groups, public.chat_members, public.chat_messages, public.chat_reports, public.chat_mutes from anon, authenticated;

create or replace function public._in_chat(g uuid, u uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select u is not null and exists (select 1 from chat_members where group_id = g and user_id = u);
$$;
create or replace function public._chat_name(u uuid) returns text language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(nullif(btrim((select display_name from profiles where id = u)), ''), 'Chef');
$$;

-- start a group; p_codes = friend codes to add right away (they must be your friends)
create or replace function public.create_chat(p_name text, p_codes text[] default '{}') returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); gid uuid; nm text := btrim(coalesce(p_name, '')); c text; other uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if char_length(nm) < 1 or char_length(nm) > 30 then raise exception 'give the group a name (up to 30 letters)'; end if;
  if (select count(*) from chat_groups where owner = uid) >= 10 then raise exception 'you already made 10 groups'; end if;
  if (select count(*) from chat_members where user_id = uid) >= 30 then raise exception 'you are in too many groups'; end if;
  if coalesce(array_length(p_codes, 1), 0) > 24 then raise exception 'too many people at once'; end if;
  insert into chat_groups (name, owner) values (nm, uid) returning id into gid;
  insert into chat_members (group_id, user_id) values (gid, uid);
  foreach c in array coalesce(p_codes, '{}') loop
    select id into other from profiles where ref_code = upper(btrim(c));
    if other is not null and other <> uid and _are_friends(uid, other) then
      insert into chat_members (group_id, user_id) values (gid, other) on conflict do nothing;
    end if;
  end loop;
  return gid;
end $$;

-- any member can add one of their own friends
create or replace function public.add_to_chat(p_group uuid, p_code text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); other uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not _in_chat(p_group, uid) then raise exception 'not in that group'; end if;
  select id into other from profiles where ref_code = upper(btrim(p_code));
  if other is null or not _are_friends(uid, other) then raise exception 'you can only add your friends'; end if;
  if _in_chat(p_group, other) then return; end if;
  if (select count(*) from chat_members where group_id = p_group) >= 25 then raise exception 'the group is full (25)'; end if;
  if (select count(*) from chat_members where user_id = other) >= 30 then raise exception 'they are in too many groups'; end if;
  insert into chat_members (group_id, user_id) values (p_group, other) on conflict do nothing;
end $$;

-- leave; the oldest member takes over if the maker leaves, and an empty group is deleted
create or replace function public.leave_chat(p_group uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); nxt uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from chat_members where group_id = p_group and user_id = uid;
  if not found then return; end if;
  select user_id into nxt from chat_members where group_id = p_group order by joined_at, user_id limit 1;
  if nxt is null then delete from chat_groups where id = p_group;
  elsif (select owner from chat_groups where id = p_group) = uid then update chat_groups set owner = nxt where id = p_group;
  end if;
end $$;

create or replace function public.remove_from_chat(p_group uuid, p_code text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); other uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if (select owner from chat_groups where id = p_group) is distinct from uid then raise exception 'only the person who made the group can remove people'; end if;
  select id into other from profiles where ref_code = upper(btrim(p_code));
  if other is null or other = uid then raise exception 'pick someone else'; end if;
  delete from chat_members where group_id = p_group and user_id = other;
end $$;

create or replace function public.set_chat_muted(p_group uuid, p_on boolean) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  update chat_members set muted = coalesce(p_on, false) where group_id = p_group and user_id = uid;
  return coalesce(p_on, false);
end $$;

-- hide one person's messages for you (and stop their pushes)
create or replace function public.set_chat_user_muted(p_code text, p_on boolean) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); other uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select id into other from profiles where ref_code = upper(btrim(p_code));
  if other is null or other = uid then raise exception 'pick someone else'; end if;
  if p_on then
    if (select count(*) from chat_mutes where user_id = uid) >= 100 then raise exception 'too many muted people'; end if;
    insert into chat_mutes (user_id, muted_id) values (uid, other) on conflict do nothing;
  else delete from chat_mutes where user_id = uid and muted_id = other; end if;
  return coalesce(p_on, false);
end $$;

-- send a text or a photo (the photo is already uploaded into your own folder of chat-photos)
create or replace function public.send_chat(p_group uuid, p_kind text, p_body text default null, p_photo text default null) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); b text := nullif(btrim(coalesce(p_body, '')), ''); m chat_messages%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not _in_chat(p_group, uid) then raise exception 'not in that group'; end if;
  if p_kind not in ('text', 'photo') then raise exception 'unknown message type'; end if;
  if b is not null and char_length(b) > 500 then raise exception 'that message is too long (500 letters)'; end if;
  if p_kind = 'text' and b is null then raise exception 'write something first'; end if;
  if p_kind = 'photo' then
    if p_photo is null or (storage.foldername(p_photo))[1] is distinct from uid::text
       or not exists (select 1 from storage.objects o where o.bucket_id = 'chat-photos' and o.name = p_photo) then raise exception 'that photo did not upload'; end if;
    if (select count(*) from chat_messages where sender = uid and kind = 'photo' and created_at > now() - interval '1 day') >= 40 then raise exception 'that is plenty of photos for today'; end if;
    if char_length(b) > 200 then raise exception 'photo captions are up to 200 letters'; end if;
  end if;
  if (select count(*) from chat_messages where sender = uid and created_at > now() - interval '1 minute') >= 20 then raise exception 'slow down a little'; end if;
  insert into chat_messages (group_id, sender, kind, body, photo_path) values (p_group, uid, p_kind, b, case when p_kind = 'photo' then p_photo end) returning * into m;
  update chat_groups set last_at = m.created_at where id = p_group;
  update chat_members set last_read_at = m.created_at where group_id = p_group and user_id = uid;
  return jsonb_build_object('id', m.id, 'at', m.created_at);
end $$;

-- post a game card into a group. Cook Off / Use-It-Up: pass the code of a game you are hosting that is still open. Guess the Cook: no code; it shows today's score if you have played.
create or replace function public.send_chat_game(p_group uuid, p_kind text, p_code text default null) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); meta jsonb; m chat_messages%rowtype; g cookoff_games%rowtype; u uiu_matches%rowtype; pl int; rt int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not _in_chat(p_group, uid) then raise exception 'not in that group'; end if;
  if p_kind not in ('cookoff', 'uiu', 'guess') then raise exception 'unknown game'; end if;
  if (select count(*) from chat_messages where sender = uid and kind in ('cookoff', 'uiu', 'guess') and created_at > now() - interval '1 hour') >= 10 then raise exception 'that is plenty of game invites for now'; end if;
  if p_kind = 'cookoff' then
    select * into g from cookoff_games where code = upper(btrim(coalesce(p_code, ''))) and host = uid and status = 'lobby' and created_at > now() - interval '6 hours';
    if not found then raise exception 'start a Cook Off first'; end if;
    meta := jsonb_build_object('code', g.code, 'minutes', g.minutes);
  elsif p_kind = 'uiu' then
    select * into u from uiu_matches where code = upper(btrim(coalesce(p_code, ''))) and host = uid and status = 'open' and created_at > now() - interval '48 hours';
    if not found then raise exception 'start a Use-It-Up Week first'; end if;
    meta := jsonb_build_object('code', u.code, 'mode', u.mode);
  else
    select count(*), count(*) filter (where correct) into pl, rt from cook_guesses where user_id = uid and day = _user_today(uid);
    meta := case when pl > 0 then jsonb_build_object('played', pl, 'right', rt) else '{}'::jsonb end;
  end if;
  insert into chat_messages (group_id, sender, kind, meta) values (p_group, uid, p_kind, meta) returning * into m;
  update chat_groups set last_at = m.created_at where id = p_group;
  update chat_members set last_read_at = m.created_at where group_id = p_group and user_id = uid;
  return jsonb_build_object('id', m.id, 'at', m.created_at);
end $$;

-- share a recipe video: a TikTok, Instagram or YouTube link plus the ingredients and steps (typed by the sharer; nothing is read from the video by a machine)
create or replace function public.send_chat_video(p_group uuid, p_url text, p_title text default null, p_ingredients text[] default '{}', p_steps text[] default '{}') returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); u text := btrim(coalesce(p_url, '')); mm text[]; plat text; ref text; sub text; meta jsonb; m chat_messages%rowtype; ing jsonb; stp jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not _in_chat(p_group, uid) then raise exception 'not in that group'; end if;
  if char_length(u) > 300 then raise exception 'that link is too long'; end if;
  mm := regexp_match(u, '^https://(?:www\.|m\.)?tiktok\.com/@[A-Za-z0-9._-]{1,40}/video/([0-9]{6,25})');
  if mm is not null then plat := 'tiktok'; ref := mm[1]; end if;
  if plat is null then
    mm := regexp_match(u, '^https://(?:www\.)?instagram\.com/(reel|reels|p|tv)/([A-Za-z0-9_-]{5,20})');
    if mm is not null then plat := 'instagram'; sub := case when mm[1] in ('reel', 'reels') then 'reel' else 'p' end; ref := mm[2]; end if;
  end if;
  if plat is null then
    mm := regexp_match(u, '^https://(?:www\.|m\.)?youtube\.com/shorts/([A-Za-z0-9_-]{11})');
    if mm is null then mm := regexp_match(u, '^https://youtu\.be/([A-Za-z0-9_-]{11})'); end if;
    if mm is null then mm := regexp_match(u, '^https://(?:www\.|m\.)?youtube\.com/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})'); end if;
    if mm is not null then plat := 'youtube'; ref := mm[1]; end if;
  end if;
  if plat is null then raise exception 'paste the full link to a TikTok, Instagram or YouTube video'; end if;
  if (select count(*) from chat_messages where sender = uid and kind = 'video' and created_at > now() - interval '1 hour') >= 10 then raise exception 'that is plenty of videos for now'; end if;
  select coalesce(jsonb_agg(left(t, 80)), '[]'::jsonb) into ing from (select btrim(x) t from unnest(coalesce(p_ingredients, '{}')) x where btrim(x) <> '' limit 30) q;
  select coalesce(jsonb_agg(left(t, 240)), '[]'::jsonb) into stp from (select btrim(x) t from unnest(coalesce(p_steps, '{}')) x where btrim(x) <> '' limit 20) q;
  meta := jsonb_build_object('platform', plat, 'ref', ref, 'sub', sub, 'title', nullif(left(btrim(coalesce(p_title, '')), 80), ''), 'ingredients', ing, 'steps', stp);
  insert into chat_messages (group_id, sender, kind, meta) values (p_group, uid, 'video', meta) returning * into m;
  update chat_groups set last_at = m.created_at where id = p_group;
  update chat_members set last_read_at = m.created_at where group_id = p_group and user_id = uid;
  return jsonb_build_object('id', m.id, 'at', m.created_at);
end $$;

-- how a game card looks right now (so a finished game stops saying Join)
create or replace function public._chat_game_state(p_kind text, p_meta jsonb) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare st text; n int;
begin
  if p_kind = 'cookoff' then
    select g.status, (select count(*) from cookoff_players p where p.game_id = g.id)::int into st, n from cookoff_games g where g.code = p_meta ->> 'code';
    if st = 'lobby' and exists (select 1 from cookoff_games g where g.code = p_meta ->> 'code' and g.created_at < now() - interval '6 hours') then st := 'cancelled'; end if;
  elsif p_kind = 'uiu' then
    select m.status, case when m.guest is null then 1 else 2 end into st, n from uiu_matches m where m.code = p_meta ->> 'code';
    if st = 'open' and exists (select 1 from uiu_matches m where m.code = p_meta ->> 'code' and m.created_at < now() - interval '48 hours') then st := 'cancelled'; end if;
  else return null; end if;
  return jsonb_build_object('status', coalesce(st, 'cancelled'), 'n', coalesce(n, 0));
end $$;

create or replace function public.delete_chat_message(p_msg uuid) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from chat_messages where id = p_msg and sender = uid;
end $$;

-- report a message from someone else in a group you are in
create or replace function public.report_chat_message(p_msg uuid, p_reason text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m chat_messages%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from chat_messages where id = p_msg;
  if not found or m.sender = uid or not _in_chat(m.group_id, uid) then raise exception 'nothing to report'; end if;
  insert into chat_reports (message_id, reporter, reason) values (p_msg, uid, case when p_reason in ('spam', 'rude', 'unsafe') then p_reason else 'other' end) on conflict do nothing;
  if (select count(*) from chat_reports where message_id = p_msg) >= 2 then update chat_messages set hidden_at = coalesce(hidden_at, now()) where id = p_msg; end if;
end $$;

-- the chat list: newest activity first, with unread counts
create or replace function public.get_chats() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'last_at') desc) from (
    select jsonb_build_object('id', g.id, 'name', g.name, 'muted', me.muted, 'last_at', g.last_at,
      'members', (select count(*) from chat_members where group_id = g.id),
      'unread', (select count(*) from chat_messages m where m.group_id = g.id and m.sender <> uid and m.created_at > me.last_read_at and m.hidden_at is null
                   and not exists (select 1 from chat_mutes cm where cm.user_id = uid and cm.muted_id = m.sender)
                   and not exists (select 1 from chat_reports r where r.message_id = m.id and r.reporter = uid)),
      'last', (select jsonb_build_object('kind', m.kind, 'body', left(coalesce(m.body, case m.kind when 'cookoff' then 'Cook Off' when 'uiu' then 'Use-It-Up Week' when 'guess' then 'Guess the Cook' when 'video' then coalesce(m.meta ->> 'title', 'Recipe video') end, ''), 80), 'name', case when m.sender = uid then 'You' else _chat_name(m.sender) end, 'at', m.created_at)
                 from chat_messages m where m.group_id = g.id and m.hidden_at is null
                   and (m.sender = uid or (not exists (select 1 from chat_mutes cm where cm.user_id = uid and cm.muted_id = m.sender)
                   and not exists (select 1 from chat_reports r where r.message_id = m.id and r.reporter = uid)))
                 order by m.created_at desc limit 1)) x
    from chat_members me join chat_groups g on g.id = me.group_id where me.user_id = uid) t), '[]'::jsonb);
end $$;

-- one group: people + messages. No cursor = the latest 50 (and marks them read); p_before = 50 older; p_after = anything newer (for refreshing).
create or replace function public.get_chat(p_group uuid, p_after timestamptz default null, p_before timestamptz default null) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); msgs jsonb; g chat_groups%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not _in_chat(p_group, uid) then raise exception 'not in that group'; end if;
  select * into g from chat_groups where id = p_group;
  if p_after is not null then
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'mine', sender = uid, 'name', _chat_name(sender), 'code', _my_code(sender), 'kind', kind, 'body', body, 'photo', photo_path, 'meta', meta, 'game', _chat_game_state(kind, meta), 'at', created_at) order by created_at), '[]'::jsonb)
      into msgs from (select * from chat_messages m where m.group_id = p_group and m.hidden_at is null and m.created_at > p_after
        and (m.sender = uid or (not exists (select 1 from chat_mutes cm where cm.user_id = uid and cm.muted_id = m.sender)
          and not exists (select 1 from chat_reports r where r.message_id = m.id and r.reporter = uid)))
        order by m.created_at limit 100) z;
  else
    select coalesce(jsonb_agg(jsonb_build_object('id', id, 'mine', sender = uid, 'name', _chat_name(sender), 'code', _my_code(sender), 'kind', kind, 'body', body, 'photo', photo_path, 'meta', meta, 'game', _chat_game_state(kind, meta), 'at', created_at) order by created_at), '[]'::jsonb)
      into msgs from (select * from chat_messages m where m.group_id = p_group and m.hidden_at is null and (p_before is null or m.created_at < p_before)
        and (m.sender = uid or (not exists (select 1 from chat_mutes cm where cm.user_id = uid and cm.muted_id = m.sender)
          and not exists (select 1 from chat_reports r where r.message_id = m.id and r.reporter = uid)))
        order by m.created_at desc limit 50) z;
  end if;
  if p_after is null and p_before is null then update chat_members set last_read_at = now() where group_id = p_group and user_id = uid; end if;
  return jsonb_build_object(
    'group', jsonb_build_object('id', g.id, 'name', g.name, 'mine', g.owner = uid, 'muted', (select muted from chat_members where group_id = p_group and user_id = uid), 'bg', (select bg from chat_members where group_id = p_group and user_id = uid)),
    'members', coalesce((select jsonb_agg(jsonb_build_object('code', _my_code(cm.user_id), 'name', _chat_name(cm.user_id), 'me', cm.user_id = uid, 'owner', cm.user_id = g.owner,
        'muted', exists (select 1 from chat_mutes mu where mu.user_id = uid and mu.muted_id = cm.user_id), 'friend', cm.user_id = uid or _are_friends(uid, cm.user_id)) order by cm.joined_at)
      from chat_members cm where cm.group_id = p_group), '[]'::jsonb),
    'messages', msgs,
    'more', p_after is null and (select count(*) from chat_messages m where m.group_id = p_group and m.hidden_at is null and m.created_at < coalesce((select min((x ->> 'at')::timestamptz) from jsonb_array_elements(msgs) x), now())) > 0);
end $$;

-- ---------- push: one buzz per group per 5 minutes, and only for people who turned notifications on and haven't muted it ----------
create or replace function public.push_chat(p_secret text, p_sender uuid, p_msg uuid) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare m chat_messages%rowtype; gname text; who text; txt text; ids uuid[];
begin
  if not _push_ok(p_secret) then raise exception 'forbidden'; end if;
  select * into m from chat_messages where id = p_msg and sender = p_sender and pushed_at is null and hidden_at is null and created_at > now() - interval '2 minutes' for update;
  if not found then return '[]'::jsonb; end if;
  update chat_messages set pushed_at = now() where id = m.id;
  select name into gname from chat_groups where id = m.group_id;
  who := _chat_name(m.sender);
  txt := case m.kind when 'photo' then who || ' sent a photo' when 'cookoff' then who || ' started a Cook Off. Tap to join.' when 'uiu' then who || ' started Use-It-Up Week. Tap to join.'
    when 'guess' then who || ' wants you to Guess the Cook' when 'video' then who || ' shared a recipe video' else who || ': ' || left(coalesce(m.body, ''), 90) end;
  with due as (
    update chat_members cm set last_push_at = now()
    from profiles pr
    where cm.group_id = m.group_id and cm.user_id <> m.sender and cm.muted = false and pr.id = cm.user_id and pr.notify_hour is not null
      and (cm.last_push_at is null or cm.last_push_at < now() - interval '5 minutes')
      and not exists (select 1 from chat_mutes mu where mu.user_id = cm.user_id and mu.muted_id = m.sender)
    returning cm.user_id)
  select array_agg(user_id) into ids from due;
  return coalesce((select jsonb_agg(jsonb_build_object('title', gname, 'body', txt, 'url', '/compete/friends?chat=' || m.group_id, 'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
    from push_subs s where s.user_id = any(coalesce(ids, '{}'))), '[]'::jsonb);
end $$;

-- ---------- chat backgrounds: only a look, bought with coins, chosen per chat and seen only by you ----------
create table if not exists public.chat_bg_catalog (
  id text primary key check (id ~ '^[a-z0-9-]{2,24}$'),
  name text not null,
  price int not null check (price > 0),
  sort int not null default 0
);
insert into public.chat_bg_catalog (id, name, price, sort) values
  ('tiles', 'Kitchen tiles', 300, 1), ('gingham', 'Picnic gingham', 300, 2), ('herbs', 'Herb garden', 400, 3),
  ('sunset', 'Sunset', 500, 4), ('ocean', 'Ocean', 500, 5), ('night', 'Night market', 800, 6)
on conflict (id) do update set name = excluded.name, price = excluded.price, sort = excluded.sort;
create table if not exists public.chat_bg_owned (
  user_id uuid not null references auth.users (id) on delete cascade,
  bg text not null references public.chat_bg_catalog (id) on delete cascade,
  bought_at timestamptz not null default now(),
  primary key (user_id, bg)
);
alter table public.chat_members add column if not exists bg text references public.chat_bg_catalog (id) on delete set null;
alter table public.chat_bg_catalog enable row level security;
alter table public.chat_bg_owned enable row level security;
revoke all on public.chat_bg_catalog, public.chat_bg_owned from anon, authenticated;

create or replace function public.get_chat_bgs() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'price', c.price, 'owned', exists (select 1 from chat_bg_owned o where o.user_id = uid and o.bg = c.id)) order by c.sort)
    from chat_bg_catalog c), '[]'::jsonb);
end $$;

create or replace function public.buy_chat_bg(p_bg text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); c chat_bg_catalog%rowtype; bal int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into c from chat_bg_catalog where id = p_bg;
  if not found then raise exception 'background not found'; end if;
  if exists (select 1 from chat_bg_owned where user_id = uid and bg = c.id) then raise exception 'already owned'; end if;
  select coins into bal from profiles where id = uid for update;
  if bal < c.price then raise exception 'not enough coins'; end if;
  update profiles set coins = coins - c.price where id = uid;
  insert into chat_bg_owned (user_id, bg) values (uid, c.id);
  return jsonb_build_object('coins', bal - c.price, 'bg', c.id);
end $$;

-- pick the look of one chat for yourself (null = the plain app colour); it has to be one you own
create or replace function public.set_chat_bg(p_group uuid, p_bg text) returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not _in_chat(p_group, uid) then raise exception 'not in that group'; end if;
  if p_bg is not null and not exists (select 1 from chat_bg_owned where user_id = uid and bg = p_bg) then raise exception 'buy that background first'; end if;
  update chat_members set bg = p_bg where group_id = p_group and user_id = uid;
  return p_bg;
end $$;

-- ---------- admins: reported messages ----------
create or replace function public.admin_chat_reports() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not coalesce((select is_admin from profiles where id = auth.uid()), false) then raise exception 'admins only'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'last') desc) from (
    select jsonb_build_object('msg', m.id, 'name', _chat_name(m.sender), 'kind', m.kind, 'body', m.body, 'photo', m.photo_path, 'hidden', m.hidden_at is not null,
      'reports', count(r.*), 'reasons', jsonb_agg(distinct r.reason), 'last', max(r.created_at)) x
    from chat_reports r join chat_messages m on m.id = r.message_id group by m.id order by max(r.created_at) desc limit 100) t), '[]'::jsonb);
end $$;
create or replace function public.admin_set_chat_hidden(p_msg uuid, p_hidden boolean) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not coalesce((select is_admin from profiles where id = auth.uid()), false) then raise exception 'admins only'; end if;
  update chat_messages set hidden_at = case when p_hidden then coalesce(hidden_at, now()) end where id = p_msg;
  if not p_hidden then delete from chat_reports where message_id = p_msg; end if;
end $$;

-- ---------- photos: a private bucket; you upload into your own folder, group members can open what was sent ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-photos', 'chat-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
drop policy if exists chat_photos_insert_own on storage.objects;
create policy chat_photos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists chat_photos_delete_own on storage.objects;
create policy chat_photos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'chat-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create or replace function public._chat_photo_visible(p_name text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select (storage.foldername(p_name))[1] = auth.uid()::text
    or exists (select 1 from chat_messages m where m.photo_path = p_name and m.hidden_at is null and _in_chat(m.group_id, auth.uid())
               and not exists (select 1 from chat_reports r where r.message_id = m.id and r.reporter = auth.uid()))
    or (coalesce((select is_admin from profiles where id = auth.uid()), false)
        and exists (select 1 from chat_messages m join chat_reports r on r.message_id = m.id where m.photo_path = p_name));
$$;
drop policy if exists chat_photos_select on storage.objects;
create policy chat_photos_select on storage.objects for select to authenticated using (bucket_id = 'chat-photos' and public._chat_photo_visible(name));

revoke execute on function public.create_chat(text, text[]), public.add_to_chat(uuid, text), public.leave_chat(uuid), public.remove_from_chat(uuid, text), public.set_chat_muted(uuid, boolean),
  public.set_chat_user_muted(text, boolean), public.send_chat(uuid, text, text, text), public.send_chat_game(uuid, text, text), public.delete_chat_message(uuid), public.report_chat_message(uuid, text), public.get_chats(),
  public.get_chat(uuid, timestamptz, timestamptz), public.admin_chat_reports(), public.admin_set_chat_hidden(uuid, boolean),
  public.get_chat_bgs(), public.buy_chat_bg(text), public.set_chat_bg(uuid, text),
  public.send_chat_video(uuid, text, text, text[], text[]) from public, anon;
grant execute on function public.create_chat(text, text[]), public.add_to_chat(uuid, text), public.leave_chat(uuid), public.remove_from_chat(uuid, text), public.set_chat_muted(uuid, boolean),
  public.set_chat_user_muted(text, boolean), public.send_chat(uuid, text, text, text), public.send_chat_game(uuid, text, text), public.delete_chat_message(uuid), public.report_chat_message(uuid, text), public.get_chats(),
  public.get_chat(uuid, timestamptz, timestamptz), public.admin_chat_reports(), public.admin_set_chat_hidden(uuid, boolean),
  public.get_chat_bgs(), public.buy_chat_bg(text), public.set_chat_bg(uuid, text),
  public.send_chat_video(uuid, text, text, text[], text[]) to authenticated;
revoke execute on function public.push_chat(text, uuid, uuid) from public;
grant execute on function public.push_chat(text, uuid, uuid) to anon, authenticated;   -- the secret is the lock, like push_cookoff
revoke execute on function public._in_chat(uuid, uuid), public._chat_name(uuid), public._chat_game_state(text, jsonb) from public, anon, authenticated;
grant execute on function public._chat_photo_visible(text) to authenticated;
