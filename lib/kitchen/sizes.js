// About how tall the real thing is, in inches, so food stands on a shelf at its true size next to the cabinet:
// a gallon of milk is taller than a can of beans, an egg carton is low and a cereal box is tall.
// The 3D kitchen draws 1 ft as 24 px of height, so 1 inch is 2 px before zoom.
const BY_NAME = [
  [/gallon|milk|juice|orange juice|lemonade|soda|seltzer|kombucha/, 10],
  [/wine|vodka|rum|whiskey|tequila|beer/, 11],
  [/oil|vinegar|soy sauce|fish sauce|hot sauce|sriracha|ketchup|mustard|syrup|dressing|bbq|worcestershire/, 8],
  [/cereal|oats|oatmeal|cracker|granola|pasta|spaghetti|macaroni|noodle|lasagna/, 9],
  [/flour|sugar|rice|cornmeal|grits|masa/, 8],
  [/bread|loaf|bun|bagel|tortilla|pita|naan/, 5],
  [/egg/, 3],
  [/butter|ghee/, 2.5],
  [/yogurt|sour cream|cottage|cream cheese|hummus|salsa|dip/, 3.5],
  [/cheese|parmesan|cheddar|mozzarella/, 3],
  [/can\b|canned|beans|soup|broth|stock|tomato paste|tomato sauce|coconut milk|tuna|sardine|corn\b|peas\b/, 4.5],
  [/jar|jam|jelly|peanut butter|honey|pickle|olive|mayo|pesto/, 5],
  [/salt|pepper|cumin|paprika|oregano|basil|thyme|cinnamon|turmeric|chili powder|garlic powder|onion powder|spice|seasoning|bouillon|baking soda|baking powder|yeast|vanilla/, 4],
  [/chicken|beef|pork|steak|lamb|turkey|bacon|sausage|ham|fish|salmon|shrimp|tofu|ground/, 3],
  [/lettuce|cabbage|kale|collard|spinach|broccoli|cauliflower|celery|leek/, 6],
  [/carrot|banana|cucumber|zucchini|eggplant|plantain|corn on/, 5],
  [/watermelon|pineapple|melon/, 8],
  [/apple|orange|lemon|lime|onion|potato|tomato|pepper|avocado|peach|pear|mango|garlic|ginger|shallot|beet|yam/, 3],
  [/berr|grape|cherr|herb|cilantro|parsley|mint|scallion/, 3],
  [/ice cream|frozen|pizza|waffle|nugget/, 6]
];
const BY_CAT = { Proteins: 3, Produce: 4, 'Dairy & Eggs': 5, 'Carbs & Grains': 7, 'Canned & Jarred': 4.5, 'Sauces & Oils': 7, 'Spices & Seasonings': 4, Frozen: 6, Baking: 7, Other: 5 };

export function inches(name = '', category = '') {
  const n = String(name).toLowerCase();
  for (const [re, v] of BY_NAME) if (re.test(n)) return v;
  return BY_CAT[category] || 5;
}
// px tall in the 3D kitchen (before zoom), never taller than the shelf it's on
export const PX_PER_INCH = 2;
export function itemPx(item, room) { return Math.max(6, Math.min(room, inches(item.name, item.category) * PX_PER_INCH)); }
