// "Today" on the player's own calendar (the time zone they picked in Settings, else their phone's), and how long until it ends.
const part = (parts, type) => +parts.find((p) => p.type === type)?.value;
function parts(tz, d) {
  try { return new Intl.DateTimeFormat('en-GB', { timeZone: tz || undefined, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d); }
  catch { return new Intl.DateTimeFormat('en-GB', { hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(d); }
}
// "2026-10-20" in that time zone
export function dayIn(tz, d = new Date()) {
  const p = parts(tz, d);
  return `${part(p, 'year')}-${String(part(p, 'month')).padStart(2, '0')}-${String(part(p, 'day')).padStart(2, '0')}`;
}
// milliseconds until 12:00 midnight starts the next day in that time zone
export function msToMidnight(tz, d = new Date()) {
  const p = parts(tz, d);
  const into = (part(p, 'hour') * 3600 + part(p, 'minute') * 60 + part(p, 'second')) * 1000 + d.getMilliseconds();
  return Math.max(1000, 86400000 - into);
}
