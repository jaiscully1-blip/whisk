// [name, expected aisle]. What a shopper would say / what receipts and barcodes print. Used by categorize.test.mjs to measure the classifier.
const P = 'Proteins', PR = 'Produce', D = 'Dairy & Eggs', C = 'Carbs & Grains', CJ = 'Canned & Jarred', S = 'Sauces & Oils', SP = 'Spices & Seasonings', F = 'Frozen', B = 'Baking', O = 'Other';
export const CORPUS = [
  // spices and seasonings (the bug: these went to Sauces)
  ['Salt', SP], ['Sea salt', SP], ['Kosher salt', SP], ['Black pepper', SP], ['Pepper', SP], ['Ground black pepper', SP], ['Cumin', SP], ['Ground cumin', SP], ['Paprika', SP], ['Smoked paprika', SP],
  ['Oregano', SP], ['Dried oregano', SP], ['Thyme', SP], ['Dried thyme', SP], ['Rosemary', SP], ['Cinnamon', SP], ['Ground cinnamon', SP], ['Nutmeg', SP], ['Cloves', SP], ['Turmeric', SP],
  ['Curry powder', SP], ['Chili powder', SP], ['Garlic powder', SP], ['Onion powder', SP], ['Cayenne pepper', SP], ['Red pepper flakes', SP], ['Crushed red pepper', SP], ['Italian seasoning', SP], ['Taco seasoning', SP], ['Old Bay seasoning', SP],
  ['Garam masala', SP], ['Cardamom', SP], ['Allspice', SP], ['Bay leaves', SP], ['Coriander seed', SP], ['Fennel seed', SP], ['Mustard seed', SP], ['Za\'atar', SP], ['Sumac', SP], ['Saffron', SP],
  ['Everything bagel seasoning', SP], ['Lemon pepper', SP], ['Adobo seasoning', SP], ['Cajun seasoning', SP], ['Chinese five spice', SP], ['Ground ginger', SP], ['Ground coriander', SP], ['Dill weed', SP], ['Dried basil', SP], ['Dried parsley', SP],
  ['McCormick Garlic Salt', SP], ['Lawry\'s Seasoned Salt', SP], ['Tajin', SP], ['Berbere', SP], ['Ras el hanout', SP], ['Herbes de Provence', SP], ['Poultry seasoning', SP], ['Pumpkin pie spice', SP], ['Chipotle powder', SP], ['Ancho chili powder', SP],
  ['Whole peppercorns', SP], ['Celery salt', SP], ['Seasoning salt', SP], ['Fajita seasoning', SP], ['Ranch seasoning mix', SP], ['Cumin seeds', SP], ['Sesame seeds', SP], ['Poppy seeds', SP], ['Nutritional yeast', SP], ['MSG', SP],
  // oils and sauces
  ['Olive oil', S], ['Extra virgin olive oil', S], ['Extra-Virgin Olive Oil', S], ['Olive Oil Extra Virgin', S], ['Vegetable oil', S], ['Canola oil', S], ['Avocado oil', S], ['Coconut oil', S], ['Sesame oil', S], ['Sunflower oil', S],
  ['Peanut oil', S], ['Cooking spray', S], ['Soy sauce', S], ['Fish sauce', S], ['Hot sauce', S], ['Sriracha', S], ['Ketchup', S], ['Mayonnaise', S], ['Yellow mustard', S], ['Dijon mustard', S],
  ['Balsamic vinegar', S], ['Apple cider vinegar', S], ['Rice vinegar', S], ['White vinegar', S], ['BBQ sauce', S], ['Teriyaki sauce', S], ['Worcestershire sauce', S], ['Ranch dressing', S], ['Italian dressing', S], ['Caesar dressing', S],
  ['Honey', S], ['Maple syrup', S], ['Pesto', S], ['Salsa', S], ['Marinara sauce', S], ['Pasta sauce', S], ['Alfredo sauce', S], ['Hoisin sauce', S], ['Oyster sauce', S], ['Gochujang', S],
  ['Miso paste', S], ['Tahini', S], ['Harissa', S], ['Chili crisp', S], ['Sweet chili sauce', S], ['Tartar sauce', S], ['Buffalo sauce', S], ['Enchilada sauce', S], ['Curry paste', S], ['Red curry paste', S],
  ['Tabasco', S], ['Frank\'s RedHot', S], ['Heinz Ketchup', S], ['Hellmann\'s Mayonnaise', S], ['Kikkoman Soy Sauce', S], ['Bertolli Olive Oil', S], ['Pompeian Extra Virgin Olive Oil', S], ['Spray olive oil', S], ['Chili oil', S], ['Ponzu', S],
  // produce
  ['Apples', PR], ['Bananas', PR], ['Lemons', PR], ['Limes', PR], ['Oranges', PR], ['Yellow onion', PR], ['Red onion', PR], ['Garlic', PR], ['Garlic cloves', PR], ['Tomatoes', PR],
  ['Roma tomatoes', PR], ['Cherry tomatoes', PR], ['Potatoes', PR], ['Russet potatoes', PR], ['Sweet potatoes', PR], ['Carrots', PR], ['Baby carrots', PR], ['Bell pepper', PR], ['Red bell pepper', PR], ['Jalapeno', PR],
  ['Jalapeño peppers', PR], ['Spinach', PR], ['Baby spinach', PR], ['Romaine lettuce', PR], ['Kale', PR], ['Cabbage', PR], ['Cucumber', PR], ['Avocado', PR], ['Avocados', PR], ['Fresh basil', PR],
  ['Cilantro', PR], ['Fresh parsley', PR], ['Mint', PR], ['Fresh ginger', PR], ['Ginger', PR], ['Mushrooms', PR], ['Broccoli', PR], ['Cauliflower', PR], ['Zucchini', PR], ['Eggplant', PR],
  ['Strawberries', PR], ['Blueberries', PR], ['Grapes', PR], ['Watermelon', PR], ['Pineapple', PR], ['Mango', PR], ['Peaches', PR], ['Pears', PR], ['Celery', PR], ['Green onions', PR],
  ['Scallions', PR], ['Corn on the cob', PR], ['Asparagus', PR], ['Beets', PR], ['Radishes', PR], ['Butternut squash', PR], ['Arugula', PR], ['Bok choy', PR], ['Salad mix', PR], ['Bean sprouts', PR],
  ['Lemon', PR], ['Lime', PR], ['Shallots', PR], ['Leeks', PR], ['Green beans', PR], ['Snap peas', PR], ['Fresh thyme', PR], ['Fresh rosemary', PR], ['Fresh dill', PR], ['Chives', PR],
  ['Habanero', PR], ['Serrano pepper', PR], ['Poblano', PR], ['Kiwi', PR], ['Plums', PR], ['Cantaloupe', PR], ['Pomegranate', PR], ['Fennel', PR], ['Turnips', PR], ['Brussels sprouts', PR],
  // proteins
  ['Chicken breast', P], ['Chicken thighs', P], ['Boneless skinless chicken breast', P], ['Whole chicken', P], ['Ground beef', P], ['Ground turkey', P], ['Beef steak', P], ['Ribeye', P], ['Pork chops', P], ['Pork shoulder', P],
  ['Bacon', P], ['Sausage', P], ['Italian sausage', P], ['Hot dogs', P], ['Ham', P], ['Salmon', P], ['Salmon fillet', P], ['Shrimp', P], ['Cod', P], ['Tilapia', P],
  ['Tofu', P], ['Firm tofu', P], ['Tempeh', P], ['Lamb chops', P], ['Ground lamb', P], ['Turkey breast', P], ['Pepperoni', P], ['Deli turkey', P], ['Chorizo', P], ['Meatballs', P],
  ['Crab meat', P], ['Scallops', P], ['Mahi mahi', P], ['Flank steak', P], ['Brisket', P], ['Ribs', P], ['Chicken wings', P], ['Drumsticks', P], ['Edamame', P], ['Seitan', P],
  ['Lentils', P], ['Dry lentils', P], ['Chickpeas', P], ['Black beans', P], ['Kidney beans', P], ['Pinto beans', P], ['Dried beans', P], ['Split peas', P], ['Roast beef', P], ['Salami', P],
  // dairy & eggs
  ['Milk', D], ['Whole milk', D], ['2% milk', D], ['Oat milk', D], ['Almond milk', D], ['Eggs', D], ['Large eggs', D], ['Dozen eggs', D], ['Butter', D], ['Unsalted butter', D],
  ['Cheddar cheese', D], ['Shredded cheese', D], ['Mozzarella', D], ['Parmesan', D], ['Parmesan cheese', D], ['Cream cheese', D], ['Sour cream', D], ['Greek yogurt', D], ['Yogurt', D], ['Heavy cream', D],
  ['Half and half', D], ['Cottage cheese', D], ['Ricotta', D], ['Feta', D], ['Feta cheese', D], ['Swiss cheese', D], ['Provolone', D], ['Gouda', D], ['Brie', D], ['Whipped cream', D],
  ['Buttermilk', D], ['Kefir', D], ['Ghee', D], ['Goat cheese', D], ['Halloumi', D], ['Paneer', D], ['American cheese slices', D], ['Pepper jack cheese', D], ['Egg whites', D], ['Coffee creamer', D],
  // carbs & grains
  ['Bread', C], ['Whole wheat bread', C], ['Sourdough', C], ['Bagels', C], ['Tortillas', C], ['Flour tortillas', C], ['Pasta', C], ['Spaghetti', C], ['Penne', C], ['Macaroni', C],
  ['Rice', C], ['White rice', C], ['Jasmine rice', C], ['Basmati rice', C], ['Brown rice', C], ['Quinoa', C], ['Couscous', C], ['Oats', C], ['Rolled oats', C], ['Oatmeal', C],
  ['Cereal', C], ['Ramen noodles', C], ['Egg noodles', C], ['Rice noodles', C], ['Udon', C], ['Pita bread', C], ['Naan', C], ['Hamburger buns', C], ['Hot dog buns', C], ['Breadcrumbs', C],
  ['Panko', C], ['Crackers', C], ['Cornmeal', C], ['Grits', C], ['Polenta', C], ['Lasagna noodles', C], ['Barley', C], ['Granola', C], ['English muffins', C], ['Croissants', C],
  // canned & jarred
  ['Canned tomatoes', CJ], ['Diced tomatoes', CJ], ['Crushed tomatoes', CJ], ['Tomato paste', CJ], ['Tomato sauce', CJ], ['Chicken broth', CJ], ['Beef stock', CJ], ['Vegetable broth', CJ], ['Coconut milk', CJ], ['Canned tuna', CJ],
  ['Canned chickpeas', CJ], ['Canned black beans', CJ], ['Canned corn', CJ], ['Peanut butter', CJ], ['Almond butter', CJ], ['Jam', CJ], ['Strawberry jam', CJ], ['Jelly', CJ], ['Pickles', CJ], ['Olives', CJ],
  ['Green olives', CJ], ['Capers', CJ], ['Sauerkraut', CJ], ['Kimchi', CJ], ['Sardines', CJ], ['Condensed milk', CJ], ['Evaporated milk', CJ], ['Canned soup', CJ], ['Chicken noodle soup', CJ], ['Artichoke hearts', CJ],
  ['Roasted red peppers', CJ], ['Sun-dried tomatoes', CJ], ['Applesauce', CJ], ['Canned pumpkin', CJ], ['Nutella', CJ], ['Pasta sauce jar', CJ], ['Bouillon cubes', CJ], ['Canned salmon', CJ], ['Refried beans', CJ], ['Canned peaches', CJ],
  // frozen
  ['Frozen peas', F], ['Frozen corn', F], ['Frozen broccoli', F], ['Frozen berries', F], ['Frozen pizza', F], ['Ice cream', F], ['Frozen shrimp', F], ['Frozen chicken nuggets', F], ['Frozen waffles', F], ['Frozen spinach', F],
  ['Frozen fries', F], ['Frozen dumplings', F], ['Frozen mixed vegetables', F], ['Popsicles', F], ['Frozen meals', F], ['Frozen fish fillets', F], ['Frozen hash browns', F], ['Frozen mango', F], ['Frozen edamame', F], ['Frozen pie crust', F],
  // baking
  ['Sugar', B], ['Brown sugar', B], ['Powdered sugar', B], ['All-purpose flour', B], ['Flour', B], ['Bread flour', B], ['Baking soda', B], ['Baking powder', B], ['Yeast', B], ['Active dry yeast', B],
  ['Vanilla extract', B], ['Cocoa powder', B], ['Chocolate chips', B], ['Cornstarch', B], ['Cake mix', B], ['Brownie mix', B], ['Sprinkles', B], ['Frosting', B], ['Molasses', B], ['Gelatin', B],
  ['Whole wheat flour', B], ['Almond flour', B], ['Pancake mix', B], ['Marshmallows', B], ['Food coloring', B], ['Shortening', B], ['Powdered milk', B], ['Cream of tartar', B], ['Coconut flakes', B], ['Semi-sweet chocolate', B],
  // other
  ['Potato chips', O], ['Tortilla chips', O], ['Cookies', O], ['Candy', O], ['Popcorn', O], ['Pretzels', O], ['Coffee', O], ['Tea bags', O], ['Orange juice', O], ['Sparkling water', O],
  ['Soda', O], ['Granola bars', O], ['Trail mix', O], ['Paper towels', O], ['Dog food', O], ['Protein powder', O], ['Energy drink', O], ['Beer', O], ['Wine', O], ['Gum', O]
];
