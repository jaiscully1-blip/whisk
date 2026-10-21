// Which aisle a pantry item goes in, from its name (and, for barcodes, the product's food-database tags).
// Plain ESM, no imports: used by the app, the receipt reader and the barcode route.
// The order of RULES matters: what an item IS (packed, used, or a fresh herb) wins over what it's made of,
// the way a person shelves it. "olive oil" → Sauces & Oils (not Produce), "garlic powder" → Spices,
// "fish sauce" → Sauces, "canned tuna" → Canned, "frozen peas" → Frozen, "peanut butter" → Canned & Jarred.
const w = (list) => new RegExp(`\\b(?:${list.join('|')})(?:e?s)?\\b`);

const F = 'Frozen', CJ = 'Canned & Jarred', S = 'Sauces & Oils', SP = 'Spices & Seasonings', B = 'Baking', D = 'Dairy & Eggs', P = 'Proteins', PR = 'Produce', C = 'Carbs & Grains', O = 'Other';

export const RULES = [
  [F, w(['frozen', 'ice cream', 'gelato', 'sorbet', 'popsicle', 'ice pop', 'freezer meal', 'eggo', 'hot pocket', 'totino', 'stouffer', 'gorton', 'alexia', 'ore.?ida', 'digiorno', 'red baron', 'tombstone', 'marie callender', 'lean cuisine', 'banquet', 'bagel bite', 'pizza roll', 'tater tot', 'hash brown', 'ben & jerry', 'haagen', 'breyers', 'talenti', 'klondike', 'fish stick', 'corn dog', 'pot pie', 'birds eye', 'steamfresh', 'tv dinner', 'freezer'])],
  // fresh things whose names look like spices or beans
  [PR, w(['(?:fresh|garden|live) (?:basil|thyme|rosemary|sage|dill|parsley|cilantro|mint|chives|oregano|tarragon|lavender|herb)', 'garlic clove', 'green bean', 'string bean', 'bean sprout', 'snap pea', 'sugar snap', 'snow pea', 'sweet corn', 'corn on the cob', 'fresh ginger', 'ginger root', 'fresh turmeric', 'butter lettuce', 'butterhead', 'spaghetti squash', 'swiss chard', 'spring mix', 'mixed greens', 'salad kit', 'salad blend', 'baby greens', 'sweet potato', 'corn husk'])],
  // plant milks and creamers are dairy-aisle drinks
  [D, w(['creamer', 'oat milk', 'almond milk', 'soy milk', 'soymilk', 'cashew milk', 'rice milk', 'plant milk', 'oatmilk', 'almondmilk', 'yog(?:h)?urt', 'chocolate milk', 'strawberry milk', 'milkshake'])],
  // canned fish and anything packed in a can or jar
  [CJ, w(['sardine', 'anchov(?:y|ie)', 'canned', 'tinned', 'tin of', 'can of', 'jarred', 'jar of', 'tuna in', 'salmon in', 'starkist', 'chicken of the sea', 'bumble bee', 'rotel', 'ro-tel', 'del monte', 'progresso', 'campbell', 'hormel chili', 'in adobo', 'chipotles? in', 'can', 'tin', 'pickled', 'san marzano', 'brined', 'in brine', 'in syrup', 'in water'])],
  // oils first, so "olive oil" is never mistaken for olives or produce
  [S, w(['oil', 'olive oil', 'evoo', 'vinegar', 'chil(?:l)?i crisp', 'cooking spray', 'nonstick spray', 'pan spray', 'lemon juice', 'lime juice'])],
  [CJ, w(['stock', 'broth', 'bouillon', 'passata', 'tomato paste', 'tomato puree', 'tomato sauce', 'crushed tomato', 'diced tomato', 'whole peeled tomato', 'stewed tomato', 'coconut milk', 'coconut cream', 'peanut butter', 'almond butter', 'cashew butter', 'sunflower butter', 'nut butter', 'jam', 'jelly', 'preserve', 'marmalade', 'pickle', 'olive', 'caper', 'sauerkraut', 'kimchi', 'evaporated milk', 'condensed milk', 'nutella', 'soup', 'chowder', 'artichoke heart', 'roasted red pepper', 'sun.?dried tomato', 'applesauce', 'refried bean', 'baked bean', 'pie filling', 'fruit cocktail', 'pasta sauce jar', 'spaghetti sauce jar', 'jar'])],
  // chocolate chips etc. before "chip" (snacks) below
  [B, w(['crisco', 'toll house', 'morsel', 'duncan hines', 'betty crocker', 'bob.?s red mill', 'king arthur', 'extract', 'chocolate chip', 'baking chocolate', 'semi.?sweet chocolate', 'dark chocolate chunk', 'cream of tartar', 'powdered milk', 'dry milk', 'powdered sugar', 'confectioners? sugar', 'coconut flake', 'shredded coconut', 'desiccated coconut', 'baking', 'corn syrup', 'golden syrup', 'tapioca', 'arrowroot', 'potato starch', 'starch'])],
  [C, w(['corn flake', 'cornflake', 'cheerio', 'froot loop', 'frosted flake', 'rice krispie', 'rice cripies', 'raisin bran', 'cap.?n crunch', 'lucky charm', 'special k', 'shredded wheat', 'wheaties', 'chex', 'cocoa puff', 'grape.?nuts', 'cereal'])],
  [O, w(['chip', 'crisp', 'candy', 'cookie', 'soda', 'snack', 'granola bar', 'protein bar', 'popcorn', 'pretzel', 'juice', 'coffee', 'tea', 'sparkling water', 'seltzer', 'beer', 'wine', 'hard cider', 'kombucha', 'energy drink', 'gum', 'trail mix', 'protein powder'])],
  [SP, new RegExp(`^pepper$|${w(['salt', 'sea salt', 'black pepper', 'white pepper', 'peppercorn', 'cumin', 'paprika', 'oregano', 'thyme', 'rosemary', 'sage', 'tarragon', 'marjoram', 'cinnamon', 'nutmeg', 'mace', 'clove', 'spice', 'seasoning', 'curry powder', 'turmeric', 'chil(?:l)?i powder', 'chil(?:l)?i flake', 'crushed red pepper', 'red pepper flake', 'pepper flake', 'lemon pepper', 'cayenne', 'chipotle powder', 'ancho', 'bay lea(?:f|ve)', 'garam masala', 'garlic powder', 'garlic salt', 'onion powder', 'onion salt', 'ginger powder', 'ground ginger', 'ground cumin', 'ground coriander', 'ground cinnamon', 'ground nutmeg', 'ground mustard', 'dry mustard', 'coriander seed', 'cumin seed', 'fennel seed', 'mustard seed', 'sesame seed', 'poppy seed', 'caraway', 'nigella', 'celery seed', 'celery salt', 'dill seed', 'dill weed', 'dried (?:basil|parsley|dill|herb|oregano|thyme|rosemary|sage|mint|chive|cilantro|tarragon|chil(?:l)?i|chil(?:l)?ies|pepper|onion|garlic|ginger|mustard|lavender|spice|marjoram|bay)', 'italian seasoning', 'allspice', 'cardamom', 'star anise', 'za.?atar', 'sumac', 'saffron', 'msg', 'bouquet garni', 'herbes de provence', 'five spice', 'old bay', 'adobo', 'sazon', 'tajin', 'berbere', 'ras el hanout', 'annatto', 'achiote', 'nutritional yeast', 'lawry', 'mccormick', 'mrs\\.? dash', 'badia', 'tony chachere', 'goya adobo', 'maldon', 'morton', 'masala', 'asafoetida', 'hing', 'rub', 'poultry seasoning', 'pumpkin pie spice', 'apple pie spice', 'everything bagel', 'seasoned salt', 'fajita', 'taco season'].map((x) => x)).source}`)],
  [S, w(['sauce', 'vinegar', 'ketchup', 'catsup', 'mayo', 'mayonnaise', 'mustard', 'honey', 'agave', 'syrup', 'sriracha', 'pesto', 'dressing', 'salsa', 'marinara', 'hoisin', 'gochujang', 'miso', 'tahini', 'soy sauce', 'teriyaki', 'bbq', 'barbecue', 'ranch', 'aioli', 'chutney', 'harissa', 'relish', 'glaze', 'marinade', 'tabasco', 'worcestershire', 'curry paste', 'chil(?:l)?i crisp', 'chil(?:l)?i paste', 'sambal', 'ponzu', 'mirin', 'redhot', 'red hot', 'buffalo', 'tartar', 'wasabi', 'horseradish', 'liquid smoke', 'fish sauce', 'oyster sauce', 'cooking wine', 'alfredo', 'sofrito', 'mole', 'chimichurri', 'enchilada', 'gravy', 'ragu', 'prego', 'rao.?s', 'classico', 'newman.?s own', 'kikkoman', 'cholula', 'sweet baby ray', 'a\\.1\\.', 'heinz', 'hellmann', 'kewpie', 'lee kum kee', 'bertolli', 'colavita', 'pompeian', 'wesson', 'tzatziki', 'hummus', 'guacamole', 'queso dip', 'dip', 'nuoc cham', 'tamari', 'liquid aminos', 'coconut aminos', 'adobo sauce', 'salsa verde', 'sweet and sour'])],
  // doughy things with milk, egg or flour in the name
  [C, w(['tortilla', 'noodle', 'ramen', 'udon', 'soba', 'vermicelli', 'hot dog bun', 'hamburger bun', 'sandwich bun', 'burger bun', 'bun', 'english muffin', 'sourdough', 'pasta', 'spaghetti', 'penne', 'macaroni', 'biscuit', 'crescent', 'dough', 'fettuccine', 'linguine', 'lasagna', 'rigatoni', 'fusilli', 'farfalle', 'ziti', 'orzo', 'gnocchi', 'tortellini', 'ravioli', 'rotini', 'cavatappi', 'bucatini', 'tagliatelle', 'pappardelle', 'capellini', 'angel hair', 'shells', 'manicotti', 'cannelloni', 'campanelle', 'conchiglie', 'paccheri', 'mafalde', 'tortelloni', 'elbow', 'rotelle', 'radiatore', 'spirelli'])],
  [B, w(['sugar', 'baking soda', 'baking powder', 'bicarbonate', 'yeast', 'vanilla', 'cocoa', 'cacao', 'cornstarch', 'corn starch', 'cornflour', 'sprinkle', 'cake mix', 'brownie mix', 'pancake mix', 'muffin mix', 'bread mix', 'icing', 'frosting', 'molasses', 'flour', 'gelatin', 'food coloring', 'marshmallow', 'chocolate', 'extract', 'almond flour', 'stevia', 'sweetener', 'pie crust', 'fondant', 'xanthan', 'shortening', 'lard'])],
  [D, w(['milk', 'buttermilk', 'cheese', 'cheddar', 'parmesan', 'parmigiano', 'mozzarella', 'yog(?:h)?urt', 'butter', 'egg', 'egg white', 'egg yolk', 'cream', 'whipped cream', 'whipping cream', 'creme fraiche', 'ricotta', 'sour cream', 'half and half', 'half & half', 'kefir', 'ghee', 'brie', 'camembert', 'gouda', 'halloumi', 'paneer', 'cottage cheese', 'feta', 'provolone', 'gruyere', 'havarti', 'manchego', 'mascarpone', 'queso', 'swiss', 'monterey jack', 'pepper jack', 'colby', 'asiago', 'romano', 'pecorino', 'gorgonzola', 'blue cheese', 'fontina', 'burrata', 'string cheese', 'margarine'])],
  [P, w(['chicken', 'beef', 'pork', 'steak', 'mince', 'turkey', 'lamb', 'veal', 'goat meat', 'bacon', 'sausage', 'ham', 'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'trout', 'catfish', 'snapper', 'sea bass', 'bass', 'swordfish', 'mahi.?mahi', 'haddock', 'sole', 'shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'mussel', 'clam', 'oyster', 'squid', 'calamari', 'octopus', 'tofu', 'tempeh', 'seitan', 'lentil', 'chickpea', 'garbanzo', 'bean', 'split pea', 'black.?eyed pea', 'pigeon pea', 'meatball', 'chorizo', 'pepperoni', 'salami', 'prosciutto', 'pancetta', 'hot dog', 'frankfurter', 'bratwurst', 'duck', 'venison', 'bison', 'brisket', 'ribs?', 'ribeye', 'sirloin', 'tenderloin', 'filet', 'fillet', 'chuck', 'roast', 'flank', 'skirt', 'porterhouse', 't-bone', 'loin', 'thigh', 'drumstick', 'wing', 'breast', 'edamame', 'hamburger patt(?:y|ie)', 'burger patt(?:y|ie)', 'patties', 'deli', 'lunch meat', 'cold cut', 'jerky', 'brats?', 'kielbasa', 'andouille', 'knockwurst', 'mortadella', 'bologna', 'liverwurst', 'foie gras', 'liver', 'oxtail', 'tripe', 'gizzard', 'rabbit', 'quail', 'goose', 'cornish hen', 'sashimi', 'eel', 'herring', 'mackerel', 'sardines?', 'anchovy', 'crawfish', 'crayfish', 'langoustine', 'shellfish', 'surimi', 'imitation crab', 'fish stick', 'veggie burger', 'plant.?based burger', 'beyond meat', 'impossible burger', 'meatless'])],
  [PR, w(['romaine', 'iceberg', 'butter lettuce', 'apple', 'banana', 'lemon', 'lime', 'orange', 'grapefruit', 'tangerine', 'clementine', 'mandarin', 'onion', 'shallot', 'garlic', 'tomato', 'potato', 'sweet potato', 'yam', 'carrot', 'bell pepper', 'sweet pepper', 'pepper', 'jalape(?:n|ñ)o', 'habanero', 'serrano', 'poblano', 'anaheim', 'chil(?:l)?i', 'spinach', 'lettuce', 'kale', 'chard', 'collard', 'cabbage', 'cucumber', 'avocado', 'herb', 'basil', 'cilantro', 'coriander', 'parsley', 'mint', 'dill', 'chive', 'ginger', 'mushroom', 'broccoli', 'broccolini', 'cauliflower', 'zucchini', 'courgette', 'eggplant', 'aubergine', 'berr(?:y|ie)', 'strawberr(?:y|ie)', 'blueberr(?:y|ie)', 'raspberr(?:y|ie)', 'blackberr(?:y|ie)', 'cranberr(?:y|ie)', 'grape', 'melon', 'watermelon', 'cantaloupe', 'honeydew', 'pineapple', 'mango', 'papaya', 'peach', 'nectarine', 'apricot', 'pear', 'plum', 'cherr(?:y|ie)', 'kiwi', 'lychee', 'guava', 'starfruit', 'star fruit', 'dragon fruit', 'passion fruit', 'persimmon', 'quince', 'jackfruit', 'durian', 'rambutan', 'longan', 'tamarind', 'pomelo', 'kumquat', 'boysenberr(?:y|ie)', 'gooseberr(?:y|ie)', 'currant', 'pomegranate', 'fig', 'date', 'coconut', 'celery', 'scallion', 'green onion', 'spring onion', 'leek', 'fennel', 'corn', 'pea', 'asparagus', 'beet', 'radish', 'turnip', 'parsnip', 'rutabaga', 'jicama', 'squash', 'pumpkin', 'arugula', 'bok choy', 'napa', 'sprout', 'brussels', 'artichoke', 'okra', 'plantain', 'cassava', 'yuca', 'taro', 'salad', 'fruit', 'vegetable', 'veggie', 'greens', 'microgreens', 'endive', 'radicchio', 'watercress', 'tomatillo', 'lemongrass', 'galangal', 'horseradish root'])],
  [C, w(['bread', 'rice', 'oat', 'oatmeal', 'quinoa', 'couscous', 'bagel', 'wrap', 'cereal', 'granola', 'muesli', 'cracker', 'pita', 'naan', 'barley', 'bulgur', 'farro', 'millet', 'grits', 'polenta', 'cornmeal', 'breadcrumb', 'panko', 'roll', 'baguette', 'croissant', 'ciabatta', 'focaccia', 'brioche', 'flatbread', 'lavash', 'rye', 'pumpernickel', 'muffin', 'waffle', 'pancake', 'crouton', 'stuffing', 'rice cake', 'dumpling wrapper', 'wonton wrapper', 'pastry'])]
];

