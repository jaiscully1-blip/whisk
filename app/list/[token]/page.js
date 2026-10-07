import SharedList from './SharedList';

export const metadata = { title: 'Shopping list · Whisk', robots: { index: false, follow: false } };

// A Whisk player's shopping list, opened from their share link. No app, no account: tick things off as you shop.
export default async function Page({ params }) {
  const { token } = await params;
  return <SharedList token={/^[a-f0-9]{32}$/.test(token) ? token : ''} />;
}
