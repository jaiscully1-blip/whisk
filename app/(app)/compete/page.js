'use client';
import { useWhisk } from '@/components/AppShell';
import { PartyCard, ChatsPeek, FriendStrip } from '@/components/PartyHub';

// Compete is people: your friends, your parties and your chats. This week's challenges, the plates and the globe all live
// inside a party, so everyone in it plays them together.
export default function Compete() {
  const { t } = useWhisk();
  return (
    <div className="stack">
      <div className="page-title"><h1>{t('Compete')}</h1></div>
      <FriendStrip />
      <PartyCard />
      <ChatsPeek />
    </div>
  );
}
