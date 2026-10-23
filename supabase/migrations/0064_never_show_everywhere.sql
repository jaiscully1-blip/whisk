-- 0064: Never show me, everywhere. Safe to run more than once. Run after 0063.
--  A player's Never show me list (allergies and dislikes) now also steers what the server picks for them:
--  • A party's three weekly challenge dishes are picked among dishes every member can eat (nothing from anyone's
--    list in the dish's main ingredients or its name). If someone adds to their list mid-week, a dish that now
--    clashes is swapped for another of the same size, as long as nobody has cooked it yet.
--  • The app hides or adapts recipes on the phone (lib/recipes/never.js); the world-recipe lists are filtered on the
--    server. This file is generated from the same word lists: scripts/gen-never-sql.mjs.

-- the words one list item stands for (a group like 'fish', or the item itself), as a regex alternative
create or replace function public._never_words(p_item text) returns text language sql immutable set search_path = public, pg_temp as $f$
  select case lower(btrim(p_item))
    when 'peanuts' then 'peanut|peanuts|peanut butter|peanut oil|groundnut|satay'
    when 'tree nuts' then 'almond|almonds|cashew|cashews|walnut|walnuts|pecan|pecans|pistachio|pistachios|hazelnut|hazelnuts|macadamia|pine nut|pine nuts|brazil nut|nut|nuts|praline|marzipan|nutella|pesto|frangipane|amaretto|baklava'
    when 'shellfish' then 'shrimp|prawn|prawns|crab|lobster|crayfish|crawfish|langoustine|clam|clams|mussel|mussels|oyster|oysters|oyster sauce|scallop|scallops|squid|calamari|octopus|shellfish|shrimp paste|dried shrimp|conch|gambas|scampi'
    when 'fish' then 'fish|fish sauce|anchovy|anchovies|salmon|tuna|cod|saltfish|bacalao|bacalhau|tilapia|sardine|sardines|mackerel|trout|haddock|halibut|snapper|bonito|dashi|worcestershire|caesar|catfish|herring|swordfish|sea bass|branzino|mahi|pollock|hake|carp|eel|roe|caviar|kipper|katsuobushi|nam pla|patis|ceviche|shark|grouper|flounder|sole|perch|pike|monkfish|skate|whitebait|smelt|barramundi|kingfish|yellowtail|bream|sea bream|mullet|tarama|pomfret|hilsa|rohu|kapenta|dagaa|omena|lox|gravlax|surimi|pilchard|pilchards|sprat|sprats|turbot|plaice|whiting|mahi mahi|stockfish|bombil|sashimi|codfish|whitefish|flatfish|fishcake|fishcakes|fishball|fishballs|fishfingers|fish fingers|fish sticks'
    when 'eggs' then 'egg|eggs|egg yolk|egg yolks|egg white|egg whites|mayonnaise|mayo|aioli|meringue|egg noodles|omelet|omelette|frittata|custard|hollandaise|béarnaise|bearnaise'
    when 'dairy' then 'milk|butter|buttermilk|cheese|cheddar|parmesan|parmigiano|pecorino|mozzarella|feta|halloumi|gruyere|colby|havarti|ricotta|mascarpone|brie|gouda|paneer|cream|heavy cream|sour cream|crème fraîche|creme fraiche|yogurt|yoghurt|labneh|ghee|whey|queso|cotija|tzatziki|condensed milk|evaporated milk|ice cream|kefir'
    when 'gluten / wheat' then 'flour|wheat|bread|breadcrumbs|bread crumbs|panko|pasta|spaghetti|penne|ziti|macaroni|fettuccine|linguine|rigatoni|tagliatelle|orzo|lasagna|lasagne|ditalini|gnocchi|noodles|noodle|lo mein|udon|ramen|couscous|bulgur|barley|rye|semolina|tortilla|tortillas|pita|naan|roti|chapati|baguette|bun|buns|rolls|croutons|pastry|puff pastry|phyllo|filo|pie crust|soy sauce|hoisin|teriyaki|beer|malt|seitan|farro|spelt|cracker|crackers|graham|digestive biscuits|biscuit|biscuits|cookie|cookies|wafer|wafers|pretzel|pretzels|croissant|croissants|bagel|bagels|brioche|dumpling wrappers|wonton wrappers|egg roll wrappers|spring roll wrappers|vermicelli'
    when 'soy' then 'soy|soy sauce|soya|soybean|soybeans|tofu|edamame|miso|tamari|tempeh|hoisin|teriyaki|natto'
    when 'sesame' then 'sesame|sesame oil|sesame seeds|tahini|hummus|halva|za’atar|za''atar|zaatar|furikake|gomashio|dukkah'
    else regexp_replace(lower(btrim(p_item)), '([.*+?^$\{\}()|\[\]\\])', '\\\1', 'g')
  end
$f$;