// Things that are not food at all: they stay in 'Other' and a receipt line for one is left unticked.
const NONFOOD = w(['paper towel', 'toilet paper', 'tissue', 'dog food', 'cat food', 'pet food', 'napkin', 'detergent', 'dish soap', 'hand soap', 'soap', 'foil', 'ziploc', 'zip.?lock', 'trash bag', 'garbage bag', 'sponge', 'bleach', 'shampoo', 'toothpaste', 'deodorant', 'battery', 'batteries', 'light bulb', 'plastic wrap', 'parchment', 'wax paper', 'sandwich bag', 'cleaner']);
const clean = (name) => String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
/** 'Spices & Seasonings', 'Produce'… or 'Other' when nothing recognises the name. */
// "Soy Sauce All Purpose Seasoning" is a sauce: when the name has a liquid sauce word and the only thing pointing at spices is a
// loose word like "seasoning", the sauce wins. A dry form ("seasoning mix", "sauce packet", "garlic powder") stays in spices.
const SAUCY = w(['sauce', 'soy sauce', 'ketchup', 'catsup', 'dressing', 'marinade', 'vinegar', 'salsa', 'glaze', 'tamari', 'liquid aminos', 'worcestershire', 'sriracha', 'teriyaki', 'hoisin']);
const DRY = w(['mix', 'packet', 'envelope', 'powder', 'dry', 'blend', 'granule', 'flake', 'rub', 'ground', 'seed', 'dried', 'shaker', 'grinder', 'salt']);
export const sauceNotSpice = (n) => SAUCY.test(n) && !DRY.test(n);
export function guessCategory(name) {
  const n = clean(name); if (NONFOOD.test(n)) return 'Other';
  const c = RULES.find(([, re]) => re.test(n))?.[0] || 'Other';
  return c === SP && sauceNotSpice(n) ? S : c;
}
/** Does this name look like food or a cooking ingredient (anything we know which aisle it's from)? */
export function isGrocery(name) { const n = clean(name); if (NONFOOD.test(n)) return false; return RULES.some(([, re]) => re.test(n)); }

