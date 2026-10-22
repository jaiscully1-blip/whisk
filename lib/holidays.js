// Special days on the Gregorian calendar, and which dishes suit them.
//  - every food holiday of the year (the 366-day list from juleeho.com's food-holiday calendar)
//  - holidays: fixed dates, "nth weekday" rules (Thanksgiving, Mother's Day…), Easter-based days (Mardi Gras, Good Friday…),
//    and lunar / religious days from year tables (Lunar New Year, Ramadan, Eids, Holi, Diwali, Passover, Hanukkah, Rosh Hashanah…)
//  - national days of countries, matched to that country's recipes
// specialDays('2026-10-22') → today's special days; holidayPicks() turns them into an ordered list of dishes that cycles through
// every special day in turn. Pure functions, no browser or React, so it is easy to test.

import { fitsMeal } from './recipes/meal.js';

const DAY = 864e5;
const utc = (y, m, d) => Date.UTC(y, m - 1, d);
const dow = (y, m, d) => new Date(utc(y, m, d)).getUTCDay();
// n-th weekday (0 = Sunday) of a month; n = -1 is the last one
export function nth(y, m, wd, n) {
  if (n > 0) return 1 + ((wd - dow(y, m, 1) + 7) % 7) + (n - 1) * 7;
  const last = new Date(utc(y, m + 1, 0)).getUTCDate();
  return last - ((dow(y, m, last) - wd + 7) % 7);
}
// Western Easter Sunday (Meeus/Jones/Butcher), as a UTC timestamp
export function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(y, mo, da);
}

