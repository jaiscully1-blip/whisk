// Challenge meal catalog. Difficulty score + coins are computed in the database
// (public.difficulty_score / public.score_to_coins) so the formula has one source of truth.
// [name, cuisine, minutes, technique 1-5, prep 1-5, steps, precision 1-5]
export const CHALLENGE_MEALS = [
  // small (14–34)
  ['Overnight oats', 'American', 5, 1, 1, 3, 1],
  ['Scrambled eggs on toast', 'American', 10, 1, 1, 4, 1],
  ['Grilled cheese', 'American', 12, 2, 1, 4, 1],
  ['Avocado toast with chili flakes', 'American', 10, 1, 2, 4, 1],
  ['Cheese quesadilla', 'Mexican', 15, 2, 1, 5, 1],
  ['Air fryer chicken wings', 'American', 35, 2, 1, 5, 2],
  ['Peanut butter banana smoothie', 'American', 5, 1, 1, 3, 1],
  ['Instant ramen upgrade', 'Japanese', 12, 1, 2, 5, 1],
  // medium (35–64)
  ['Sheet-pan sausage & veg', 'American', 40, 2, 2, 5, 1],
  ['Smash burgers', 'American', 25, 3, 2, 7, 2],
  ['Garlic butter chicken & rice', 'American', 35, 3, 2, 7, 2],
  ['Chicken stir-fry', 'Chinese', 30, 3, 4, 8, 2],
  ['Spaghetti carbonara', 'Italian', 25, 4, 2, 7, 4],
  ['Pad thai', 'Thai', 40, 3, 4, 10, 3],
  ['Shakshuka', 'Middle Eastern', 35, 3, 3, 8, 2],
  ['Chicken fajitas', 'Mexican', 35, 3, 3, 8, 2],
  // big 65–79
  ['Chicken tikka masala', 'Indian', 60, 4, 4, 11, 2],
  ['Homemade lasagna', 'Italian', 100, 3, 3, 12, 3],
  ['Korean fried chicken', 'Korean', 70, 4, 3, 11, 3],
  ['Bibimbap', 'Korean', 60, 3, 5, 12, 2],
  // big 80+
  ['Homemade pizza from dough', 'Italian', 120, 4, 3, 12, 4],
  ['Beef birria tacos', 'Mexican', 120, 4, 4, 14, 3],
  ['Chicken pot pie from scratch', 'American', 105, 5, 4, 14, 4],
  ['Fresh pasta ravioli', 'Italian', 110, 5, 4, 15, 4],
  ['Beef Wellington', 'British', 120, 5, 5, 15, 5],
  ['Tonkotsu-style ramen', 'Japanese', 120, 4, 4, 15, 4]
];
