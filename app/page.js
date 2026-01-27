import { redirect } from 'next/navigation';
import { getUserId } from '@/lib/auth';

export default async function Page() {
  const userId = await getUserId();

  if (userId) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  return null;
}
