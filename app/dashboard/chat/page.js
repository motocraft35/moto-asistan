import { getDashboardData } from '../../actions';
import ChatClient from './client';
import { redirect } from 'next/navigation';

export default async function ChatPage({ searchParams }) {
    const user = await getDashboardData();

    if (!user) redirect('/');

    return (
        <ChatClient
            userId={user.id}
            userFullName={user.fullName}
            userPhone={user.phoneNumber}
            isSubscribed={user.subscriptionStatus === 'Active'}
            initialNotificationsEnabled={user.notificationsEnabled === 1}
        />
    );
}
