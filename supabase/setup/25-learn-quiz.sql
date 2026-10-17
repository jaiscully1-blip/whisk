-- Learn quiz: cooking level + 3-question quizzes, learning streak, 100 coins for a perfect score.
--  • Players pick a cooking level (Beginner, Novice, Advanced beginner, Competent, Proficient, Expert). Learning is offered for the first three.
--  • A quiz is 3 random questions. The answers stay in the database; players only see them after they submit.
--  • A perfect 3/3 pays 100 coins, once per quiz, up to 5 paying quizzes a day (stops answer-farming). Any finished quiz keeps the learning streak.
-- Safe to run more than once.

alter table public.profiles
  add column if not exists skill_level text check (skill_level in ('beginner','novice','advanced_beginner','competent','proficient','expert')),
  add column if not exists learn_streak int not null default 0,
  add column if not exists learn_best int not null default 0,
  add column if not exists learn_last date;

create table if not exists public.lesson_questions (
  id int primary key,
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  answer smallint not null check (answer between 0 and 3),
  why text not null
);
alter table public.lesson_questions enable row level security;   -- no policy: players can never read the answers directly
revoke all on public.lesson_questions from anon, authenticated;

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  qids int[] not null,
  picks int[],
  correct smallint,
  coins int not null default 0,
  day date not null,
  created_at timestamptz not null default now(),
  graded_at timestamptz
);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id, created_at desc);
alter table public.quiz_attempts enable row level security;
drop policy if exists quiz_attempts_select on public.quiz_attempts;
create policy quiz_attempts_select on public.quiz_attempts for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.quiz_attempts from anon, authenticated;
grant select on public.quiz_attempts to authenticated;

