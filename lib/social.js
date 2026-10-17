// Little helpers for Friends and chat: a steady colour per name, and "5 min ago" style times.
const COLORS = ['#FF6B57', '#8B5CF6', '#1CB0F6', '#58B030', '#FF9600', '#FF4D7E'];
export const color = (s) => COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
export function ago(t) {
  const s = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 1000));
  if (s < 60) return 'now'; if (s < 3600) return `${Math.round(s / 60)} min`; if (s < 86400) return `${Math.round(s / 3600)} h`;
  const d = Math.round(s / 86400); return d === 1 ? 'yesterday' : d < 7 ? `${d} d` : new Date(t).toLocaleDateString();
}
// "3:42 PM" today, "Mon 3:42 PM" this week, otherwise the date: used for the gaps between chat messages
export function stamp(t) {
  const d = new Date(t), now = new Date(), tm = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const days = Math.floor((new Date(now.toDateString()) - new Date(d.toDateString())) / 864e5);
  if (days <= 0) return tm; if (days === 1) return `Yesterday ${tm}`; if (days < 7) return `${d.toLocaleDateString([], { weekday: 'short' })} ${tm}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${tm}`;
}
export const EMOJI = ['😀', '😂', '😋', '🤤', '😍', '🥹', '😎', '🤔', '👍', '👏', '🙌', '🔥', '❤️', '🎉', '🍳', '🥘', '🍕', '🍜', '🌮', '🥗', '🍰', '☕', '🧑‍🍳', '😴'];