// Lunar / religious days move around the Gregorian calendar, so they come from published tables ("MM-DD" per year).
// Moon-sighted days (Ramadan, the Eids) can land a day either side. Years outside the table simply have no entry.
const TBL = {
  lny:      { 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03' },
  ramadan:  { 2026: '02-18', 2027: '02-08', 2028: '01-28', 2029: '01-16', 2030: '01-06' },
  eidfitr:  { 2026: '03-20', 2027: '03-09', 2028: '02-26', 2029: '02-14', 2030: '02-04' },
  eidadha:  { 2026: '05-27', 2027: '05-16', 2028: '05-05', 2029: '04-24', 2030: '04-14' },
  holi:     { 2026: '03-04', 2027: '03-22', 2028: '03-11', 2029: '03-01', 2030: '03-20' },
  diwali:   { 2026: '11-06', 2027: '10-27', 2028: '10-15', 2029: '11-03', 2030: '10-24' },   // first of the five days
  passover: { 2026: '04-01', 2027: '04-21', 2028: '04-10', 2029: '03-30', 2030: '04-17' },   // first seder evening
  hanukkah: { 2026: '12-04', 2027: '12-24', 2028: '12-12', 2029: '12-01', 2030: '12-20' },   // first candle evening
  rosh:     { 2026: '09-12', 2027: '10-02', 2028: '09-21', 2029: '09-10', 2030: '09-28' },
  kippur:   { 2026: '09-21', 2027: '10-11', 2028: '09-30', 2029: '09-19', 2030: '10-07' },
  moon:     { 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12' }    // Mid-Autumn Festival / Chuseok
};

// when: 'MM-DD' | 'nth:month:weekday:n' | 'easter:±days' | 'tbl:key'   s: how many days it lasts   t: dishes (words/phrases)   c: country codes
const HOLIDAYS = [
  { n: 'New Year’s Day', w: '01-01', t: 'hoppin|black.eyed|collard|lentil|sauerkraut|ozoni|soba|pork' },
  { n: 'Three Kings’ Day', w: '01-06', t: 'king cake|rosca|roscon|galette' },
  { n: 'Orthodox Christmas', w: '01-07', t: 'borscht|kutia|pierogi|sarma|holubtsy|dumpling' },
  { n: 'Burns Night', w: '01-25', t: 'haggis|neeps|tatties|cullen skink|cranachan|shortbread|stovies', c: ['GB'] },
  { n: 'Australia Day', w: '01-26', t: 'lamington|meat pie|pavlova|damper|anzac|barramundi', c: ['AU'] },
  { n: 'Republic Day (India)', w: '01-26', t: '', c: ['IN'] },
  { n: 'Lunar New Year', w: 'tbl:lny', s: 15, t: 'dumpling|jiaozi|spring roll|noodle|longevity|nian gao|tangyuan|rice cake|hot pot|lo mein|chow mein|fried rice|tteok|mandu|banh chung|banh tet|whole fish|steamed fish', c: ['CN', 'KR', 'VN', 'TW', 'SG'] },
  { n: 'Ramadan', w: 'tbl:ramadan', s: 30, t: 'dates|lentil|samosa|biryani|kebab|harira|fattoush|hummus|lamb|kunafa|qatayef|baklava|shawarma|falafel', c: ['EG', 'MA', 'TR', 'LB', 'SA', 'AE', 'PK', 'ID', 'MY'] },
  { n: 'Eid al-Fitr', w: 'tbl:eidfitr', s: 3, t: 'biryani|lamb|kebab|baklava|sheer khurma|maamoul|semolina|kunafa|samosa|rice pudding|haleem|dates' },
  { n: 'Eid al-Adha', w: 'tbl:eidadha', s: 4, t: 'lamb|goat|mutton|kebab|biryani|korma|haleem|tagine|shawarma' },
  { n: 'Groundhog Day', w: '02-02', t: 'sausage|egg|pancake|breakfast' },
  { n: 'Super Bowl Sunday', w: 'nth:2:0:2', t: 'wing|nacho|chili|dip|slider|pizza|burger|pretzel|jalapeno|queso|guacamole|popcorn|ribs|taco|pigs in a blanket' },
  { n: 'Valentine’s Day', w: '02-14', t: 'chocolate|strawberr|raspberr|red velvet|lobster|steak|filet|pasta|cupcake|fondue|cheesecake|truffle' },
  { n: 'Presidents’ Day', w: 'nth:2:1:3', t: 'cherry|cherries' },
  { n: 'Mardi Gras', w: 'easter:-47', t: 'gumbo|jambalaya|king cake|crawfish|po.?boy|beignet|pancake|etouffee|red beans|muffuletta|shrimp and grits' },
  { n: 'Ash Wednesday', w: 'easter:-46', t: 'fish|shrimp|salmon|cod|tuna|soup|lentil|vegetarian|pasta|bean' },
  { n: 'St. David’s Day', w: '03-01', t: 'cawl|welsh rarebit|bara brith|leek|lamb', c: [] },
  { n: 'Holi', w: 'tbl:holi', t: 'gujiya|thandai|samosa|chaat|pakora|dahi|malpua|puran poli|paneer|jalebi|kachori', c: ['IN'] },
  { n: 'Pi Day', w: '03-14', t: 'pie|pot pie|quiche|tart|pizza' },
  { n: 'St. Patrick’s Day', w: '03-17', t: 'corned beef|cabbage|colcannon|irish|soda bread|shepherd|irish stew|lamb stew|champ|boxty', c: ['IE'] },
  { n: 'Passover', w: 'tbl:passover', s: 8, t: 'matzo|matzah|brisket|charoset|gefilte|kugel|chicken soup|flourless|macaroon' },
  { n: 'Good Friday', w: 'easter:-2', t: 'fish|hot cross|chowder|cod|salmon|shrimp' },
  { n: 'Easter', w: 'easter:0', t: 'ham|lamb|deviled egg|carrot cake|hot cross|asparagus|roast|frittata|quiche|pavlova|egg' },
  { n: 'Songkran', w: '04-13', s: 3, t: 'pad thai|mango sticky|som tam|larb|green curry|tom yum|noodle|satay', c: ['TH'] },
  { n: 'Earth Day', w: '04-22', t: 'vegetable|vegetarian|salad|vegan|lentil|bean|veggie' },
  { n: 'Cinco de Mayo', w: '05-05', t: 'taco|enchilada|guacamole|nacho|burrito|quesadilla|salsa|fajita|churro|elote|mole|pozole', c: ['MX'] },
  { n: 'Mother’s Day', w: 'nth:5:0:2', t: 'crepe|quiche|waffle|pancake|french toast|brunch|scone|eggs benedict|cake|strawberr|frittata|muffin|avocado toast' },
  { n: 'Memorial Day', w: 'nth:5:1:-1', t: 'burger|hot dog|bbq|barbecue|ribs|potato salad|coleslaw|corn|grill|brisket|baked beans|watermelon' },
  { n: 'Father’s Day', w: 'nth:6:0:3', t: 'steak|burger|ribs|bbq|barbecue|brisket|bacon|wing|grill|chili' },
  { n: 'Juneteenth', w: '06-19', t: 'red velvet|bbq|barbecue|ribs|strawberr|watermelon|hot link|collard|peach cobbler|cornbread|mac and cheese' },
  { n: 'Canada Day', w: '07-01', t: 'poutine|butter tart|nanaimo|maple|tourtiere|bannock', c: ['CA'] },
  { n: 'Independence Day (USA)', w: '07-04', t: 'burger|hot dog|barbecue|bbq|ribs|corn on the cob|potato salad|coleslaw|apple pie|watermelon|cherry|grill', c: ['US'] },
  { n: 'Bastille Day', w: '07-14', t: 'coq au vin|ratatouille|crepe|quiche|croque|bouillabaisse|cassoulet|tarte|souffle|bourguignon|macaron', c: ['FR'] },
  { n: 'Labor Day', w: 'nth:9:1:1', t: 'burger|hot dog|bbq|barbecue|ribs|corn|grill|potato salad|coleslaw|watermelon' },
  { n: 'Oktoberfest', w: 'nth:9:6:3', s: 16, t: 'schnitzel|bratwurst|pretzel|sauerkraut|spaetzle|goulash|potato salad|currywurst|rouladen|strudel', c: ['DE'] },
  { n: 'Ethiopian New Year', w: '09-11', t: 'doro wat|injera|kitfo|tibs|shiro|lentil', c: ['ET'] },
  { n: 'Rosh Hashanah', w: 'tbl:rosh', s: 2, t: 'honey|apple|challah|brisket|tzimmes|pomegranate|noodle kugel|carrot' },
  { n: 'Yom Kippur break-fast', w: 'tbl:kippur', t: 'bagel|lox|kugel|blintz|challah|salmon|egg' },
  { n: 'Mid-Autumn Festival', w: 'tbl:moon', t: 'mooncake|pomelo|taro|duck|dumpling|rice ball|tangyuan|salted egg|lotus|songpyeon|japchae|jeon|galbi', c: ['CN', 'VN', 'TW', 'KR'] },
  { n: 'Meskel', w: '09-27', t: 'doro wat|injera|kitfo|tibs|shiro', c: ['ET'] },
  { n: 'Diwali', w: 'tbl:diwali', s: 5, t: 'samosa|gulab jamun|ladoo|laddu|barfi|jalebi|kheer|paneer|biryani|curry|dal|halwa|chakli|pakora', c: ['IN'] },
  { n: 'Thanksgiving (Canada)', w: 'nth:10:1:2', t: 'turkey|stuffing|cranberry|mashed potato|gravy|sweet potato|pumpkin pie|green bean|pecan pie|butter tart', c: [] },
  { n: 'Halloween', w: '10-31', t: 'pumpkin|caramel apple|pigs in a blanket|popcorn|cider|squash|apple|candy|witch|ghost|mummy|spider' },
  { n: 'Day of the Dead', w: '11-01', s: 2, t: 'pan de muerto|tamale|mole|pozole|atole|calabaza|champurrado', c: ['MX'] },
  { n: 'Bonfire Night', w: '11-05', t: 'toffee apple|parkin|bangers|sausage|jacket potato|baked potato|stew|soup|treacle|hot dog', c: [] },
  { n: 'Thanksgiving', w: 'nth:11:4:4', t: 'turkey|stuffing|dressing|cranberry|mashed potato|gravy|sweet potato|pumpkin pie|green bean|pecan pie|casserole|apple pie|cornbread|brussels|dinner roll' },
  { n: 'St. Andrew’s Day', w: '11-30', t: 'haggis|cullen skink|cranachan|shortbread|stovies', c: [] },
  { n: 'Hanukkah', w: 'tbl:hanukkah', s: 8, t: 'latke|brisket|sufganiyot|doughnut|donut|applesauce|kugel|fritter|potato pancake|challah|rugelach' },
  { n: 'Christmas Eve', w: '12-24', t: 'ham|roast|prime rib|beef wellington|wellington|eggnog|gingerbread|cookie|yule|buche|stollen|tamale|panettone|trifle|mulled|fish|seafood|bacalao' },
  { n: 'Christmas', w: '12-25', t: 'ham|roast|prime rib|turkey|gingerbread|eggnog|cookie|stollen|tamale|panettone|mince|trifle|pudding|pie|fruitcake|wellington|goose|duck|cranberry|stuffing|gravy|brussels|sugar cookie' },
  { n: 'Boxing Day', w: '12-26', t: 'leftover|turkey|bubble and squeak|ham|sandwich|pie|stew' },
  { n: 'Kwanzaa', w: '12-26', s: 7, t: 'jollof|collard|black.eyed|gumbo|peanut|sweet potato|okra|plantain|cornbread|fried chicken|yam' },
  { n: 'New Year’s Eve', w: '12-31', t: 'shrimp|dip|lobster|tenderloin|appetizer|caviar|oyster|slider|fondue|cheese|pigs in a blanket|spinach artichoke|deviled egg|stuffed mushroom' }
];

// National days: the dish list is that country's own recipes. [date, name, country code(s)]
const NATIONAL = [
  ['01-01', 'Independence Day (Haiti)', ['HT']], ['01-01', 'Liberation Day (Cuba)', ['CU']], ['01-04', 'Independence Day (Myanmar)', ['MM']],
  ['02-04', 'Independence Day (Sri Lanka)', ['LK']], ['02-11', 'National Foundation Day (Japan)', ['JP']], ['02-16', 'Restoration of Lithuania Day', ['LT']],
  ['02-24', 'Independence Day (Estonia)', ['EE']], ['02-27', 'Independence Day (Dominican Republic)', ['DO']], ['03-06', 'Independence Day (Ghana)', ['GH']],
  ['03-23', 'Pakistan Day', ['PK']], ['03-25', 'Independence Day (Greece)', ['GR']], ['03-26', 'Independence Day (Bangladesh)', ['BD']],
  ['04-04', 'Independence Day (Senegal)', ['SN']], ['04-27', 'King’s Day (Netherlands)', ['NL']], ['04-27', 'Freedom Day (South Africa)', ['ZA']],
  ['05-17', 'Constitution Day (Norway)', ['NO']], ['06-02', 'Republic Day (Italy)', ['IT']], ['06-05', 'Constitution Day (Denmark)', ['DK']],
  ['06-06', 'National Day (Sweden)', ['SE']], ['06-10', 'Portugal Day', ['PT']], ['06-12', 'Independence Day (Philippines)', ['PH']],
  ['06-12', 'Russia Day', ['RU']], ['06-17', 'National Day (Iceland)', ['IS']], ['07-05', 'Independence Day (Venezuela)', ['VE']],
  ['07-09', 'Independence Day (Argentina)', ['AR']], ['07-20', 'Independence Day (Colombia)', ['CO']], ['07-21', 'National Day (Belgium)', ['BE']],
  ['07-23', 'Revolution Day (Egypt)', ['EG']], ['07-28', 'Independence Day (Peru)', ['PE']], ['07-30', 'Throne Day (Morocco)', ['MA']],
  ['08-01', 'National Day (Switzerland)', ['CH']], ['08-06', 'Independence Day (Jamaica)', ['JM']], ['08-09', 'National Day (Singapore)', ['SG']],
  ['08-15', 'Independence Day (India)', ['IN']], ['08-15', 'Liberation Day (Korea)', ['KR']], ['08-17', 'Independence Day (Indonesia)', ['ID']],
  ['08-20', 'St. Stephen’s Day (Hungary)', ['HU']], ['08-24', 'Independence Day (Ukraine)', ['UA']], ['08-31', 'Merdeka Day (Malaysia)', ['MY']],
  ['08-31', 'Independence Day (Trinidad and Tobago)', ['TT']], ['09-02', 'National Day (Vietnam)', ['VN']], ['09-07', 'Independence Day (Brazil)', ['BR']],
  ['09-16', 'Independence Day (Mexico)', ['MX']], ['09-18', 'Independence Day (Chile)', ['CL']], ['10-01', 'National Day (China)', ['CN']],
  ['10-01', 'Independence Day (Nigeria)', ['NG']], ['10-03', 'German Unity Day', ['DE']], ['10-03', 'National Foundation Day (Korea)', ['KR']],
  ['10-10', 'National Day (Taiwan)', ['TW']], ['10-12', 'National Day (Spain)', ['ES']], ['10-26', 'National Day (Austria)', ['AT']],
  ['10-28', 'Ohi Day (Greece)', ['GR']], ['10-29', 'Republic Day (Turkey)', ['TR']], ['11-11', 'Independence Day (Poland)', ['PL']],
  ['11-22', 'Independence Day (Lebanon)', ['LB']], ['12-01', 'National Day (Romania)', ['RO']], ['12-05', 'National Day (Thailand)', ['TH']],
  ['12-06', 'Independence Day (Finland)', ['FI']], ['12-12', 'Jamhuri Day (Kenya)', ['KE']]
];

// The food holidays, every day of the year (leap day included), as the food-holiday calendar lists them.
const FOOD = `01-01: National Bloody Mary Day
01-02: National Buffet Day; National Cream Puff Day
01-03: Fruitcake Toss Day; National Chocolate Covered Cherry Day
01-04: National Spaghetti Day
01-05: National Whipped Cream Day
01-06: Apple Tree Day; National Bean Day; National Shortbread Day
01-07: National Tempura Day
01-08: National English Toffee Day
01-09: National Apricot Day
01-10: Bittersweet Chocolate Day
01-11: National Milk Day
01-12: Curried Chicken Day; National Marzipan Day
01-13: National Peach Melba Day
01-14: National Hot Pastrami Sandwich Day
01-15: Strawberry Ice Cream Day
01-16: International Hot & Spicy Food Day; National Fig Newton Day
01-17: National Bootlegger's Day; National Hot Buttered Rum Day
01-18: Peking Duck Day
01-19: National Popcorn Day
01-20: National Buttercrunch Day; National Cheese Lover's Day; Rid the World of Fad Diets & Gimmicks Day
01-21: National Granola Bar Day; New England Clam Chowder Day
01-22: National Blonde Brownie Day; Women's Healthy Weight Day
01-23: Rhubarb Pie Day
01-24: National Peanut Butter Day
01-25: National Irish Coffee Day
01-26: National Peanut Brittle Day; National Pistachio Day
01-27: Chocolate Cake Day
01-28: National Blueberry Pancake Day
01-29: National Corn Chip Day
01-30: National Croissant Day
01-31: National Hot Chocolate Day
02-01: National Baked Alaska Day
02-02: Heavenly Hash Day
02-03: National Carrot Cake Day
02-04: Homemade Soup Day; National Stuffed Mushroom Day
02-05: National Chocolate Fondue Day; World Nutella Day
02-06: Bubble Gum Day; National Chopsticks Day
02-07: Ice Cream for Breakfast Day; National Fettuccine Alfredo Day
02-08: Molasses Bar Day; Pork Rind Appreciation Day
02-09: National Bagels and Lox Day; Oatmeal Monday; Pizza Pie Day
02-10: Cream Cheese Brownie Day
02-11: Peppermint Patty Day
02-12: National Plum Pudding Day
02-13: National Tortellini Day
02-14: National Cream-Filled Chocolates Day
02-15: National Gumdrop Day
02-16: National Almond Day
02-17: National Indian Pudding Day
02-18: National Drink Wine Day
02-19: National Chocolate Mint Day
02-20: National Cherry Pie Day; National Tartar Sauce Day
02-21: National Sticky Bun Day
02-22: National Margarita Day; National Cook a Sweet Potato Day
02-23: National Banana Bread Day
02-24: National Cupcake Day (in Canada); National Tortilla Chip Day
02-25: National Chocolate Covered Nuts Day; National Clam Chowder Day; National Pancake Day (IHOP)
02-26: National Toast Day; National Chili Day; National Personal Chefs Day; National Pistachio Day
02-27: National Strawberry Day
02-28: National Chocolate Souffle Day
02-29: National Surf and Turf Day
03-01: National Fruit Compote Day; National Peanut Butter Lover's Day
03-02: National Banana Cream Pie Day
03-03: National Cold Cuts Day
03-04: National Pound Cake Day
03-05: National Cheese Doodle Day
03-06: National Frozen Food Day; National Oreo Cookie Day; National White Chocolate Cheesecake Day
03-07: National Cereal Day
03-08: National Peanut Cluster Day
03-09: National Crabmeat Day; National Meatball Day
03-10: National Blueberry Popover Day; National Pack Your Lunch Day
03-11: Oatmeal Nut Waffles Day; Registered Dietitian Day
03-12: National Baked Scallops Day; Popcorn Lover's Day
03-13: Coconut Torte Day
03-14: Bake a Pie in Solidarity Day; National Potato Chip Day
03-15: Celebrating Our Bountiful Food Supply; National Peanut Lovers' Day; National Pears Helene Day
03-16: National Artichoke Hearts Day
03-17: National Irish Food Day
03-18: Oatmeal Cookie Day
03-19: National Agriculture Day; National Chocolate Caramel Day; National Poultry Day
03-20: Great American MEAT-OUT; National Ravioli Day
03-21: California Strawberry Day; Maple Syrup Saturday; National French Bread Day
03-22: National Bavarian Crepes Day
03-23: National Chip and Dip Day; National Melba Toast Day
03-24: National Cheesesteak Day; National Chocolate Covered Raisin Day
03-25: International Waffle Day; National Lobster Newburg Day; National Pecan Day; Whole Grain Sampling Day
03-26: National Nougat Day; Spinach Day
03-27: National Spanish Paella Day
03-28: Something on a Stick Day
03-29: National Lemon Chiffon Cake Day
03-30: Turkey Neck Soup Day
03-31: National Clams on the Half Shell Day; Oranges and Lemons Day; Tater Day
04-01: National Sourdough Bread Day
04-02: National Burrito Day; National Love Your Produce Manager Day; National Peanut Butter and Jelly Day
04-03: National Chocolate Mousse Day
04-04: National Cordon Bleu Day
04-05: National Baked Ham with Pineapple Day; National Caramel Day; National Raisin and Spice Bar Day
04-06: Hostess Twinkie Day; National Caramel Popcorn Day
04-07: Coffee Cake Day
04-08: National Empanada Day
04-09: Chinese Almond Cookie Day; National Gin and Tonic Day
04-10: National Cinnamon Crescent Day
04-11: National Cheese Fondue Day; National Poutine Day
04-12: Grilled Cheese Sandwich Day; National Licorice Day
04-13: Make Lunch Count Day; National Peach Cobbler Day
04-14: National Pecan Day
04-15: McDonald's Day; National Glazed Spiral Ham Day
04-16: Day of the Mushroom; National Eggs Benedict Day
04-17: National Cheeseball Day
04-18: Animal Crackers Birthday
04-19: Garlic Day
04-20: Lima Bean Respect Day; National Pineapple Upside-Down Cake Day
04-21: National Chickpea Day; National Chocolate Covered Cashews Truffle Day
04-22: National Jelly Bean Day
04-23: National Cherry Cheesecake Day; National Picnic Day
04-24: National Pigs-in-a-Blanket Day
04-25: National Zucchini Bread Day
04-26: National Pretzel Day
04-27: National Prime Rib Day
04-28: National Blueberry Pie Day
04-29: National Shrimp Scampi Day; Stop Food Waste Day
04-30: National Raisin Day; National Bubble Tea Day
05-01: National Chocolate Parfait Day; School Lunch Hero Day
05-02: National Herb Day; National Truffles Day
05-03: National Raspberry Popover Day
05-04: National Candied Orange Peel Day
05-05: National Chocolate Custard Day; National Hoagie Day; Totally Chipotle Day
05-06: International No Diet Day; National Crepes Suzette Day
05-07: National Roast Leg of Lamb Day
05-08: National Coconut Cream Pie Day
05-09: National Foodies Day
05-10: National Shrimp Day
05-11: Eat What You Want Day
05-12: National Nutty Fudge Day
05-13: International Hummus Day; National Apple Pie Day; National Fruit Cocktail Day
05-14: National Buttermilk Biscuit Day
05-15: National Chocolate Chip Day; National Pizza Party Day
05-16: International Pickle Day; National Coquilles St. Jacques Day
05-17: National Cherry Cobbler Day; National Walnut Day
05-18: I Love Reese's Day; National Cheese Souffle Day
05-19: National Devil's Food Cake Day
05-20: Pick Strawberries Day
05-21: Eat More Fruits & Vegetables Day; National Strawberries and Cream Day; National Waiters and Waitresses Day
05-22: National Vanilla Pudding Day
05-23: National Taffy Day
05-24: Asparagus Day; National Escargot Day
05-25: Carb Day; National Brown-Bag-It Day
05-26: National Blueberry Cheesecake Day; National Cherry Dessert Day
05-27: National Italian Beef Day; National Grape Popsicle Day
05-28: National Brisket Day; National Hamburger Day
05-29: National Coq Au Vin Day
05-30: National Mint Julep Day
05-31: National Macaroon Day
06-01: World Milk Day; National Hazelnut Cake Day
06-02: National Rocky Road Ice Cream Day; National Rotisserie Chicken Day
06-03: National Egg Day; National Chocolate Macaroon Day
06-04: National Cheese Day; National Frozen Yogurt Day
06-05: National Donut Day; National Gingerbread Day; National Ketchup Day; National Sausage Roll Day; National Veggie Burger Day
06-06: National Applesauce Cake Day
06-07: National Chocolate Ice Cream Day
06-08: Jelly-Filled Doughnut Day
06-09: National Strawberry Rhubarb Pie Day
06-10: National Iced Tea Day; National Herbs & Spices Day
06-11: Corn on the Cob Day; National German Chocolate Cake Day
06-12: National Jerky Day; National Peanut Butter Cookie Day; International Falafel Day
06-13: National Cupcake Lovers Day
06-14: National Strawberry Shortcake Day
06-15: National Lobster Day
06-16: Fresh Veggies Day
06-17: Eat All Your Veggies Day; National Apple Strudel Day
06-18: International Picnic Day; International Sushi Day; National Cherry Tart Day
06-19: National Martini Day
06-20: National Ice Cream Soda Day; National Vanilla Milkshake Day
06-21: National Peaches and Cream Day
06-22: National Chocolate Eclair Day; National Onion Rings Day
06-23: National Pecan Sandy Day
06-24: National Parchment Cooking Day; National Pralines Day
06-25: National Catfish Day; National Strawberry Parfait Day
06-26: National Chocolate Pudding Day
06-27: National Indian Pudding Day
06-28: National Ceviche Day; National Tapioca Day
06-29: National Almond Buttercrunch Day
06-30: National Food Truck Day; National Ice Cream Soda Day; National Mai Tai Day
07-01: Creative Ice Cream Flavor Day; International Fruit Day; National Gingersnap Day
07-02: National Anisette Day
07-03: Eat Beans Day; National Chocolate Wafer Day
07-04: Independence from Meat Day; International Cherry Pit Spitting Day; National Barbecued Spareribs Day
07-05: National Apple Turnover Day; National Graham Cracker Day
07-06: National Fried Chicken Day
07-07: Chocolate Day; National Macaroni Day; National Strawberry Sundae Day
07-08: National Blueberry Day; National Chocolate with Almonds Day
07-09: National Sugar Cookie Day
07-10: Pick Blueberries Day; National French Fries Day
07-11: Make Up Your Own Sundae Day; National Blueberry Muffin Day; National Rainier Cherries Day
07-12: National Pecan Pie Day
07-13: National Beef Tallow Day; National Beans 'n' Franks Day
07-14: National Macaroni and Cheese Day
07-15: National Gummi Worm Day; National Hot Dog Day; National Tapioca Pudding Day
07-16: National Corn Fritter Day
07-17: National Peach Ice Cream Day
07-18: National Caviar Day; National Sour Candy Day
07-19: National Ice Cream Day
07-20: Fortune Cookie Day; International Cake Day; National Lollipop Day
07-21: National Junk Food Day
07-22: National Penuche Fudge Day
07-23: National Vanilla Ice Cream Day
07-24: National Tequila Day
07-25: National Hot Fudge Sundae Day
07-26: Bagelfest Day
07-27: National Creme Brulee Day; National Scotch Day
07-28: National Crawfish Day
07-29: Cheese Sacrifice Purchase Day; National Chicken Wing Day; National Lasagna Day
07-30: National Cheesecake Day; National Chicken and Waffles Day; National Chili Dog Day
07-31: Cotton Candy Day; Jump for Jelly Beans Day; National Avocado Day
08-01: National Mustard Day; National Raspberry Cream Pie Day
08-02: National Ice Cream Sandwich Day
08-03: National IPA Day; Grab Some Nuts Day; National Watermelon Day
08-04: National Chocolate Chip Cookie Day
08-05: National Oyster Day
08-06: National Root Beer Float Day
08-07: Braham Pie Day; National Raspberries and Cream Day
08-08: National SPAM Musubi Day; National Frozen Custard Day; National Zucchini Day; International Beer Day; Sneak Some Zucchini Onto Your Neighbor's Porch Night; Takoyaki Day
08-09: National Rice Pudding Day
08-10: National S'mores Day
08-11: National Raspberry Tart Day; National Panini Day
08-12: Julienne Fries Day
08-13: National Filet Mignon Day
08-14: National Creamsicle Day
08-15: Lemon Meringue Pie Day
08-16: National Rum Day; National Bratwurst Day
08-17: Cupcake Day (For the RSPCA); National Vanilla Custard Day
08-18: National Soft Ice Cream Day
08-19: National Hot and Spicy Food Day; Potato Day
08-20: National Chocolate Pecan Pie Day; National Bacon Lovers' Day
08-21: National Pecan Torte Day; National Sweet Tea Day
08-22: National Spumoni Day
08-23: National Sponge Cake Day
08-24: National Peach Pie Day; National Waffle Day
08-25: National Banana Split Day
08-26: National Cherry Popsicle Day
08-27: Banana Lovers' Day
08-28: National Cherry Turnover Day
08-29: Chop Suey Day; More Herbs, Less Salt Day
08-30: National Toasted Marshmallow Day
08-31: Eat Outside Day; National Trail Mix Day
09-01: National Cherry Popover Day; National Gyro Day
09-02: National Grits for Breakfast Day; National Blueberry Popsicle Day
09-03: National Welsh Rarebit Day
09-04: National Food Bank Day; National Macadamia Nut Day
09-05: International Bacon Day; National Cheese Pizza Day
09-06: National Coffee Ice Cream Day
09-07: National Acorn Squash Day; Salami Day
09-08: National Date Nut Bread Day
09-09: National "I Love Food" Day
09-10: National Ants on a Log
09-11: National Hot Cross Bun Day
09-12: National Chocolate Milkshake Day
09-13: International Chocolate Day; Kids Take Over the Kitchen Day; National Peanut Day; Snack a Pickle Time
09-14: Eat a Hoagie Day; National Cream Filled Donut Day
09-15: National Cheese Toast Day; National Linguine Day
09-16: National Cinnamon Raisin Bread Day; National Guacamole Day
09-17: National Apple Dumpling Day
09-18: National Cheeseburger Day
09-19: International Eat an Apple Day; National Butterscotch Pudding Day
09-20: National Pepperoni Day; National Queso Day; National String Cheese Day
09-21: International Banana Festival; National Pecan Cookie Day
09-22: National Ice Cream Cone Day; National White Chocolate Day
09-23: National Snack Stick Day
09-24: National Cherries Jubilee Day
09-25: Hug a Vegetarian Day; National Quesadilla Day; National Food Service Workers Day
09-26: National Dumpling Day; National Key Lime Pie Day
09-27: National Corned Beef Hash Day
09-28: Family Day (A Day to Eat Dinner With Your Kids); Strawberry Cream Pie Day
09-29: National Coffee Day; National Mocha Day
09-30: National Mulled Cider Day
10-01: Homemade Cookies Day; Pudding Season Begins; World Vegetarian Day
10-02: National Fried Scallops Day
10-03: National Caramel Custard Day
10-04: Kanelbullens Dag (Cinnamon Bun Day); National Taco Day
10-05: National Apple Betty Day
10-06: National Noodle Day
10-07: National Frappe Day; National Pumpkin Seed Day
10-08: National Fluffernutter Day; National Pierogi Day; National Salmon Day
10-09: International Beer and Pizza Day; Moldy Cheese Day; Submarine Hoagie Hero Grinder Day; World Egg Day
10-10: National Angel Food Cake Day
10-11: National Sausage Pizza Day
10-12: National Gumbo Day
10-13: National Yorkshire Pudding Day
10-14: National Dessert Day; National Chocolate Covered Insects Day
10-15: National Chicken Cacciatore Day; National Roast Pheasant Day
10-16: World Food Day
10-17: Four Prunes Day; National Pasta Day
10-18: Meatloaf Appreciation Day; National Chocolate Cupcake Day
10-19: National Seafood Bisque Day
10-20: National Brandied Fruit Day
10-21: National Pumpkin Cheesecake Day
10-22: National Nut Day
10-23: National Boston Cream Pie Day; National Canning Day
10-24: Food Day; Good and Plenty Day; National Bologna Day
10-25: National Greasy Foods Day
10-26: Mince Meat Pie Day; National Chicken Fried Steak Day; Pumpkin Day
10-27: National Potato Day
10-28: National Chocolate Day; Wild Foods Day
10-29: National Oatmeal Day
10-30: Buy a Donut Day; National Candy Corn Day
10-31: National Caramel Apple Day
11-01: National Deep Fried Clams Day; National Vinegar Day
11-02: National Deviled Egg Day
11-03: National Sandwich Day
11-04: National Candy Day
11-05: National Kimchi Day; National Men Make Dinner Day
11-06: National Nachos Day
11-07: National Bittersweet Chocolate with Almonds Day
11-08: Cook Something Bold & Pungent Day
11-09: National Greek Yogurt Day
11-10: National Pork Belly Day; National Vanilla Cupcake Day; National Mussels Days
11-11: National Sundae Day
11-12: National Pizza with Everything Day (Except Anchovies)
11-13: National Indian Pudding Day
11-14: National Pickle Day
11-15: National Bundt Day; National Clean Out Your Refrigerator Day; National Raisin Bran Cereal Day
11-16: National Fast Food Day
11-17: Homemade Bread Day; National Baklava Day; National Butter Day
11-18: National Vichyssoise Day
11-19: Beaujolais Nouveau Day; National Macchiato Day
11-20: National Peanut Butter Fudge Day
11-21: Gingerbread Day; National Stuffing Day
11-22: National Cashew Day
11-23: Eat a Cranberry Day
11-24: National Sardines Day
11-25: National Parfait Day
11-26: National Cake Day
11-27: National Bavarian Cream Pie Day; Sinkie Day
11-28: National French Toast Day
11-29: Chocolates Day; National Lemon Cream Pie Day
11-30: National Mousse Day
12-01: Eat Red Apple Day; National Pie Day
12-02: National Fritters Day
12-03: National Apple Pie Day
12-04: National Cookie Day
12-05: National Sacher Torte Day; World Pear Day
12-06: Microwave Oven Day; National Gazpacho Day
12-07: National Cotton Candy Day
12-08: National Chocolate Brownie Day; National Donair Day
12-09: National Opal Apples Day; National Pastry Day
12-10: National Lager Day
12-11: National Noodle Ring Day
12-12: National Pho Day; National Cocoa Day
12-13: Ice Cream and Violins Day
12-14: National Bouillabaisse Day
12-15: National Cupcake Day
12-16: National Chocolate Covered Anything Day
12-17: National Maple Syrup Day
12-18: National Roast Suckling Pig Day
12-19: National Hard Candy Day
12-20: National Fried Shrimp Day
12-21: Kiwi Fruit Day (California); National Fish Sauce Day
12-22: National Date Nut Bread Day
12-23: National Pfeffernuesse Day
12-24: National Eggnog Day
12-25: National Tamales Day; National Pumpkin Pie Day
12-26: National Candy Cane Day
12-27: National Fruit Cake Day
12-28: National Box of Chocolate Day
12-29: Pepper Pot Day
12-30: Bacon Day; National Bicarbonate of Soda Day (Baking Soda)
12-31: National Champagne Day`;

// Dishes for the food days where the name alone would not find the right recipes (first match wins; 0 = nothing to cook).
const FV = 'vegetarian|vegan|veggie|lentil|chickpea|tofu|bean';
const MEAT = /\b(ham|bacon|sausage|chicken|beef|pork|turkey|lamb|fish|shrimp|steak|meatball|ribs|brisket|salmon|tuna|crab|lobster|prosciutto|pancetta|chorizo|anchov\w*|duck|hot dogs?)\b/i;
const LUNCH = 'sandwich|wrap|salad|bento|pasta salad|quesadilla';
const VEG = 'salad|vegetable|fruit|stir.fry|roasted vegetables';
const LEFT = 'soup|stew|fried rice|frittata|stir.fry|casserole|hash|bubble and squeak|pasta';
const HERB = 'herb|basil|parsley|cilantro|thyme|rosemary|pesto|chimichurri';
const PICNIC = 'sandwich|potato salad|fried chicken|pasta salad|deviled egg|coleslaw|wrap|salad';
const OVR = [
  ['coffee cake', 'coffee cake|crumb cake'], ['coffee ice cream', 'ice cream|coffee'], ['national coffee day', 'coffee|mocha'], ['mocha', 'mocha|coffee|chocolate'],
  ['bloody mary', 0], ['bootleg', 0], ['hot buttered rum', 0], ['irish coffee', 0], ['margarita', 0], ['drink wine', 0], ['gin and tonic', 0], ['mai tai', 0], ['martini', 0],
  ['mint julep', 0], ['tequila', 0], ['scotch', 0], ['rum day', 0], ['ipa day', 0], ['international beer day', 0], ['lager', 0], ['champagne', 0], ['beaujolais', 0], ['macchiato', 0],
  ['frappe', 0], ['bubble tea', 0], ['bubble gum', 0], ['gumdrop', 0], ['gummi', 0], ['lollipop', 0], ['cotton candy', 0], ['jelly bean', 0], ['sour candy', 0], ['candy corn', 0],
  ['hard candy', 0], ['creamsicle', 0], ['spumoni', 0], ['sweet tea', 0], ['iced tea', 0], ['root beer', 0], ['anisette', 0], ['sinkie', 0], ['national candy day', 0], ['taffy', 0],
  ['snack stick', 0], ['good and plenty', 0], ['covered insects', 0], ['wild foods', 0], ['food day', 0], ['healthy weight', 0], ['rid the world', 0], ['dietitian', 0],
  ['personal chefs', 0], ['waiters', 0], ['food bank', 0], ['food service', 0], ['foodies', 0], ['produce manager', 0], ['agriculture', 0], ['bountiful food', 0], ['i love food', 0],
  ['eat what you want', 0], ['men make dinner', 0], ['fruitcake toss', 'fruitcake|fruit cake|stollen'], ['fruit cake', 'fruitcake|fruit cake|stollen'],
  ['buffet', 'platter|casserole|slider|salad|meatball|wings'], ['pastrami', 'pastrami|reuben|deli|sandwich'], ['hot & spicy', 'spicy|chili|chilli|curry|jalapeno|sriracha|harissa|vindaloo|kimchi|sichuan|szechuan|mapo|buffalo'],
  ['hot and spicy', 'spicy|chili|chilli|curry|jalapeno|sriracha|harissa|vindaloo|kimchi|sichuan|szechuan|mapo|buffalo'],
  ['baked alaska', 'alaska|meringue|ice cream cake'], ['heavenly hash', 'hash|marshmallow|chocolate'], ['nutella', 'nutella|hazelnut|chocolate'],
  ['chopsticks', 'noodle|stir.fry|fried rice|sushi|dumpling|lo mein|ramen|pad thai'], ['ice cream for breakfast', 'ice cream|waffle|pancake|french toast|parfait'],
  ['pork rind', 'pork|bacon|chicharron|carnitas'], ['bagels and lox', 'bagel|lox|smoked salmon|cream cheese'], ['oatmeal monday', 'oatmeal|oats|porridge'],
  ['peppermint patty', 'peppermint|mint'], ['indian pudding', 'indian pudding|cornmeal|corn pudding|molasses'], ['cream-filled chocolates', 'chocolate|truffle|ganache'],
  ['tartar sauce', 'tartar|fish and chips|fried fish|crab cake|fish'], ['chocolate covered nuts', 'chocolate|nuts'], ['cold cuts', 'sandwich|deli|ham|turkey|salami|charcuterie|antipasto'],
  ['cheese doodle', 'cheese|puff'], ['oreo', 'oreo|cookie|cookies and cream'], ['pack your lunch', LUNCH], ['make lunch count', LUNCH], ['school lunch hero', LUNCH], ['brown-bag', LUNCH],
  ['bake a pie in solidarity', 'pie|pot pie|quiche|tart'], ['poultry', 'chicken|turkey|duck'], ['meat-out', FV], ['independence from meat', FV], ['hug a vegetarian', FV], ['world vegetarian', FV],
  ['maple syrup saturday', 'maple|pancake|waffle|french toast'], ['whole grain sampling', 'whole grain|oat|quinoa|barley|brown rice|farro|bulgur'],
  ['something on a stick', 'skewer|kebab|satay|corn dog|kabob|yakitori|souvlaki'], ['clams on the half shell', 'clam|oyster'], ['tater', 'potato|tater|hash brown'],
  ['twinkie', 'sponge cake|cream filled|twinkie'], ['mcdonald', 'burger|cheeseburger|fries|nugget|milkshake'], ['cheeseball', 'cheese ball|cheeseball|dip'],
  ['animal crackers', 'cracker|cookie'], ['covered cashews', 'cashew|truffle|chocolate'], ['picnic', PICNIC], ['pigs-in-a-blanket', 'pigs in a blanket|hot dog|sausage roll|crescent'],
  ['stop food waste', LEFT], ['clean out your refrigerator', LEFT], ['national herb', HERB], ['herbs & spices', HERB], ['more herbs', HERB], ['totally chipotle', 'chipotle'],
  ['no diet', 'cake|pie|cookie|brownie|pasta|mac and cheese|pizza|burger'], ['fruit cocktail', 'fruit salad|fruit'], ['pizza party', 'pizza'], ['coquilles', 'coquilles|scallop'],
  ['reese', 'peanut butter|chocolate'], ['eat more fruits', VEG], ['fresh veggies', VEG], ['eat all your veggies', VEG], ['carb day', 'pasta|bread|rice|noodle|potato'],
  ['rocky road', 'rocky road|ice cream|marshmallow'], ['frozen yogurt', 'yogurt|parfait'], ['jelly-filled', 'doughnut|donut'], ['corn on the cob', 'corn on the cob|corn|elote'],
  ['parchment', 'papillote|parchment|baked fish|salmon|fish'], ['food truck', 'taco|burger|fries|hot dog|gyro|falafel|banh mi|kebab'], ['creative ice cream', 'ice cream'],
  ['international fruit', 'fruit'], ['cherry pit', 'cherry|cherries'], ['barbecued spareribs', 'ribs|barbecue|bbq'], ['make up your own sundae', 'sundae|ice cream'],
  ['beef tallow', 'beef|fries'], ["beans 'n' franks", 'bean|hot dog'], ['junk food', 'burger|fries|nachos|pizza|hot dog|wings|fried'], ['bagelfest', 'bagel'],
  ['cheese sacrifice', 'cheese'], ['braham pie', 'pie'], ['spam musubi', 'spam|musubi|sushi|rice'], ["s'mores", "s.more|marshmallow|graham"], ['julienne fries', 'fries'],
  ['sneak some zucchini', 'zucchini'], ['toasted marshmallow', "marshmallow|s.more"], ['trail mix', 'granola|nuts|trail mix|oat'], ['grits for breakfast', 'grits|polenta|shrimp and grits'],
  ['ants on a log', 'celery|peanut butter'], ['kids take over', 'pizza|cookie|pancake|quesadilla|sandwich|pasta|mac and cheese|muffin'], ['snack a pickle', 'pickle'],
  ['string cheese', 'cheese'], ['family day', 'casserole|roast|spaghetti|pasta|pot pie|meatloaf|stew|lasagna|chicken'], ['mulled cider', 'cider|apple|cinnamon'],
  ['fluffernutter', 'peanut butter|marshmallow'], ['moldy cheese', 'cheese|blue cheese|gorgonzola'], ['submarine hoagie', 'sub|hoagie|sandwich|hero|italian'],
  ['dessert day', 'cake|pie|cookie|pudding|brownie|cobbler'], ['canning', 'jam|pickle|preserve|salsa|chutney'], ['greasy foods', 'fried|fries|burger|bacon'],
  ['cook something bold', 'garlic|curry|kimchi|chili|onion|vindaloo|harissa|anchovy|blue cheese'], ['fast food', 'burger|fries|nugget|taco|hot dog'], ['vichyssoise', 'potato leek|leek|vichyssoise'],
  ['raisin bran', 'raisin|bran|muffin'], ['microwave', 'mug cake|microwave|mug'], ['donair', 'doner|donair|kebab|shawarma|gyro'], ['opal apples', 'apple'], ['noodle ring', 'noodle'],
  ['cocoa', 'hot chocolate|cocoa'], ['ice cream and violins', 'ice cream'], ['roast suckling pig', 'pork|roast pork|pig'], ['fish sauce', 'fish sauce|pad thai|pho|thai'],
  ['pfeffernuesse', 'cookie|spice cookie|gingerbread'], ['eggnog', 'eggnog|custard'], ['candy cane', 'peppermint|mint'], ['box of chocolate', 'chocolate'],
  ['chocolate covered anything', 'chocolate'], ['pepper pot', 'pepper pot|pepperpot|stew|tripe'], ['bicarbonate', 'baking soda|biscuit|soda bread|pancake'],
  ['cheese pizza', 'pizza'], ['sausage pizza', 'pizza|sausage'], ['pizza with everything', 'pizza'], ['pizza pie', 'pizza'], ['beer and pizza', 'pizza'],
  ['grab some nuts', 'nuts|peanut|almond|walnut|cashew'], ['eat outside', 'grill|picnic|salad|burger|kebab|skewer'], ['surf and turf', 'surf and turf|steak|lobster|shrimp'],
  ['irish food', 'irish|colcannon|corned beef|shepherd|soda bread|champ|boxty|stew']
];

// Words that carry no dish, and words too general to count on their own.
const STOP = new Set('national international world day days appreciation lover lovers lover\'s lovers\' eat pick make homemade season begins festival sampling respect celebrating our bountiful food foods supply the of and a an your for with in on to up all some take over kitchen kids family dinner totally cook grab buy jump sneak something hug stop love what you want clean out bold pungent men night time less more red new big'.split(' '));
const WEAK = new Set('hot spicy covered filled baked fried roast roasted whole fresh soft sour cream creamy sweet frozen'.split(' '));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// the word and its other spellings (cookies → cookie, cherries → cherry, peaches → peach, cherry → cherries), each allowed an s/es on the end
const forms = (w) => {
  const v = new Set([w]);
  if (/ies$/.test(w)) { v.add(w.slice(0, -1)); v.add(`${w.slice(0, -3)}y`); }
  else if (/es$/.test(w) && w.length > 4) { v.add(w.slice(0, -2)); v.add(w.slice(0, -1)); }
  else if (/s$/.test(w) && !/ss$/.test(w) && w.length > 3) v.add(w.slice(0, -1));
  if (/y$/.test(w) && w.length > 3) v.add(`${w.slice(0, -1)}ie`);
  return [...v];
};
const wordRe = (w) => new RegExp(`\\b(?:${forms(w).map(esc).join('|')})(?:s|es)?\\b`, 'i');
const altRe = (alts) => new RegExp(`\\b(?:${alts})(?:s|es)?\\b`, 'i');

// "National Peanut Butter Day" → a phrase ("peanut butter", worth 3) and its main words (worth 1 each)
function autoTerms(name) {
  const words = name.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z' -]/g, ' ').split(/[\s-]+/).filter((w) => w && !STOP.has(w));
  if (!words.length) return [];
  const out = [];
  if (words.length === 1) return [{ re: wordRe(words[0]), w: 3 }];   // "Nut Day", "Pie Day": one word is the whole dish
  if (words.length > 1) out.push({ re: new RegExp(`\\b${words.slice(0, -1).map(esc).join('[- ]?')}[- ]?(?:${forms(words.at(-1)).map(esc).join('|')})(?:s|es)?\\b`, 'i'), w: 3 });
  for (const w of new Set(words)) if (w.length > 2 && !WEAK.has(w)) out.push({ re: wordRe(w), w: 1 });
  return out;
}
const VEG_DAYS = ['meat-out', 'independence from meat', 'hug a vegetarian', 'world vegetarian'];
function foodSpec(name) {
  const low = name.toLowerCase();
  const o = OVR.find(([k]) => low.includes(k));
  if (!o) return { terms: autoTerms(name) };
  return { terms: o[1] ? [{ re: altRe(o[1]), w: 3 }] : [], no: VEG_DAYS.some((k) => low.includes(k)) ? MEAT : undefined };
}
const holidayTerms = (t) => (t ? [{ re: altRe(t), w: 3 }] : []);

const FOOD_BY_DAY = new Map();
for (const line of FOOD.split('\n')) {
  const [md, rest] = line.split(': ');
  FOOD_BY_DAY.set(md, rest.split('; ').map((n) => ({ id: `food-${md}-${n}`, name: n, kind: 'food', ...foodSpec(n), c: [] })));
}
const HOLIDAY_DAYS = HOLIDAYS.map((h) => ({ id: `hol-${h.n}`, name: h.n, kind: 'holiday', w: h.w, s: h.s || 1, terms: holidayTerms(h.t), c: h.c || [] }));
const NATIONAL_BY_DAY = new Map();
for (const [md, name, c] of NATIONAL) { if (!NATIONAL_BY_DAY.has(md)) NATIONAL_BY_DAY.set(md, []); NATIONAL_BY_DAY.get(md).push({ id: `nat-${md}-${name}`, name, kind: 'national', terms: [], c }); }

function startOf(w, y) {
  if (/^\d\d-\d\d$/.test(w)) return utc(y, +w.slice(0, 2), +w.slice(3));
  let m;
  if ((m = w.match(/^nth:(\d+):(\d):(-?\d+)$/))) return utc(y, +m[1], nth(y, +m[1], +m[2], +m[3]));
  if ((m = w.match(/^easter:([+-]?\d+)$/))) return easter(y) + +m[1] * DAY;
  if ((m = w.match(/^tbl:(\w+)$/))) { const v = TBL[m[1]]?.[y]; return v ? utc(y, +v.slice(0, 2), +v.slice(3)) : null; }
  return null;
}

// Every special day on one calendar day ("2026-10-22"): holidays first, then national days, then the food holidays.
export function specialDays(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  if (!y || !m || !d) return [];
  const t = utc(y, m, d), md = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const hol = [];
  for (const h of HOLIDAY_DAYS) for (const yy of [y, y - 1]) {   // y-1: a holiday that runs over New Year (Hanukkah, Kwanzaa)
    const st = startOf(h.w, yy);
    if (st != null && t - st >= 0 && t - st < h.s * DAY) { hol.push(h); break; }
  }
  return [...hol, ...(NATIONAL_BY_DAY.get(md) || []), ...(FOOD_BY_DAY.get(md) || [])];
}

// How well a recipe suits a special day: dish words in the title count more than in the ingredients; a country's own dish counts for its national day.
function score(day, r) {
  const title = String(r.title || ''), keys = (r.key || []).join(' ');
  if (day.no && day.no.test(`${title} ${keys}`)) return { s: 0, t: false };
  let s = 0, t = false;
  for (const { re, w } of day.terms) { if (re.test(title)) { s += w + 1; t = true; } else if (re.test(keys)) s += w - 1; }   // a dish named for it beats one that merely has it in the pot
  if (day.c.length && day.c.includes(r.country)) { s += 1; if (!day.terms.length) t = true; }
  return { s, t };
}
const SWEET = /\b(?:cake|pie|cookie|pudding|brownie|chocolate|sundae|ice cream|candy|fudge|tart|parfait|cobbler|dough?nut|cupcake|custard|mousse|pastry|bun|waffle|pancake|crepe|torte|truffle|toffee|caramel|marshmallow|macaroon|meringue|cream puff|shortbread|gingerbread|strudel|popover|donut)s?\b/i;

// The dishes for today's special days, as one list that cycles through the days in turn (one dish for each day, then the next
// dish for each day…) so a day with three special days walks through all three. Dishes you can make now (ok) rank higher.
export function holidayPicks(recipes, days, ok = () => false, per = 8) {
  const lists = [];
  for (const day of days) {
    const sc = [];
    for (const r of recipes) { const x = score(day, r); if (x.s > 0) sc.push([x.s + (ok(r) ? 2 : 0), r, x.t]); }
    if (sc.some((x) => x[2])) sc.splice(0, sc.length, ...sc.filter((x) => x[2]));   // some dishes are named for this day: only those
    if (sc.length) lists.push(sc.sort((a, b) => b[0] - a[0] || String(a[1].id).localeCompare(String(b[1].id))).slice(0, per).map(([, r]) => ({ r, day })));
  }
  // a sweet day (cake, pie, cookie, sundae…) with no dish named for it still gets desserts
  if (!lists.length) {
    const day = days.find((d) => d.kind === 'food' && d.terms.length && SWEET.test(d.name));
    if (day) {
      const sw = recipes.filter((r) => fitsMeal(r, 'dessert')).map((r) => [ok(r) ? 1 : 0, r]).sort((a, b) => b[0] - a[0] || String(a[1].id).localeCompare(String(b[1].id)));
      if (sw.length) lists.push(sw.slice(0, per).map(([, r]) => ({ r, day })));
    }
  }
  const out = [], seen = new Set();
  for (let i = 0; lists.some((l) => l[i]); i++) for (const l of lists) { const x = l[i]; if (x && !seen.has(x.r.id)) { seen.add(x.r.id); out.push(x); } }
  return out;
}

export const FOOD_DAY_COUNT = [...FOOD_BY_DAY.values()].reduce((n, l) => n + l.length, 0);
