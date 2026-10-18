// What a pantry item looks like on the shelf: the package it comes in and the colour of what's inside.
// Read from the item's name (first match wins, so the specific words come before the general ones),
// then from its aisle. The level (Full / Good / Low / Out) sets how much is left inside.
//
// shape: squeeze, bottle, jar, carton, can, tub, bag, box, shaker, eggs, loaf, tray, produce, wedge, stick
// fill: what's inside. cap: lid / cap / label colour. pieces (produce only): colour of each piece.

const P = (re, shape, fill, cap, extra) => ({ re: new RegExp(`\\b(${re})`, 'i'), shape, fill, cap, ...extra });

export const PACKAGES = [
  // squeeze bottles
  P('ketchup|catsup', 'squeeze', '#D3242B', '#F3F0EA'),
  P('mayo|mayonnaise|aioli', 'squeeze', '#F3ECD6', '#2F6FD6'),
  P('mustard', 'squeeze', '#F2C200', '#E8463C'),
  P('ranch|caesar', 'squeeze', '#EFEBDF', '#3B8C3A'),
  P('bbq|barbecue', 'squeeze', '#6B2C17', '#2B2523'),
  P('sriracha', 'squeeze', '#DF3B1C', '#3FA34D'),
  P('honey', 'squeeze', '#EAA21E', '#F4D35E'),
  P('chocolate syrup|caramel', 'squeeze', '#4B2715', '#F3F0EA'),
  P('relish', 'squeeze', '#5E9B2F', '#F3F0EA'),
  P('dressing|vinaigrette', 'bottle', '#E7B44C', '#3B8C3A'),
  // bottles
  P('olive oil', 'bottle', '#B7B232', '#2E6B2E'),
  P('sesame oil', 'bottle', '#B5651D', '#C0392B'),
  P('oil', 'bottle', '#EDCB4C', '#F2B705'),
  P('balsamic', 'bottle', '#3B1D18', '#C9A227'),
  P('vinegar', 'bottle', '#F0E6C8', '#C0392B'),
  P('soy|tamari', 'bottle', '#2E160C', '#D93A2B'),
  P('fish sauce|worcestershire', 'bottle', '#7A3E12', '#F2B705'),
  P('hot sauce|tabasco|cholula|valentina', 'bottle', '#C8261D', '#F3F0EA'),
  P('maple|syrup|molasses', 'bottle', '#A4561A', '#F3F0EA'),
  P('vanilla', 'bottle', '#4A2614', '#F3F0EA'),
  P('teriyaki|hoisin|oyster sauce', 'bottle', '#3E1F12', '#C0392B'),
  P('wine', 'bottle', '#7B1E3A', '#2B2523'),
  P('juice', 'carton', '#FFA22B', '#3FA34D'),
  // jars
  P('peanut butter|almond butter|nut butter', 'jar', '#B8773A', '#D3242B'),
  P('nutella|chocolate spread', 'jar', '#4A2716', '#F3F0EA'),
  P('jam|jelly|preserve|marmalade', 'jar', '#A41E3A', '#F3F0EA'),
  P('salsa', 'jar', '#C8402A', '#2B2523'),
  P('pickle|gherkin', 'jar', '#8DA03A', '#3B8C3A'),
  P('olive', 'jar', '#556B2F', '#2B2523'),
  P('pesto', 'jar', '#5C8B30', '#F3F0EA'),
  P('marinara|pasta sauce|tomato sauce|passata', 'jar', '#C42F1E', '#F2B705'),
  P('curry paste|gochujang|harissa|miso', 'jar', '#B8331E', '#2B2523'),
  P('tahini', 'jar', '#D8BC8C', '#2B2523'),
  P('sauerkraut|kimchi', 'jar', '#D9C86A', '#D3242B'),
  P('salt', 'shaker', '#FFFFFF', '#2F6FD6'),
  P('^pepper(corns?)?$|black pepper|white pepper', 'shaker', '#6A625D', '#2B2523'),
  P('cinnamon|nutmeg|clove|allspice', 'shaker', '#8B4A22', '#D3242B'),
  P('paprika|chili powder|chilli powder|cayenne|chili flake|chilli flake|red pepper flake', 'shaker', '#C0392B', '#2B2523'),
  P('turmeric|curry powder', 'shaker', '#E5A50A', '#2B2523'),
  P('garlic powder|onion powder|ginger powder', 'shaker', '#E9DDB9', '#2B2523'),
  P('oregano|thyme|basil leaves|dried basil|rosemary|parsley flakes|italian seasoning|herbs de|bay lea', 'shaker', '#6F8B3A', '#2B2523'),
  P('cumin|coriander seed|seasoning|spice|everything bagel|old bay|adobo|sazon|garam masala', 'shaker', '#B07A3A', '#2B2523'),
  // cartons
  P('coconut milk|coconut cream', 'can', '#F7F4EA', '#3FA34D'),
  P('almond milk|oat milk|soy milk|coconut milk beverage', 'carton', '#EFE4D0', '#8D6E63'),
  P('buttermilk', 'carton', '#FBF8EE', '#2F6FD6'),
  P('half and half|heavy cream|whipping cream|^cream$|creamer', 'carton', '#FFF6E0', '#F2B705'),
  P('milk', 'carton', '#FFFFFF', '#2F6FD6'),
  P('broth|stock|bouillon', 'carton', '#D9A55A', '#C0392B'),
  P('eggs?\\b(?! ?noodle)', 'eggs', '#F6EBD9', '#C9B08A'),
  // cans
  P('tomato paste|crushed tomato|diced tomato|canned tomato|tinned tomato|whole tomatoes', 'can', '#C9301F', '#3FA34D'),
  P('black beans', 'can', '#4A3540', '#2B2523'),
  P('kidney beans|baked beans|pinto|refried', 'can', '#8A3B2A', '#C0392B'),
  P('chickpea|garbanzo|cannellini|white beans|beans', 'can', '#D8B984', '#F2B705'),
  P('tuna|sardine|anchov|spam', 'can', '#D9B7A0', '#2F6FD6'),
  P('soup|chili con', 'can', '#E07B39', '#C0392B'),
  P('corn\\b', 'can', '#F2C94C', '#3FA34D'),
  P('canned|tinned|can of|tin of', 'can', '#B9A27A', '#9E9E9E'),
  // tubs
  P('ice cream|gelato|sorbet', 'tub', '#F7C9D4', '#7B4A2E'),
  P('sour cream|creme fraiche|crème fraîche', 'tub', '#F8F6EE', '#3FA34D'),
  P('cream cheese', 'tub', '#FAF6EC', '#2F6FD6'),
  P('cottage cheese|ricotta', 'tub', '#FBF8F1', '#3FA34D'),
  P('yog(h)?urt|kefir|skyr', 'tub', '#FBFBFB', '#9C6ADE'),
  P('hummus|guacamole|dip', 'tub', '#D7B98A', '#3FA34D'),
  P('ghee|lard|shortening|crisco', 'tub', '#F4D774', '#F2B705'),
  P('butter\\b', 'stick', '#F8DA7A', '#F3F0EA'),
  // cheese
  P('cheese|cheddar|parmesan|mozzarella|gouda|brie|halloumi|paneer|feta|swiss|provolone|monterey|pecorino', 'wedge', '#F6C94C', '#E8A317'),
  // bags
  P('flour|cornmeal|masa|semolina', 'bag', '#F5F1E8', '#C0392B'),
  P('brown sugar', 'bag', '#B9773F', '#C0392B'),
  P('powdered sugar|icing sugar|confectioner', 'bag', '#FFFFFF', '#E91E63'),
  P('sugar', 'bag', '#FFFFFF', '#2F6FD6'),
  P('rice', 'bag', '#F5F3EC', '#D3242B'),
  P('oats|oatmeal|porridge|granola', 'bag', '#D8BE8E', '#3B8C3A'),
  P('quinoa|couscous|lentil|split pea|barley|grits|polenta', 'bag', '#D9B26B', '#3B8C3A'),
  P('chips|crisps|doritos|cheetos|pretzel|popcorn', 'bag', '#F2C14E', '#D3242B'),
  P('coffee', 'bag', '#4A2C1A', '#2B2523'),
  P('nuts|almonds|walnuts|pecans|cashews|peanuts|pistachio|raisins|dried fruit', 'bag', '#B8834A', '#3B8C3A'),
  P('frozen (peas|corn|veg|mixed|broccoli|spinach)|peas', 'bag', '#7CC24A', '#2F6FD6'),
  P('chocolate chip|marshmallow|candy', 'bag', '#5A321C', '#D3242B'),
  // boxes
  P('cereal|cheerios|corn flakes|frosted', 'box', '#E6A23C', '#D3242B'),
  P('spaghetti|pasta|penne|macaroni|fettuccine|linguine|lasagna|rigatoni|fusilli|orzo|noodle|ramen|udon', 'box', '#F2D27A', '#2F6FD6'),
  P('cracker|cookie|biscuit', 'box', '#D9A35A', '#D3242B'),
  P('cake mix|brownie mix|pancake mix|baking soda|baking powder|cornstarch|corn starch|gelatin|jell-o|tea', 'box', '#F3E3C3', '#E8463C'),
  P('cocoa', 'box', '#5A321C', '#C0392B'),
  P('yeast', 'box', '#E9D7A8', '#D3242B'),
  // bread
  P('bread|loaf|brioche|sourdough|baguette', 'loaf', '#E0A458', '#F6DDB0'),
  P('bagel|bun|roll|english muffin|tortilla|wrap|pita|naan|flatbread', 'loaf', '#D9A05B', '#F6DDB0'),
  // meat & fish
  P('bacon', 'tray', '#E07A6E', '#F6D2C8'),
  P('chicken|turkey|poultry|wings|drumstick|thigh', 'tray', '#F2C6A9', '#F8E3D3'),
  P('ground beef|mince|beef|steak|lamb|veal|venison|brisket|ribs', 'tray', '#B5302E', '#E0726C'),
  P('pork|ham|sausage|chorizo|hot dog|bratwurst|salami|pepperoni', 'tray', '#E59A8E', '#F6D2C8'),
  P('salmon|trout', 'tray', '#F08A5D', '#FBD3BE'),
  P('fish|cod|tilapia|haddock|halibut|catfish|bass', 'tray', '#F1E6DA', '#FFFFFF'),
  P('shrimp|prawn|crab|lobster|scallop|mussel|clam', 'tray', '#F49A7A', '#FFFFFF'),
  P('tofu|tempeh|seitan|paneer', 'tray', '#F3EBD8', '#FFFFFF'),
  // produce: the pieces themselves
  P('apple', 'produce', '#E23B33', '#5EA03A'),
  P('banana', 'produce', '#F5D33F', '#7A5A1E', { long: 1 }),
  P('lemon', 'produce', '#F7DC3A', '#5EA03A'),
  P('lime', 'produce', '#7CC243', '#4E8A2B'),
  P('orange|clementine|mandarin|tangerine', 'produce', '#F39221', '#5EA03A'),
  P('avocado', 'produce', '#4F7A28', '#3B5A1D'),
  P('tomato', 'produce', '#E5372B', '#4E8A2B'),
  P('onion|shallot', 'produce', '#B9768A', '#7E4B5A'),
  P('garlic', 'produce', '#F4EDE0', '#CDBFA6'),
  P('sweet potato|yam', 'produce', '#C2643A', '#8E4A2A', { long: 1 }),
  P('potato', 'produce', '#C79A5E', '#8E6A3A'),
  P('carrot', 'produce', '#F07F22', '#5EA03A', { long: 1 }),
  P('bell pepper|pepper|jalape(n|ñ)o|chil(l)?i', 'produce', '#E8463C', '#4E8A2B'),
  P('cucumber|zucchini|courgette', 'produce', '#4F8A2E', '#3B6A21', { long: 1 }),
  P('spinach|lettuce|kale|cabbage|arugula|rocket|greens|chard|herb|basil|cilantro|coriander|parsley|mint|dill|scallion|green onion|celery|broccoli', 'produce', '#5FA83A', '#3E7D24', { leaf: 1 }),
  P('mushroom', 'produce', '#C8B29A', '#8A715A'),
  P('berr(y|ies)|strawberr|raspberr|blueberr|grape|cherr', 'produce', '#C2185B', '#5EA03A', { small: 1 }),
  P('ginger', 'produce', '#D8B27A', '#A07F4E'),
  P('pineapple|mango|peach|pear|plum|kiwi|melon|watermelon', 'produce', '#F2B33D', '#5EA03A'),
];

