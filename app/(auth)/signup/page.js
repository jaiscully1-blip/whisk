import { redirect } from 'next/navigation';
// Accounts are made with "Continue with Google" on the login screen.
export default function Signup() { redirect('/login'); }