insert into public.lesson_questions (id, prompt, options, answer, why) values
  (1, 'What internal temperature makes cooked chicken safe to eat?', '["145°F (63°C)", "155°F (68°C)", "165°F (74°C)", "175°F (79°C)"]'::jsonb, 2, '165°F (74°C) in the thickest part kills the bacteria that cause food poisoning. Use a thermometer, not colour.'),
  (2, 'What is the safe internal temperature for ground beef?', '["145°F (63°C)", "160°F (71°C)", "130°F (54°C)", "180°F (82°C)"]'::jsonb, 1, 'Grinding mixes surface bacteria all the way through, so ground meat needs 160°F (71°C).'),
  (3, 'Whole cuts of beef or pork, like steaks and chops, are safe at what temperature, followed by a short rest?', '["120°F (49°C) for 1 minute", "145°F (63°C) with a 3 minute rest", "165°F (74°C) with no rest", "135°F (57°C) with a 10 minute rest"]'::jsonb, 1, '145°F (63°C), then rest 3 minutes. The rest finishes the job and keeps the juices in.'),
  (4, 'Fish is cooked through at what internal temperature?', '["110°F (43°C)", "125°F (52°C)", "145°F (63°C)", "190°F (88°C)"]'::jsonb, 2, '145°F (63°C), when the flesh turns opaque and flakes easily.'),
  (5, 'Bacteria grow fastest between which temperatures, called the danger zone?', '["0°F to 32°F", "40°F to 140°F", "150°F to 200°F", "212°F and above"]'::jsonb, 1, 'Between 40°F (4°C) and 140°F (60°C) bacteria multiply quickly. Keep cold food cold and hot food hot.'),
  (6, 'How soon should cooked food go in the fridge?', '["Within 2 hours", "Within 6 hours", "Once it is fully cold", "By the next morning"]'::jsonb, 0, 'Within 2 hours (1 hour if it is hotter than 90°F outside). After that, bacteria have had too long to grow.'),
  (7, 'How long do cooked leftovers keep in the fridge?', '["1 day", "3 to 4 days", "1 week", "2 weeks"]'::jsonb, 1, '3 to 4 days. After that, throw them out, even if they look and smell fine.'),
  (8, 'Should you rinse raw chicken before cooking it?', '["Yes, to wash off germs", "Yes, but only with soap", "No, it spreads germs around the sink", "Only if it smells"]'::jsonb, 2, 'Rinsing splashes raw-chicken bacteria onto the sink and counters. Cooking to 165°F is what makes it safe.'),
  (9, 'What is the best way to avoid cross-contamination?', '["Use the same board and wash it once at the end", "Use separate boards (or wash well) for raw meat and ready-to-eat food", "Rinse the knife with cold water", "Cut meat last, always"]'::jsonb, 1, 'Raw meat juices can carry bacteria. Keep a separate board, or wash the board, knife and your hands before touching anything that won''t be cooked.'),
  (10, 'How long should you wash your hands with soap before cooking?', '["5 seconds", "10 seconds", "At least 20 seconds", "2 minutes"]'::jsonb, 2, 'At least 20 seconds, about two rounds of the happy birthday song, then dry them on a clean towel.'),
  (11, 'What is the safest way to thaw frozen meat?', '["On the counter overnight", "In the fridge", "In a bowl of hot water", "Under a warm lamp"]'::jsonb, 1, 'The fridge keeps it out of the danger zone. Cold running water or the microwave also work if you cook it right away.'),
  (12, 'What temperature should your fridge be at or below?', '["32°F (0°C)", "40°F (4°C)", "50°F (10°C)", "60°F (16°C)"]'::jsonb, 1, '40°F (4°C) or colder slows bacteria. The freezer should be 0°F (-18°C).'),
  (13, 'Why is a sharp knife safer than a dull one?', '["It cuts faster so you finish sooner", "It needs less force, so it is less likely to slip", "It makes smaller pieces", "It is lighter"]'::jsonb, 1, 'A dull knife needs more force and skids off the food. A sharp one goes where you point it.'),
  (14, 'What is the "claw grip" for the hand holding the food?', '["Fingers curled under, knuckles guide the blade", "Fingers flat on top of the food", "Thumb and pinky only", "Holding the food in the air"]'::jsonb, 0, 'Curling your fingertips under keeps them out of the way while your knuckles guide the side of the blade.'),
  (15, 'Which knife cuts a ripe tomato cleanly without squashing it?', '["A butter knife", "A serrated (bread) knife or very sharp knife", "A rolling pin", "A dull chef''s knife"]'::jsonb, 1, 'A serrated knife saws through the tough skin without pressing the soft inside.'),
  (16, 'Which cut is the smallest?', '["Chop", "Dice", "Mince", "Slice"]'::jsonb, 2, 'Mincing makes tiny pieces, usually for garlic, ginger and herbs.'),
  (17, 'What does "julienne" mean?', '["Thin matchstick strips", "Round slices", "Big chunks", "Mashed pieces"]'::jsonb, 0, 'Julienne cuts are thin, even matchsticks, about the size of a match.'),
  (18, 'What does "sauté" mean?', '["Cook slowly in lots of water", "Cook quickly in a little fat over fairly high heat", "Bake covered", "Freeze first"]'::jsonb, 1, 'Sauté means quick cooking in a small amount of fat, moving the food around in the pan.'),
  (19, 'What does it mean to "sear" meat?', '["Boil it briefly", "Brown the surface over high heat", "Cook it in the microwave", "Marinate it overnight"]'::jsonb, 1, 'Searing browns the outside over high heat, which builds a lot of flavor.'),
  (20, 'What does a simmer look like?', '["No movement at all", "Small bubbles rising gently", "Big rolling bubbles and lots of steam", "Spitting oil"]'::jsonb, 1, 'A simmer has small, gentle bubbles. A boil is large and rolling.'),
  (21, 'What is blanching?', '["Frying in oil", "Boiling briefly, then cooling in ice water", "Roasting until white", "Soaking in vinegar"]'::jsonb, 1, 'Blanching quickly cooks vegetables and the ice bath stops the cooking, keeping them bright and crisp.'),
  (22, 'What does "deglaze" mean?', '["Add liquid to loosen the browned bits stuck to the pan", "Take the glaze off a cake", "Wash the pan with soap", "Turn the heat off"]'::jsonb, 0, 'Browned bits in the pan are flavor. A splash of broth, wine or water dissolves them into your sauce.'),
  (23, 'What does "fold" mean when baking?', '["Beat hard until smooth", "Gently combine so you keep the air in", "Stir in circles for a minute", "Pour in slowly"]'::jsonb, 1, 'Folding uses a spatula to lift and turn the mixture gently so it stays light and airy.'),
  (24, 'Why let cooked meat rest before cutting?', '["So it cools to a safe temperature", "So the juices settle back into the meat", "So it cooks faster", "So the fat hardens"]'::jsonb, 1, 'Cutting right away lets the juices run out. A few minutes'' rest keeps the meat moist.'),
  (25, 'Why should you not overcrowd the pan?', '["It uses more oil", "Food steams instead of browning", "The pan will break", "It takes longer to clean"]'::jsonb, 1, 'Too much food releases too much steam. Cook in batches so the food can brown.'),
  (26, 'Why preheat the pan before adding food?', '["It makes the pan clean", "Food sears and is less likely to stick", "It saves oil", "It is only needed for baking"]'::jsonb, 1, 'A hot pan browns food right away. Cold food in a cold pan tends to stick and turn grey.'),
  (27, 'Why salt the pasta water?', '["It makes water boil faster", "It seasons the pasta as it cooks", "It stops the pasta sticking", "It cleans the pasta"]'::jsonb, 1, 'Salted water seasons the pasta from the inside. It should taste like mild sea water.'),
  (28, 'What does "al dente" mean?', '["Soft and mushy", "Firm to the bite", "Cooked in a dental plan", "Cold"]'::jsonb, 1, 'Al dente is Italian for "to the tooth": cooked through but still a little firm.'),
  (29, 'What does baking soda need in a recipe to work?', '["An acid such as buttermilk, yogurt or lemon", "Salt", "Cold water", "Sugar"]'::jsonb, 0, 'Baking soda reacts with acid to make bubbles. Baking powder already includes its own acid.'),
  (30, 'What is the best way to measure flour with cups?', '["Scoop it straight from the bag and press", "Spoon it into the cup and level the top", "Shake it in", "Measure it wet"]'::jsonb, 1, 'Scooping packs the flour and you end up with too much. Spoon it in and level it, or better, weigh it.'),
  (31, 'How many teaspoons are in a tablespoon?', '["2", "3", "4", "6"]'::jsonb, 1, '1 tablespoon = 3 teaspoons.'),
  (32, 'How many tablespoons are in a cup?', '["8", "12", "16", "24"]'::jsonb, 2, '1 cup = 16 tablespoons (and 8 fluid ounces).'),
  (33, 'What is "mise en place"?', '["A French sauce", "Having everything prepped and in place before you start cooking", "A kind of knife", "A cooking time"]'::jsonb, 1, 'It means "everything in its place": chop, measure and set out before the heat goes on, so nothing burns while you hunt for the salt.'),
  (34, 'How can you tell oil is hot enough to cook with?', '["It turns white", "It shimmers and flows easily in the pan", "It is cold to the touch", "It smells like butter"]'::jsonb, 1, 'Hot oil shimmers and spreads easily. If it is smoking, it is too hot: turn it down.'),
  (35, 'A pan of oil catches fire. What should you do?', '["Pour water on it", "Cover it with a lid and turn off the heat", "Carry it outside", "Fan the flames"]'::jsonb, 1, 'Smother it with a lid or baking sheet and turn off the heat. Water makes a grease fire explode.'),
  (36, 'What should never go in the microwave?', '["A ceramic bowl", "A glass dish", "Metal foil or a metal pan", "A paper towel"]'::jsonb, 2, 'Metal can spark and damage the microwave. Use microwave-safe glass or ceramic.'),
  (37, 'Which way should pot handles point while cooking?', '["Over the front of the stove", "Inward, not hanging out", "Toward the hottest burner", "It does not matter"]'::jsonb, 1, 'Turning handles inward keeps you from bumping a pot and pulling it off the stove.'),
  (38, 'How should you care for a cast iron pan?', '["Soak it overnight in soapy water", "Wash it, dry it right away and wipe on a thin layer of oil", "Put it in the dishwasher", "Scrub it with bleach"]'::jsonb, 1, 'Dry it fully and wipe on a little oil. Soaking and the dishwasher cause rust.'),
  (39, 'What should you avoid using on a nonstick pan?', '["Wooden spoons", "Silicone spatulas", "Metal utensils", "Plastic tongs rated for heat"]'::jsonb, 2, 'Metal scratches the coating. Use wood, silicone or heat-safe plastic.'),
  (40, 'How can you test if an egg is fresh?', '["It floats in water", "It sinks and lies flat in water", "It spins on the counter", "It smells sweet"]'::jsonb, 1, 'Fresh eggs sink and lie flat. As air builds inside, older eggs stand up or float.'),
  (41, 'Why put hard-boiled eggs in ice water?', '["It stops the cooking and makes them easier to peel", "It makes them taste sweeter", "It cooks them further", "It keeps the shell from cracking later"]'::jsonb, 0, 'The ice bath stops the cooking so the yolk does not turn green, and the egg shrinks slightly from the shell.'),
  (42, 'Why rinse white rice before cooking?', '["To add flavor", "To wash off extra surface starch so it is less sticky", "To make it cook faster", "To make it whiter"]'::jsonb, 1, 'Rinsing removes loose starch, which gives you fluffier, separate grains.'),
  (43, 'Where should ripe tomatoes be stored for the best flavor?', '["In the freezer", "On the counter", "In the fridge door", "In a sealed bag"]'::jsonb, 1, 'The fridge dulls their flavor and makes them mealy. Keep ripe tomatoes on the counter and use them within a few days.'),
  (44, 'Where do potatoes keep best?', '["In the fridge", "In a cool, dark, dry place", "On a sunny windowsill", "In water"]'::jsonb, 1, 'Light turns potatoes green and the fridge turns their starch to sugar. Keep them cool, dark and dry.'),
  (45, 'Which gas from ripe bananas makes other fruit ripen faster?', '["Oxygen", "Ethylene", "Helium", "Carbon dioxide"]'::jsonb, 1, 'Ethylene speeds ripening. Keep bananas away from fruit you want to last.'),
  (46, 'Which has the highest smoke point, so it is best for very hot cooking?', '["Butter", "Extra virgin olive oil", "Refined avocado oil", "Unrefined flaxseed oil"]'::jsonb, 2, 'Refined avocado oil handles very high heat (around 500°F). Butter and flaxseed oil burn much sooner.'),
  (47, 'Where should you marinate raw chicken?', '["On the counter", "In the fridge", "In the sun", "Anywhere that is warm"]'::jsonb, 1, 'Marinate in the fridge so the chicken stays out of the danger zone.'),
  (48, 'A marinade had raw meat in it. How can you use it as a sauce?', '["Pour it straight on the food", "Boil it for a few minutes first", "Add a pinch of salt", "It is always safe"]'::jsonb, 1, 'Raw-meat juices carry bacteria. Bring the marinade to a full boil first, or set aside a separate portion before marinating.'),
  (49, 'Where should you put the thermometer to check meat?', '["In the fat", "Touching the bone", "In the thickest part, away from bone", "In the pan"]'::jsonb, 2, 'The thickest part is the last to cook. Bone and fat read differently.'),
  (50, 'What is carryover cooking?', '["Cooking in a to-go container", "Food keeps cooking from its own heat after you take it off the heat", "Cooking with a lid on", "Cooking two things at once"]'::jsonb, 1, 'A roast or steak can rise 5 to 10°F after it comes off the heat, so pull it a little early.'),
  (51, 'A basic roux is made from what?', '["Equal parts fat and flour", "Water and salt", "Eggs and milk", "Sugar and butter"]'::jsonb, 0, 'A roux is fat and flour cooked together, then used to thicken sauces and gravies.'),
  (52, 'A squeeze of lemon juice or a splash of vinegar at the end of a dish does what?', '["Makes it sour", "Brightens and balances the flavors", "Cooks it further", "Thickens it"]'::jsonb, 1, 'A little acid wakes up flavors, especially in rich or heavy dishes.'),
  (53, 'Why add a pinch of salt to sweet baking?', '["To make it salty", "To bring out the sweetness and flavor", "To make it rise", "To keep it from burning"]'::jsonb, 1, 'Salt sharpens flavor and balances sweetness, so cookies taste more like cookies.'),
  (54, 'When zesting a lemon, which part do you want?', '["The white pith", "The colored outer peel only", "The whole peel", "The seeds"]'::jsonb, 1, 'The colored peel holds the fragrant oil. The white pith underneath is bitter.'),
  (55, 'Why add garlic later or cook it on lower heat?', '["It burns quickly and turns bitter", "It needs time to freeze", "It only works cold", "It disappears"]'::jsonb, 0, 'Minced garlic browns in under a minute and burnt garlic tastes bitter. Add it near the end or keep the heat moderate.'),
  (56, 'Why save a cup of starchy pasta water?', '["To wash the pot", "To help the sauce cling and become silky", "To cook the next batch", "To cool the pasta"]'::jsonb, 1, 'The starch in the water thickens and binds the sauce so it coats the pasta.'),
  (57, 'How long can raw chicken stay in the fridge before cooking or freezing?', '["1 to 2 days", "1 week", "10 days", "2 weeks"]'::jsonb, 0, 'Cook or freeze raw chicken within 1 to 2 days of buying it.'),
  (58, 'Why does cutting onions make your eyes water?', '["They release an irritating gas when the cells break", "They are old", "The knife is dull", "It is the smell of the oil"]'::jsonb, 0, 'Cutting breaks cells and sets off a reaction that makes a gas that stings your eyes. A sharp knife breaks fewer cells.'),
  (59, 'How should you cool a big pot of soup before storing it?', '["Leave it on the stove overnight", "Split it into shallow containers so it cools quickly", "Put the whole hot pot in the fridge", "Add ice cubes only"]'::jsonb, 1, 'Shallow containers cool fast, so the soup spends less time in the danger zone.'),
  (60, 'Which is the best way to slice a round vegetable such as an onion or potato safely?', '["Hold it in the air and cut toward your hand", "Cut a flat side first so it sits steady on the board", "Press it against your chest", "Cut it in your hand"]'::jsonb, 1, 'A flat side gives you a stable base so the food cannot roll while you cut.'),
  (61, 'A damp towel under the cutting board does what?', '["Cleans the board", "Keeps it from sliding", "Makes the knife sharper", "Cools the food"]'::jsonb, 1, 'A damp towel or non-slip mat grips the counter so the board stays put.'),
  (62, 'Why should you taste as you cook?', '["To check and adjust seasoning", "To check whether the pan is hot", "To test the oven", "To burn off germs"]'::jsonb, 0, 'Tasting along the way lets you add salt, acid or spice a little at a time instead of fixing it at the end.')
