-- 0056: Share a plate with chosen parties, a party photo wall, and a recipe on the back of a plate. Safe to run more than once. Run after 0055.
--  • A plate can be shared with all friends (as before, shared_at), with any parties you are in, or kept to yourself.
--  • Everyone in a party can see the plates shared to it, and love or report them. Friends who are not in the party cannot.
--  • A plate can carry a recipe card (name, ingredients, steps) that the viewer can flip to.
--  • Delete your own plate with delete_meal (the XP and coins you earned stay).

alter table public.meals add column if not exists recipe_card jsonb;

create table if not exists public.meal_party_shares (
  meal_id uuid not null references public.meals (id) on delete cascade,
  group_id uuid not null references public.chat_groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meal_id, group_id)
);
create index if not exists meal_party_shares_group_idx on public.meal_party_shares (group_id, created_at desc);
alter table public.meal_party_shares enable row level security;
revoke all on public.meal_party_shares from anon, authenticated;

-- a plate shared to a party the viewer is in (and the cook still is in), not hidden, not reported by the viewer
create or replace function public._party_plate_visible(viewer uuid, m meals) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select viewer is not null and m.hidden_at is null
    and not exists (select 1 from meal_reports r where r.meal_id = m.id and r.reporter = viewer)
    and exists (select 1 from meal_party_shares s join chat_groups g on g.id = s.group_id
      where s.meal_id = m.id and g.party and _in_chat(s.group_id, viewer) and _in_chat(s.group_id, m.user_id));
$$;

-- who can open the photo: friends (as before) and party members
create or replace function public._feed_photo_visible(p_name text) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from meals m where m.photo_path = p_name and (_plate_visible(auth.uid(), m) or _party_plate_visible(auth.uid(), m)))
    or (coalesce((select is_admin from profiles where id = auth.uid()), false)
        and exists (select 1 from meals m join meal_reports r on r.meal_id = m.id where m.photo_path = p_name));
$$;

-- where is this plate shared? (yours only)
create or replace function public.get_meal_sharing(p_meal uuid) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m meals%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from meals where id = p_meal and user_id = uid;
  if not found then return null; end if;
  return jsonb_build_object('friends', m.shared_at is not null,
    'groups', coalesce((select jsonb_agg(s.group_id) from meal_party_shares s where s.meal_id = p_meal and _in_chat(s.group_id, uid)), '[]'::jsonb));
end $$;

-- choose where a plate is shared: all friends and/or some of your parties. Needs a photo. Nothing chosen = just you.
create or replace function public.set_meal_sharing(p_meal uuid, p_friends boolean, p_groups uuid[] default '{}') returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m meals%rowtype; gs uuid[];
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from meals where id = p_meal and user_id = uid;
  if not found or m.photo_path is null then return false; end if;
  select coalesce(array_agg(g.id), '{}') into gs from chat_groups g where g.id = any(coalesce(p_groups, '{}')) and g.party and _in_chat(g.id, uid);
  update meals set shared_at = case when p_friends then coalesce(shared_at, now()) end where id = p_meal;
  delete from meal_party_shares where meal_id = p_meal and not (group_id = any(gs));
  insert into meal_party_shares (meal_id, group_id) select p_meal, unnest(gs) on conflict do nothing;
  return true;
end $$;

-- put (or clear) the recipe on the back of a plate
create or replace function public.set_meal_card(p_meal uuid, p_card jsonb) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); card jsonb;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_card is null or jsonb_typeof(p_card) <> 'object' then
    update meals set recipe_card = null where id = p_meal and user_id = uid; return found;
  end if;
  card := jsonb_build_object(
    'title', left(coalesce(p_card ->> 'title', ''), 120),
    'ingredients', coalesce((select jsonb_agg(left(x, 200)) from (select jsonb_array_elements_text(case when jsonb_typeof(p_card -> 'ingredients') = 'array' then p_card -> 'ingredients' else '[]'::jsonb end) x limit 60) q), '[]'::jsonb),
    'steps', coalesce((select jsonb_agg(left(x, 600)) from (select jsonb_array_elements_text(case when jsonb_typeof(p_card -> 'steps') = 'array' then p_card -> 'steps' else '[]'::jsonb end) x limit 40) q), '[]'::jsonb));
  if jsonb_array_length(card -> 'ingredients') = 0 and jsonb_array_length(card -> 'steps') = 0 then card := null; end if;
  update meals set recipe_card = card where id = p_meal and user_id = uid;
  return found;