// Aisle fallbacks when the name doesn't match anything above.
const BY_AISLE = {
  Proteins: { shape: 'tray', fill: '#D9746A', cap: '#F6D2C8' },
  Produce: { shape: 'produce', fill: '#7CC243', cap: '#4E8A2B' },
  'Dairy & Eggs': { shape: 'carton', fill: '#FFFFFF', cap: '#2F6FD6' },
  'Carbs & Grains': { shape: 'bag', fill: '#E6C27A', cap: '#C0392B' },
  'Canned & Jarred': { shape: 'can', fill: '#B9A27A', cap: '#9E9E9E' },
  'Sauces & Oils': { shape: 'bottle', fill: '#C8642A', cap: '#2B2523' },
  'Spices & Seasonings': { shape: 'shaker', fill: '#B07A3A', cap: '#2B2523' },
  Frozen: { shape: 'bag', fill: '#BFE3F5', cap: '#2F6FD6' },
  Baking: { shape: 'bag', fill: '#F5F1E8', cap: '#C0392B' },
  Other: { shape: 'box', fill: '#D9A35A', cap: '#8D6E63' },
};

export function packageFor(name, aisle) {
  const n = String(name || '').toLowerCase().trim();
  const hit = PACKAGES.find((p) => p.re.test(n));
  if (hit) return hit;
  return BY_AISLE[aisle] || BY_AISLE.Other;
}
