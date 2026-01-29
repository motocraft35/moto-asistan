import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserId } from '@/lib/auth';
import AutoSessionRestorer from './components/AutoSessionRestorer';

export default async function Page() {
  const userId = await getUserId();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session');

  // If already logged in (either via JWT or custom session), redirect to dashboard
  if (userId || sessionCookie) {
    console.log('[Root Page] Session detected, redirecting to dashboard');
    redirect('/dashboard');
  }

  // If no session, the app needs to show the login UI.
  // In this app, /login is the main entry point if not redirected.
  redirect('/login');
}