// ---- barcodes: the product's food-database (Open Food Facts) category tags ----
// Matched on whole tags, never on pieces of words: "vegetable-oils" is an oil, not a vegetable.
const slug = (t) => String(t || '').toLowerCase().replace(/^[a-z]{2}:/, '');
const has = (tags, re) => tags.some((t) => re.test(t));
const TAG_RULES = [
  [F, /^frozen(-|$)|-frozen$|^ice-creams?$|^sorbets?$/],
  [SP, /^(spices?|seasonings?|salts?|table-salts?|sea-salts?|spice-blends?|seasoning-mixes|ground-spices|dried-herbs|dried-aromatic-herbs|herbs-and-spices|black-peppers?|peppercorns?|curry-powders?|mixed-spices)$/],
  [S, /(^|-)oils?$|^(fats|vegetable-fats|cooking-sprays?|vegetable-fats-and-oils|fats-and-oils)$/],
  [S, /(^|-)(sauces?|dressings?|vinegars?|ketchups?|mustards?|mayonnaises?|syrups?|honeys?|pestos?|salsas?|condiments)$|^(condiments|sauces|dressings|vinegars|salad-dressings|honeys|syrups)$/],
  [CJ, /^(canned|tinned|preserved|jarred|pickles|pickled|jams|fruit-jams|marmalades|soups|broths|stocks|bouillons|canned-)/],
  [D, /^(dairies|dairy|milks|cheeses|yogurts?|butters|eggs|creams|fermented-milk-products|dairy-substitutes|plant-based-milks)$/],
  [P, /^(meats|meat|poultries|poultry|fishes|fish|seafood|seafoods|sausages|hams|charcuterie|tofu|legumes|pulses|dried-legumes|meat-based-products|fresh-meats)$/],
  [PR, /^(fresh-vegetables|fresh-fruits|fresh-plant-based-foods|fruits|vegetables|fresh-herbs|salads)$/],
  [C, /^(breads?|pastas?|rices?|cereals?|grains|noodles|tortillas|breakfast-cereals|cereals-and-their-products|oat-flakes|oats)$/],
  [B, /^(flours?|sugars?|baking-.*|chocolates?|cocoa.*|yeasts?|sweeteners|sweetening-agents)$/],
  [O, /^(snacks?|salty-snacks|sweet-snacks|biscuits|cookies|candies|confectioneries|beverages|sodas|juices|waters|coffees|teas|alcoholic-beverages|beers|wines|chips-and-fries|crisps)$/]
];
/** The aisle for a scanned product: its name first (it knows "olive oil"), the food-database tags when the name is no help. */
export function categorizeProduct(name, tags = []) {
  const t = (tags || []).map(slug);
  const byName = guessCategory(name);
  if (has(t, /^(frozen-foods|frozen-.*)$/) && (byName === 'Other' || byName === PR || byName === P)) return F;
  // the database's own tags settle a name that could be either (a sauce called a seasoning)
  if (byName === SP && has(t, /(^|-)(sauces?|condiments|dressings?|soy-sauces?|seasoning-sauces?)$/) && !has(t, /^(spices?|salts?|spice-blends?|seasoning-mixes|ground-spices|dried-herbs|herbs-and-spices)$/)) return S;
  if (byName !== 'Other') return byName;
  for (const [cat, re] of TAG_RULES) if (has(t, re)) return cat;
  return 'Other';
}

// ---- the player's own choices win: moving an item to another aisle is remembered by name ----
export const catKey = (name) => String(name || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 60);
/** Aisle for a name: what this player chose before, else the rules. */
export function shelve(name, learned) { const c = learned && learned[catKey(name)]; return c || guessCategory(name); }
/** The learned map after the player moves `name` to `category` (keeps the newest 300). */
export function learn(learned, name, category) {
  const next = { ...(learned || {}) }; const k = catKey(name); delete next[k]; next[k] = category;
  const keys = Object.keys(next); if (keys.length > 300) for (const old of keys.slice(0, keys.length - 300)) delete next[old];
  return next;
}
