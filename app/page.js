import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserId } from '@/lib/auth';
import AutoSessionRestorer from './components/AutoSessionRestorer';

export default async function Page() {
  const userId = await getUserId();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session');

  // If already logged in, redirect to dashboard
  if (userId || sessionCookie) {
    redirect('/dashboard');
  }

  // Otherwise, show login page with auto-restore capability
  return (
    <>
      <AutoSessionRestorer />
    </>
  );
}
