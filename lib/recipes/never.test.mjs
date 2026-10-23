import assert from 'node:assert/strict';
import { adapt, allowed, blockedBy, fitAll } from './never.js';

const R = (title, key = [], minor = [], ingredients) => ({ id: title, title, key, minor, ingredients: ingredients || [...key, ...minor].map((item) => ({ item: item.toLowerCase(), qty: 1 })), steps: [[`Add the ${[...key, ...minor].join(', ').toLowerCase()}.`, null]] });
const GF = ['gluten / wheat', 'fish'];   // the player who wrote in

// 1. fish as the dish: hidden; fish in a sauce: swapped
assert.equal(allowed(R('Salmon Teriyaki', ['Salmon', 'Soy sauce']), GF), false);
assert.equal(allowed(R('Fish Tacos', ['Tilapia', 'Tortillas']), GF), false);
assert.equal(allowed(R('Tuna Salad', ['Tuna', 'Celery']), GF), false);
let a = adapt(R('Pad Thai', ['Rice noodles', 'Chicken', 'Egg'], ['Fish sauce', 'Peanuts']), GF);
assert.ok(a.ok, 'pad thai with a fish-sauce swap');
const fs = a.swaps.find((x) => /fish sauce/i.test(x.from));
assert.ok(fs && /coconut aminos/.test(fs.to), `fish sauce → coconut aminos (soy sauce has gluten): ${JSON.stringify(fs)}`);
assert.ok(!a.recipe.ingredients.some((g) => /fish sauce/i.test(g.item)), 'the list is rewritten');
assert.ok(!/fish sauce/i.test(a.recipe.steps[0][0]), 'and the steps');

// 2. gluten: like-for-like swaps keep the dish
a = adapt(R('Spaghetti Carbonara', ['Spaghetti', 'Egg yolks', 'Pecorino'], ['Black pepper']), GF);
assert.ok(a.ok); assert.ok(a.swaps.some((x) => x.to === 'gluten-free spaghetti'), JSON.stringify(a.swaps));
a = adapt(R('Chicken Stir Fry', ['Chicken', 'Broccoli'], ['Soy sauce', 'Garlic']), GF);
assert.ok(a.ok); assert.equal(a.swaps[0].to, 'tamari');
a = adapt(R('Chicken Stir Fry', ['Chicken', 'Broccoli'], ['Soy sauce']), ['gluten / wheat', 'soy']);
assert.equal(a.swaps[0].to, 'coconut aminos', 'tamari is soy: skip it');
assert.ok(adapt(R('Garlic Bread', ['Bread', 'Butter', 'Garlic']), GF).ok);
assert.ok(adapt(R('Chili Mac', ['Ground beef', 'Macaroni'], ['Flour']), GF).ok);
assert.ok(adapt(R('Caesar Salad', ['Romaine', 'Caesar dressing'], ['Croutons']), GF).ok);
assert.ok(blockedBy(R('Beef Tacos', ['Beef', 'Corn tortillas']), GF) === null, 'corn tortillas are gluten-free');
assert.ok(blockedBy(R('Rice bowl', ['Rice'], ['Tamari', 'Cornstarch']), GF) === null);

// 3. dairy / nuts / eggs / peanuts: the old false passes are gone, the false hits stay gone
assert.equal(blockedBy(R('Smoothie', ['Almond milk', 'Banana']), ['tree nuts']), 'almond', 'almond milk IS tree nuts');
assert.equal(blockedBy(R('Smoothie', ['Almond milk', 'Banana']), ['dairy']), null, '…but not dairy');
assert.ok(blockedBy(R('Stir fry', ['Chicken'], ['Peanut oil']), ['peanuts']), 'peanut oil is peanuts');
assert.equal(blockedBy(R('Curry', ['Chicken', 'Coconut milk']), ['dairy']), null);
assert.equal(blockedBy(R('Moussaka', ['Eggplant']), ['eggs']), null);
assert.equal(blockedBy(R('Soup', ['Butternut squash'], ['Nutmeg']), ['tree nuts', 'dairy']), null);
assert.equal(allowed(R('Cheese Omelet', ['Eggs', 'Cheddar']), ['eggs']), false, 'eggs are the dish');
assert.ok(adapt(R('Pancakes', ['Flour', 'Milk'], ['Egg']), ['eggs']).ok, 'one egg in a batter: flax egg');
a = adapt(R('Mac and Cheese', ['Macaroni', 'Cheddar', 'Milk', 'Butter']), ['dairy']);
assert.ok(a.ok && a.swaps.length === 3, JSON.stringify(a.swaps));
a = adapt(R('Beef Stroganoff', ['Beef', 'Mushrooms'], ['Sour cream']), ['dairy']);
assert.equal(a.swaps[0].to, 'dairy-free yogurt', 'sour cream is not plain cream');

// 4. a plain word (a dislike): small extra → leave it out; the main thing → hidden
a = adapt(R('Tacos', ['Beef', 'Tortillas'], ['Cilantro']), ['cilantro']);
assert.ok(a.ok && a.swaps[0].leave && !a.recipe.ingredients.some((g) => g.item === 'cilantro'));
assert.equal(allowed(R('Mushroom Risotto', ['Mushrooms', 'Rice']), ['mushrooms']), false);

// 5. nothing on the list: nothing changes, same object
const plain = R('Toast', ['Bread']);
assert.equal(adapt(plain, []).recipe, plain);
assert.deepEqual(fitAll([plain, R('Salmon', ['Salmon'])], ['fish']).map((r) => r.title), ['Toast']);
console.log('never: all checks passed');
// 6. swaps read like groceries: the whole ingredient gets the label
a = adapt(R('Sloppy Joes', ['Ground beef', 'Hamburger buns']), ['gluten / wheat']);
assert.equal(a.swaps[0].to, 'gluten-free hamburger buns', JSON.stringify(a.swaps));
assert.ok(a.recipe.ingredients.some((g) => g.item === 'gluten-free hamburger buns'));
a = adapt(R('Quesadillas', ['Flour tortillas', 'Sharp cheddar cheese']), ['gluten / wheat', 'dairy']);
assert.deepEqual(a.swaps.map((x) => x.to), ['corn tortillas', 'dairy-free sharp cheddar cheese']);
console.log('never: swap wording ok');
