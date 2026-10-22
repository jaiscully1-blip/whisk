import assert from 'node:assert/strict';
import { specialDays, holidayPicks, nth, easter, FOOD_DAY_COUNT } from './holidays.js';

const ymd = (ts) => new Date(ts).toISOString().slice(0, 10);
const names = (d) => specialDays(d).map((x) => x.name);
const has = (d, n) => assert.ok(names(d).includes(n), `${d} should include "${n}", got ${JSON.stringify(names(d))}`);
const hasNot = (d, n) => assert.ok(!names(d).includes(n), `${d} should not include "${n}"`);

// 1. Weekday rules and Easter follow the Gregorian calendar
assert.equal(ymd(easter(2026)), '2026-04-05'); assert.equal(ymd(easter(2027)), '2027-03-28'); assert.equal(ymd(easter(2028)), '2028-04-16');
has('2026-11-26', 'Thanksgiving'); hasNot('2026-11-27', 'Thanksgiving'); has('2027-11-25', 'Thanksgiving');
has('2026-05-10', 'Mother’s Day'); has('2026-06-21', 'Father’s Day'); has('2026-05-25', 'Memorial Day'); has('2026-09-07', 'Labor Day');
has('2026-02-08', 'Super Bowl Sunday'); has('2026-02-17', 'Mardi Gras'); has('2026-02-18', 'Ash Wednesday'); has('2026-04-03', 'Good Friday'); has('2026-04-05', 'Easter');
assert.equal(nth(2026, 11, 4, 4), 26); assert.equal(nth(2026, 5, 1, -1), 25);

// 2. Fixed dates, national days and lunar tables
has('2026-12-25', 'Christmas'); has('2026-10-31', 'Halloween'); has('2026-07-14', 'Bastille Day'); has('2026-01-26', 'Australia Day'); has('2026-09-16', 'Independence Day (Mexico)');
has('2026-02-17', 'Lunar New Year'); has('2026-03-01', 'Lunar New Year'); hasNot('2026-03-04', 'Lunar New Year');   // runs 15 days
has('2026-11-08', 'Diwali'); has('2026-03-04', 'Holi'); has('2026-03-20', 'Eid al-Fitr'); has('2026-12-05', 'Hanukkah');
has('2027-12-31', 'Hanukkah'); hasNot('2028-01-01', 'Hanukkah');   // 24–31 Dec 2027
has('2027-01-01', 'Kwanzaa');   // 26 Dec – 1 Jan runs over New Year
has('2026-12-31', 'Kwanzaa'); has('2026-09-25', 'Mid-Autumn Festival');

// 3. Every day of the year (leap year too) has at least one food holiday, and the whole list is there
assert.ok(FOOD_DAY_COUNT >= 480, `only ${FOOD_DAY_COUNT} food holidays`);   // 366 days, several names on many of them
for (let t = Date.UTC(2028, 0, 1); t < Date.UTC(2029, 0, 1); t += 864e5) assert.ok(specialDays(ymd(t)).some((x) => x.kind === 'food'), `no food holiday on ${ymd(t)}`);
has('2026-10-22', 'National Nut Day'); has('2026-01-04', 'National Spaghetti Day'); has('2028-02-29', 'National Surf and Turf Day'); hasNot('2026-02-28', 'National Surf and Turf Day');

// 4. Order: holidays, then national days, then food days
const k = specialDays('2026-07-14').map((x) => x.kind); assert.ok(k.indexOf('holiday') < k.indexOf('food'));

// 5. Matching: dishes for the day, makeable ones first, cycling through the day's special days in turn
const R = (id, title, key = [], country = '') => ({ id, title, key, country });
const recipes = [R('a', 'Spaghetti Carbonara', ['Spaghetti', 'Egg', 'Bacon'], 'IT'), R('b', 'Spaghetti and Meatballs', ['Spaghetti', 'Beef'], 'US'), R('c', 'Chocolate Cake'), R('d', 'Hamburger Steak', ['Beef']), R('e', 'Lasagna', ['Pasta'], 'IT'), R('f', 'Roast Turkey with Gravy', ['Turkey'])];
let p = holidayPicks(recipes, specialDays('2026-01-04'));   // National Spaghetti Day
assert.deepEqual(p.map((x) => x.r.id).slice(0, 2).sort(), ['a', 'b']);
p = holidayPicks(recipes, specialDays('2026-01-04'), (r) => r.id === 'b'); assert.equal(p[0].r.id, 'b');   // you can make b: it leads
assert.ok(!p.some((x) => x.r.id === 'c'), 'unrelated dishes stay out');
p = holidayPicks(recipes, specialDays('2026-11-26')); assert.equal(p[0].r.id, 'f'); assert.equal(p[0].day.name, 'Thanksgiving');
// two special days at once (Italy's Republic Day + a food day) alternate: not all of one day first
p = holidayPicks(recipes, [{ name: 'A', kind: 'food', terms: [], c: ['IT'] }, { name: 'B', kind: 'food', terms: [{ re: /\bcake\b/i, w: 3 }], c: [] }]);
assert.deepEqual(p.map((x) => x.day.name).slice(0, 2).sort(), ['A', 'B']);
assert.deepEqual(holidayPicks(recipes, []), []);   // nothing special: nothing changes
console.log('holidays: all checks passed');