on conflict (id) do update set prompt = excluded.prompt, options = excluded.options, answer = excluded.answer, why = excluded.why;

create or replace function public.set_skill_level(p_level text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_level is not null and p_level not in ('beginner','novice','advanced_beginner','competent','proficient','expert') then raise exception 'unknown level'; end if;
  update profiles set skill_level = p_level where id = uid;
  return p_level;
end $$;

-- Start (or resume today's unfinished) quiz. Returns the questions WITHOUT answers.
create or replace function public.quiz_start()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); lvl text; today date; att public.quiz_attempts; ids int[]; recent int[]; paid int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select skill_level into lvl from profiles where id = uid;
  if lvl is null or lvl not in ('beginner','novice','advanced_beginner') then raise exception 'learning is off for your level'; end if;
  today := _user_today(uid);
  select * into att from quiz_attempts where user_id = uid and graded_at is null and day = today order by created_at desc limit 1;
  if not found then
    select coalesce(array_agg(x), '{}') into recent from (select unnest(qids) x from quiz_attempts where user_id = uid order by created_at desc limit 10) r;
    select array_agg(id) into ids from (select id from lesson_questions where not (id = any(recent)) order by random() limit 3) s;
    if ids is null or array_length(ids, 1) < 3 then
      select array_agg(id) into ids from (select id from lesson_questions order by random() limit 3) s;
    end if;
    insert into quiz_attempts (user_id, qids, day) values (uid, ids, today) returning * into att;
  end if;
  select count(*) into paid from quiz_attempts where user_id = uid and day = today and coins > 0;
  return jsonb_build_object(
    'attempt', att.id,
    'paid_left', greatest(0, 5 - paid),
    'questions', (select jsonb_agg(jsonb_build_object('id', q.id, 'q', q.prompt, 'options', q.options) order by array_position(att.qids, q.id)) from lesson_questions q where q.id = any(att.qids)));
end $$;

-- Grade once. Returns what was right and why. 100 coins for 3/3 (5 paying quizzes a day at most).
create or replace function public.quiz_submit(p_attempt uuid, p_picks int[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); att public.quiz_attempts; today date; n smallint := 0; i int; paid int; gain int := 0; p profiles; res jsonb := '[]'::jsonb; q public.lesson_questions;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into att from quiz_attempts where id = p_attempt and user_id = uid for update;
  if not found then raise exception 'no such quiz'; end if;
  if att.graded_at is not null then raise exception 'already answered'; end if;
  if p_picks is null or array_length(p_picks, 1) is distinct from 3 then raise exception 'answer all three'; end if;
  for i in 1..3 loop
    if p_picks[i] is null or p_picks[i] not between 0 and 3 then raise exception 'bad answer'; end if;
    select * into q from lesson_questions where id = att.qids[i];
    if q.answer = p_picks[i] then n := n + 1; end if;
    res := res || jsonb_build_array(jsonb_build_object('id', q.id, 'answer', q.answer, 'picked', p_picks[i], 'why', q.why));
  end loop;
  today := _user_today(uid);
  select count(*) into paid from quiz_attempts where user_id = uid and day = today and coins > 0;
  if n = 3 and paid < 5 then gain := 100; end if;
  update quiz_attempts set picks = p_picks, correct = n, coins = gain, graded_at = now(), day = today where id = att.id;
  update profiles set
    coins = coins + gain,
    learn_streak = case when learn_last = today then learn_streak when learn_last = today - 1 then learn_streak + 1 else 1 end,
    learn_best = greatest(learn_best, case when learn_last = today then learn_streak when learn_last = today - 1 then learn_streak + 1 else 1 end),
    learn_last = today
  where id = uid returning * into p;
  perform _award_xp(uid, 'quiz', 10, 5);
  return jsonb_build_object('correct', n, 'perfect', n = 3, 'coins', gain, 'streak', p.learn_streak, 'best', p.learn_best, 'results', res);
end $$;

revoke execute on function public.set_skill_level(text) from public, anon;
revoke execute on function public.quiz_start() from public, anon;
revoke execute on function public.quiz_submit(uuid, int[]) from public, anon;
grant execute on function public.set_skill_level(text) to authenticated;
grant execute on function public.quiz_start() to authenticated;
grant execute on function public.quiz_submit(uuid, int[]) to authenticated;
