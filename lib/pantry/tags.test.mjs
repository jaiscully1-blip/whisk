// The two reported mix-ups (spices in Sauces, olive oil in Produce) and the barcode tag fall-backs.
import assert from 'node:assert/strict';
import { categorizeProduct, shelve, learn } from './rules.js';
const T = (name, tags, want) => assert.equal(categorizeProduct(name, tags), want, `${name} ${tags.join(',')}`);
T('Extra Virgin Olive Oil', ['en:plant-based-foods-and-beverages', 'en:fats', 'en:vegetable-fats', 'en:olive-tree-products', 'en:vegetable-oils', 'en:olive-oils'], 'Sauces & Oils');
T('Bertolli Classico', ['en:fats', 'en:vegetable-fats', 'en:vegetable-oils', 'en:olive-oils'], 'Sauces & Oils');
T('Ground Cinnamon', ['en:condiments', 'en:spices', 'en:ground-spices'], 'Spices & Seasonings');
T('Himalayan Pink', ['en:condiments', 'en:spices', 'en:salts'], 'Spices & Seasonings');
T('Tuscan Sunset', ['en:groceries', 'en:condiments', 'en:sauces'], 'Sauces & Oils');
T('Chicken Nuggets', ['en:meats', 'en:frozen-foods'], 'Frozen');
T('Fresh Thing', ['en:plant-based-foods', 'en:fresh-vegetables'], 'Produce');
T('Mystery', ['en:beverages', 'en:sodas'], 'Other');
T('Weekend Blend', ['en:seasonings', 'en:spice-blends'], 'Spices & Seasonings');
const mine = learn({}, 'Weird Powder', 'Baking');
assert.equal(shelve('weird powder ', mine), 'Baking');
assert.equal(shelve('Salt', mine), 'Spices & Seasonings');
console.log('pantry sorting: tags and learned aisles ok');
