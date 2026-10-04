-- Whisk 0010 — the shop's Chef Hat becomes a Hockey Helmet. Same item id, so anyone who bought it keeps it.
update public.items set name = 'Hockey Helmet' where id = 'hat-chef-hat';
