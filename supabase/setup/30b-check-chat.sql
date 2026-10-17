-- Run this after 30-chat.sql. It lists anything the chat still needs. An empty result means chat is fully installed.
-- (If it lists things, run 30-chat.sql again and tell me the exact red error text it shows, if any.)
select 'missing function' as problem, f as name from unnest(array[
  'create_chat','add_to_chat','leave_chat','remove_from_chat','set_chat_muted','set_chat_user_muted','send_chat','send_chat_game','send_chat_video',
  'delete_chat_message','report_chat_message','get_chats','get_chat','push_chat','get_chat_bgs','buy_chat_bg','set_chat_bg',
  'get_chat_list','add_chat_list','set_chat_list_done','remove_chat_list','clear_chat_list_done','open_shared_list','admin_chat_reports','admin_set_chat_hidden']) f
where not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = f)
union all
select 'missing table', t from unnest(array['chat_groups','chat_members','chat_messages','chat_reports','chat_mutes','chat_bg_catalog','chat_bg_owned','chat_list']) t
where to_regclass('public.' || t) is null
union all
select 'old message rules (run 30-chat.sql again)', 'chat_messages_kind_ck'
where exists (select 1 from pg_constraint where conname = 'chat_messages_kind_ck') and not exists (select 1 from pg_constraint where conname = 'chat_messages_kind_ck' and pg_get_constraintdef(oid) like '%video%')
union all
select 'missing storage bucket', 'chat-photos' where not exists (select 1 from storage.buckets where id = 'chat-photos');
-- also tell the API to look again
notify pgrst, 'reload schema';
