import assert from 'node:assert/strict';
import { parseRecipeText, parseIngredient, fixDigits } from './parseText.js';
const L = (...t) => t.map((x) => (Array.isArray(x) ? { text: x[0], conf: x[1] } : { text: x, conf: 95 }));
const txt = (a) => a.map((x) => x.text);

// 1. A printed card with headings, wrapped lines and bullets
let r = parseRecipeText(L('GRANDMA’S BANANA BREAD', 'Serves: 8', 'Total time: 1 hour 10 minutes', 'Ingredients', '• 3 ripe bananas, mashed', '• l/2 cup butter, melted', '• 3/4 cup sugar', '1 egg', '1 tsp vanilla', '1 1/2 cups all-purpose', 'flour', 'Directions', '1. Preheat the oven to 350°F and grease a loaf pan.', '2. Mix the bananas, butter, sugar, egg and', 'vanilla in a large bowl.', '3. Stir in the flour. Pour into the pan and bake 60 minutes.'));
assert.equal(r.title.text, 'Grandma’s Banana Bread');
assert.equal(r.servings, 8); assert.equal(r.minutes, 70);
assert.deepEqual(txt(r.ingredients), ['3 ripe bananas, mashed', '1/2 cup butter, melted', '3/4 cup sugar', '1 egg', '1 tsp vanilla', '1 1/2 cups all-purpose flour']);
assert.equal(r.steps.length, 3); assert.match(r.steps[1].text, /vanilla in a large bowl\.$/); assert.ok(!/^\d/.test(r.steps[0].text));

// 2. No headings at all (a quick note): ingredients first, numbered steps after
r = parseRecipeText(L('Garlic noodles', '8 oz spaghetti', '4 cloves garlic, minced', '2 tbsp butter', 'salt', '1. Boil the spaghetti until al dente.', '2. Melt the butter and cook the garlic for 1 minute.', '3. Toss with the noodles and salt.'));
assert.equal(r.title.text, 'Garlic noodles');
assert.deepEqual(txt(r.ingredients), ['8 oz spaghetti', '4 cloves garlic, minced', '2 tbsp butter', 'salt']);
assert.equal(r.steps.length, 3);

// 3. Low-confidence lines are marked for the player to check
r = parseRecipeText(L('Pancakes', 'Ingredients', ['2 cups flour', 95], ['1 cup rnilk', 40], 'Method', ['Whisk everything together.', 55], 'Cook on a hot pan.'));
assert.deepEqual(r.ingredients.map((x) => x.low), [false, true]);
assert.deepEqual(r.steps.map((x) => x.low), [true, false]);

// 4. Handwriting-style slips in numbers
assert.equal(fixDigits('8 0z spaghetti'), '8 oz spaghetti'); assert.equal(fixDigits('l/2 cup milk'), '1/2 cup milk'); assert.equal(fixDigits('1O0 g flour'), '100 g flour'); assert.equal(fixDigits('1 / 4 tsp salt'), '1/4 tsp salt');

// 5. Splitting an ingredient into amount, unit, item and note
assert.deepEqual(parseIngredient('1 1/2 cups all-purpose flour, sifted'), { qty: 1.5, unit: 'cups', item: 'all-purpose flour', note: 'sifted' });
assert.deepEqual(parseIngredient('½ tsp salt'), { qty: 0.5, unit: 'tsp', item: 'salt' });
assert.deepEqual(parseIngredient('3 eggs'), { qty: 3, item: 'eggs' });
assert.deepEqual(parseIngredient('2 tbsp. butter (melted)'), { qty: 2, unit: 'tbsp', item: 'butter', note: 'melted' });
assert.deepEqual(parseIngredient('salt to taste'), { item: 'salt to taste' });
assert.deepEqual(parseIngredient('1-2 cloves garlic'), { qty: 2, unit: 'cloves', item: 'garlic' });
console.log('parseText: all checks passed');