end $$;

-- the plates shared to a party, newest first (30 at a time; pass the last time to get older ones)
create or replace function public.get_party_plates(p_group uuid, p_before timestamptz default null) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not _in_chat(p_group, uid) then raise exception 'not in that party'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'at') desc) from (
    select jsonb_build_object('id', m.id, 'mine', m.user_id = uid, 'code', _my_code(m.user_id), 'name', _chat_name(m.user_id),
      'seat', (select count(*) from chat_members c where c.group_id = p_group and (c.joined_at, c.user_id) < (cm.joined_at, cm.user_id)),
      'title', m.title, 'cuisine', m.cuisine, 'photo', m.photo_path, 'at', m.cooked_at, 'card', m.recipe_card,
      'loves', (select count(*) from meal_loves l where l.meal_id = m.id), 'loved', exists (select 1 from meal_loves l where l.meal_id = m.id and l.user_id = uid)) x
    from meal_party_shares s join meals m on m.id = s.meal_id
      join chat_members cm on cm.group_id = p_group and cm.user_id = m.user_id
    where s.group_id = p_group and m.photo_path is not null and _party_plate_visible(uid, m) and (p_before is null or m.cooked_at < p_before)
    order by m.cooked_at desc limit 30) t), '[]'::jsonb);
end $$;

-- love and report work for party plates too
create or replace function public.love_meal(p_meal uuid, p_on boolean) returns int language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m meals%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from meals where id = p_meal;
  if not found or not (_plate_visible(uid, m) or _party_plate_visible(uid, m)) then raise exception 'not found'; end if;
  if p_on then insert into meal_loves (meal_id, user_id) values (p_meal, uid) on conflict do nothing;
  else delete from meal_loves where meal_id = p_meal and user_id = uid; end if;
  return (select count(*) from meal_loves where meal_id = p_meal);
end $$;

create or replace function public.report_meal(p_meal uuid, p_reason text) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); m meals%rowtype;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into m from meals where id = p_meal;
  if not found or not (_plate_visible(uid, m) or _party_plate_visible(uid, m)) then raise exception 'not found'; end if;
  if m.user_id = uid then raise exception 'that''s your own plate'; end if;
  insert into meal_reports (meal_id, reporter, reason) values (p_meal, uid, case when p_reason in ('not_food', 'rude', 'spam') then p_reason else 'other' end) on conflict do nothing;
  if (select count(distinct reporter) from meal_reports where meal_id = p_meal) >= 2 then update meals set hidden_at = now() where id = p_meal; end if;
end $$;

revoke execute on function public.get_meal_sharing(uuid), public.set_meal_sharing(uuid, boolean, uuid[]), public.set_meal_card(uuid, jsonb), public.get_party_plates(uuid, timestamptz),
  public.love_meal(uuid, boolean), public.report_meal(uuid, text) from public, anon;
grant execute on function public.get_meal_sharing(uuid), public.set_meal_sharing(uuid, boolean, uuid[]), public.set_meal_card(uuid, jsonb), public.get_party_plates(uuid, timestamptz),
  public.love_meal(uuid, boolean), public.report_meal(uuid, text) to authenticated;
revoke execute on function public._party_plate_visible(uuid, meals) from public, anon, authenticated;
grant execute on function public._feed_photo_visible(text) to authenticated;
