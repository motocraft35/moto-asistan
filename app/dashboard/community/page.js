import CommunityChatClient from './client';
import { getDashboardData } from '../../actions';
import { redirect } from 'next/navigation';

export default async function CommunityPage({ searchParams }) {
    const { phone, token } = await searchParams;

    const user = await getDashboardData(phone, token);

    if (!user) {
        redirect('/');
    }

    return <CommunityChatClient user={user} />;
}
