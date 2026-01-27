
const fetch = require('node-fetch');

async function testProfileApi() {
    const baseUrl = 'http://localhost:3000'; // Assuming local dev for theory, but I'll check logic

    console.log('Testing /api/users/me...');
    try {
        const res = await fetch(`${baseUrl}/api/users/me`);
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', data);
    } catch (e) {
        console.error('Error hitting /api/users/me:', e.message);
    }

    console.log('\nTesting /api/users/999 (Non-existent)...');
    try {
        const res = await fetch(`${baseUrl}/api/users/999`);
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', data);
    } catch (e) {
        console.error('Error hitting /api/users/999:', e.message);
    }
}

// I can't actually run this against the real deployed server easily without full URL and cookies
// but I'll use it to verify my logic in my head.
