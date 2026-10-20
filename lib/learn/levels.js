// Cooking levels (the order matters: they go from newest to most experienced). Learning (the Learn button and the
// quizzes) is offered for the first three; players who pick a higher level can change their mind any time in Me.
export const LEVELS = [
  { id: 'beginner', label: 'Beginner', blurb: 'I am just starting. Boiling water is an adventure.' },
  { id: 'novice', label: 'Novice', blurb: 'I can follow a simple recipe with some help.' },
  { id: 'advanced_beginner', label: 'Advanced beginner', blurb: 'I cook a few dishes and know the basics.' },
  { id: 'competent', label: 'Competent', blurb: 'I plan meals and handle most recipes on my own.' },
  { id: 'proficient', label: 'Proficient', blurb: 'I cook by feel and fix things as I go.' },
  { id: 'expert', label: 'Expert', blurb: 'I could teach the class.' },
];
export const LEARNING_LEVELS = ['beginner', 'novice', 'advanced_beginner'];
export const learns = (level) => LEARNING_LEVELS.includes(level);
export const levelLabel = (id) => LEVELS.find((l) => l.id === id)?.label || '';

// Learning streak as shown today: it is alive if you finished a quiz today or yesterday (your phone's calendar).
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function learnState(profile, now = new Date(), today = '') {
  const last = profile?.learn_last || null, n = profile?.learn_streak || 0;
  // `today` = the date on the player's own calendar (their chosen time zone); without it, this phone's calendar
  const t = today || ymd(now);
  const yesterday = today ? new Date(new Date(`${today}T12:00:00Z`).getTime() - 864e5).toISOString().slice(0, 10) : ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  // >= (not ===): the server counts days on the player's own time zone setting, which can be a day ahead of this phone's clock
  const doneToday = !!last && last >= t, alive = !!last && last >= yesterday;
  return { streak: alive ? n : 0, doneToday, best: profile?.learn_best || 0 };
}
