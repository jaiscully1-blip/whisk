-- 1-on-1 chats show as the friend you're talking to. Tapping a friend opens the same pair chat every time
-- (open_shared_list, unchanged); it isn't listed in Chats until someone writes in it. Groups come from New group and parties.
create or replace function public.get_chats() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'last_at') desc) from (
    select jsonb_build_object('id', g.id, 'name', g.name, 'muted', me.muted, 'last_at', g.last_at,
      'pair', g.pair_key is not null,
      'with', case when g.pair_key is not null then (select jsonb_build_object('name', _chat_name(o.user_id), 'code', _my_code(o.user_id)) from chat_members o where o.group_id = g.id and o.user_id <> uid limit 1) end,
      'members', (select count(*) from chat_members where group_id = g.id),
      'unread', (select count(*) from chat_messages m where m.group_id = g.id and m.sender <> uid and m.created_at > me.last_read_at and m.hidden_at is null
                   and not exists (select 1 from chat_mutes cm where cm.user_id = uid and cm.muted_id = m.sender)
                   and not exists (select 1 from chat_reports r where r.message_id = m.id and r.reporter = uid)),
      'last', (select jsonb_build_object('kind', m.kind, 'body', left(coalesce(m.body, case m.kind when 'cookoff' then 'Cook Off' when 'uiu' then 'Use-It-Up Week' when 'guess' then 'Guess the Cook' when 'video' then coalesce(m.meta ->> 'title', 'Recipe video') end, ''), 80), 'name', case when m.sender = uid then 'You' else _chat_name(m.sender) end, 'at', m.created_at)
                 from chat_messages m where m.group_id = g.id and m.hidden_at is null
                   and (m.sender = uid or (not exists (select 1 from chat_mutes cm where cm.user_id = uid and cm.muted_id = m.sender)
                   and not exists (select 1 from chat_reports r where r.message_id = m.id and r.reporter = uid)))
                 order by m.created_at desc limit 1)) x
    from chat_members me join chat_groups g on g.id = me.group_id where me.user_id = uid
      -- a 1-on-1 chat is only listed once someone has written in it
      and (g.pair_key is null or exists (select 1 from chat_messages m where m.group_id = g.id and m.hidden_at is null))) t), '[]'::jsonb);
end $$;

notify pgrst, 'reload schema';