-- one regex for a whole list (null when it's empty)
create or replace function public._never_regex(p_items text[]) returns text language sql immutable set search_path = public, pg_temp as $f$
  select case when count(*) = 0 then null else '\m(' || string_agg(_never_words(i), '|') || ')(e?s)?\M' end
  from unnest(coalesce(p_items, '{}')) i where btrim(i) <> ''
$f$;

-- names that only look like a list word: coconut milk isn't dairy, eggplant isn't egg, gluten-free pasta isn't gluten
create or replace function public._never_plain(p_text text) returns text language sql immutable set search_path = public, pg_temp as $f$
  select regexp_replace(lower(coalesce(p_text, '')),
    '(coconut (milk|cream)|eggplants?|butternut|nutmeg|cream of tartar|gluten[- ]free [a-z]+|dairy[- ]free [a-z]+|corn tortillas?|rice (noodles|flour|paper)|coconut aminos|water chestnuts?|butter beans?|(ginger|root) beer)', ' ', 'g')
$f$;

-- can every member of this party eat a dish? (its name and main ingredients against each member's list)
create or replace function public._party_can_eat(p_group uuid, p_title text, p_key jsonb) returns boolean language sql stable security definer set search_path = public, pg_temp as $f$
  select not exists (
    select 1 from chat_members m join profiles p on p.id = m.user_id
    where m.group_id = p_group and cardinality(p.never_show) > 0
      and _never_plain(coalesce(p_title, '') || ' ' || coalesce(p_key::text, '')) ~* _never_regex(p.never_show))
$f$;

-- 0059's weekly party dishes, now picked among the ones every member can eat
create or replace function public.get_party_challenges(p_group uuid) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); wk date; big_lo int := case when random() < 0.6 then 80 else 65 end; s record; pick record;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from chat_groups g where g.id = p_group and g.party) or not _in_chat(p_group, uid) then raise exception 'not in that party'; end if;
  wk := date_trunc('week', _user_today(uid))::date;
  perform pg_advisory_xact_lock(hashtext(p_group::text || wk::text));
  if not exists (select 1 from party_challenges c where c.group_id = p_group and c.week_start = wk) then
    insert into party_challenges (group_id, week_start, slot, recipe_id, coins)
    select p_group, wk, t.slot, t.id, score_to_coins(t.score) from (
      (select 1::smallint as slot, w.id, w.score from web_recipes w where w.active and w.score < 35 order by _party_can_eat(p_group, w.title, w.data->'key') desc, random() limit 1)
      union all (select 2::smallint, w.id, w.score from web_recipes w where w.active and w.score >= 35 and w.score < 65 order by _party_can_eat(p_group, w.title, w.data->'key') desc, random() limit 1)
      union all (select 3::smallint, w.id, w.score from web_recipes w where w.active and w.score >= 65 order by _party_can_eat(p_group, w.title, w.data->'key') desc, (w.score >= big_lo) desc, random() limit 1)
    ) t;
  end if;
  -- someone's list changed (or someone new joined) and a dish clashes: swap it for one of the same size, unless it's been cooked
  for s in select pc.slot, r.score from party_challenges pc join web_recipes r on r.id = pc.recipe_id
           where pc.group_id = p_group and pc.week_start = wk and not _party_can_eat(p_group, r.title, r.data->'key')
             and not exists (select 1 from party_challenge_done d where d.group_id = pc.group_id and d.week_start = pc.week_start and d.slot = pc.slot) loop
    select w.id, w.score into pick from web_recipes w
      where w.active and _party_can_eat(p_group, w.title, w.data->'key')
        and case s.slot when 1 then w.score < 35 when 2 then w.score >= 35 and w.score < 65 else w.score >= 65 end
      order by random() limit 1;
    if found then update party_challenges set recipe_id = pick.id, coins = score_to_coins(pick.score) where group_id = p_group and week_start = wk and slot = s.slot; end if;
  end loop;
  return jsonb_build_object('week_start', wk, 'week_end', wk + 7, 'items', coalesce((select jsonb_agg(q.item order by q.slot) from (
    select pc.slot, jsonb_build_object('slot', pc.slot, 'recipe_id', pc.recipe_id, 'title', r.title, 'cuisine', r.cuisine, 'minutes', r.minutes, 'score', r.score, 'coins', pc.coins,
      'done', coalesce((select jsonb_agg(jsonb_build_object('code', _my_code(d.user_id), 'name', _chat_name(d.user_id), 'me', d.user_id = uid, 'at', d.completed_at,
          'seat', (select count(*) from chat_members c1, chat_members c2 where c1.group_id = p_group and c2.group_id = p_group and c2.user_id = d.user_id and (c1.joined_at, c1.user_id) < (c2.joined_at, c2.user_id))) order by d.completed_at)
        from party_challenge_done d where d.group_id = pc.group_id and d.week_start = pc.week_start and d.slot = pc.slot and _in_chat(p_group, d.user_id)), '[]'::jsonb),
      'my_meal', (select m.id from meals m where m.user_id = uid and m.web_recipe_id = pc.recipe_id and m.cooked_at >= (wk::timestamp at time zone _user_tz(uid))
        and not exists (select 1 from party_challenge_done d where d.group_id = pc.group_id and d.week_start = pc.week_start and d.slot = pc.slot and d.user_id = uid)
        order by m.cooked_at desc limit 1)) as item
    from party_challenges pc join web_recipes r on r.id = pc.recipe_id
    where pc.group_id = p_group and pc.week_start = wk) q), '[]'::jsonb));
end $$;

revoke execute on function public._never_words(text), public._never_regex(text[]), public._never_plain(text), public._party_can_eat(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.get_party_challenges(uuid) from public, anon;
grant execute on function public.get_party_challenges(uuid) to authenticated;
