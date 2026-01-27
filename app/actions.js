'use server';

import db from '@/lib/db';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function registerUser(formData) {
    const fullName = formData.get('fullName');
    const phoneNumber = formData.get('phoneNumber');
    const licensePlate = formData.get('licensePlate');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
        return { message: 'Şifreler uyuşmuyor!' };
    }
    const secretQuestion = formData.get('secretQuestion');
    const secretAnswer = formData.get('secretAnswer');

    if (!fullName || !phoneNumber || !licensePlate || !password || !secretQuestion || !secretAnswer) {
        return { message: 'Lütfen tüm alanları doldurun.' };
    }

    // Hash Password & Secret Answer
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecretAnswer = await bcrypt.hash(secretAnswer.toLowerCase().trim(), 10);

    // Simple session token
    let sessionToken = Math.random().toString(36).substring(7);

    try {
        await db.execute({
            sql: `INSERT INTO users (fullName, phoneNumber, licensePlate, password, secretQuestion, secretAnswer, sessionToken) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [fullName, phoneNumber, licensePlate, hashedPassword, secretQuestion, hashedSecretAnswer, sessionToken]
        });
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message.includes('UNIQUE constraint failed')) {
            return { message: 'Bu numara ile kayıt zaten mevcut.' };
        } else {
            console.error(error);
            return { message: 'Bir hata oluştu.' };
        }
    }

    // Set Cookie
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const maxAgeSeconds = 30 * 24 * 60 * 60;

    (await cookies()).set('auth_session', encodeURIComponent(JSON.stringify({ phone: phoneNumber, token: sessionToken })), {
        httpOnly: true,
        secure: false, // Compatibility for WebViews/Localhost
        expires: expiresAt,
        maxAge: maxAgeSeconds,
        sameSite: 'lax',
        path: '/',
    });

    redirect('/dashboard');
}

export async function getDashboardData() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('auth_session');

    if (!sessionCookie) return null;

    let finalPhone, finalToken;
    try {
        const decodedValue = decodeURIComponent(sessionCookie.value);
        const session = JSON.parse(decodedValue);
        finalPhone = session.phone;
        finalToken = session.token;
    } catch (e) {
        try {
            const session = JSON.parse(sessionCookie.value);
            finalPhone = session.phone;
            finalToken = session.token;
        } catch (e2) {
            return null;
        }
    }

    if (!finalPhone || !finalToken) return null;

    try {
        // Handle format mismatch (05XX vs 5XX)
        const normalizedPhone = finalPhone.replace(/^0/, '');
        const withZero = '0' + normalizedPhone;

        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE (phoneNumber = ? OR phoneNumber = ?) AND sessionToken = ?',
            args: [normalizedPhone, withZero, finalToken]
        });
        const user = result.rows[0];

        if (!user) return null;

        // Check code expiration
        const lastUpdate = user.lastCodeUpdate ? new Date(user.lastCodeUpdate).getTime() : 0;
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;

        if (now - lastUpdate > tenMinutes || !user.dynamicCode) {
            const newCode = Math.floor(1000 + Math.random() * 9000).toString();
            await db.execute({
                sql: `UPDATE users SET dynamicCode = ?, lastCodeUpdate = ? WHERE id = ?`,
                args: [newCode, new Date().toISOString(), user.id]
            });
            user.dynamicCode = newCode;
        }

        // Update lastSeen (non-blocking)
        db.execute({
            sql: `UPDATE users SET lastSeen = ? WHERE id = ?`,
            args: [new Date().toISOString(), user.id]
        }).catch(e => console.error('Update lastSeen error:', e));


        return user;
    } catch (e) {
        console.error('getDashboardData error:', e);
        return null;
    }
}


export async function simulatePayment(phoneNumber, token, tier = 'Bronze') {
    let finalPhone = phoneNumber;
    let finalToken = token;

    if (!finalPhone || !finalToken) {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('auth_session');
        if (sessionCookie) {
            try {
                const session = JSON.parse(decodeURIComponent(sessionCookie.value));
                finalPhone = session.phone;
                finalToken = session.token;
            } catch (e) {
                try {
                    const session = JSON.parse(sessionCookie.value);
                    finalPhone = session.phone;
                    finalToken = session.token;
                } catch (e2) { }
            }
        }
    }

    if (!finalPhone || !finalToken) throw new Error('Oturum geçersiz. Lütfen tekrar giriş yapın.');

    try {
        await db.execute({
            sql: 'UPDATE users SET subscriptionStatus = ? WHERE phoneNumber = ? AND sessionToken = ?',
            args: [tier, finalPhone, finalToken]
        });

        // Re-issue cookie with updated tier info if necessary, or just redirect
        redirect('/dashboard');
    } catch (e) {
        console.error('simulatePayment error:', e);
        throw e;
    }
}

export async function loginUser(prevState, formData) {
    const phoneNumber = formData.get('phoneNumber');
    const password = formData.get('password');

    try {
        // Handle format mismatch (05XX vs 5XX)
        const normalizedPhone = phoneNumber.replace(/^0/, '');
        const withZero = '0' + normalizedPhone;

        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE phoneNumber = ? OR phoneNumber = ?',
            args: [normalizedPhone, withZero]
        });
        const user = result.rows[0];

        if (!user) {
            return { message: 'Kullanıcı bulunamadı. Lütfen kayıt olun.' };
        }

        if (user.password) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return { message: 'Hatalı şifre!' };
            }
        } else {
            return { message: 'Hesabınızda şifre tanımlı değil. Lütfen "Şifremi Unuttum" diyerek yeni şifre oluşturun.' };
        }

        // Refresh Session Token
        const newSessionToken = Math.random().toString(36).substring(7);
        await db.execute({
            sql: 'UPDATE users SET sessionToken = ? WHERE phoneNumber = ?',
            args: [newSessionToken, user.phoneNumber]
        });

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const maxAgeSeconds = 30 * 24 * 60 * 60;

        (await cookies()).set('auth_session', encodeURIComponent(JSON.stringify({ phone: user.phoneNumber, token: newSessionToken })), {
            httpOnly: true,
            secure: false,
            expires: expiresAt,
            maxAge: maxAgeSeconds,
            sameSite: 'lax',
            path: '/',
        });

    } catch (error) {
        return { message: 'Giriş yapılamadı: ' + error.message };
    }

    redirect('/dashboard');
}

export async function logoutUser() {
    (await cookies()).delete('auth_session');
    redirect('/');
}

export async function restoreSession(phoneNumber, token) {
    try {
        if (!phoneNumber || !token) return { success: false };

        const result = await db.execute({
            sql: 'SELECT id FROM users WHERE phoneNumber = ? AND sessionToken = ?',
            args: [phoneNumber, token]
        });

        if (!result.rows[0]) return { success: false };

        // Restoration valid - Set Cookie
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const maxAgeSeconds = 30 * 24 * 60 * 60;

        (await cookies()).set('auth_session', encodeURIComponent(JSON.stringify({ phone: phoneNumber, token: token })), {
            httpOnly: true,
            secure: false,
            expires: expiresAt,
            maxAge: maxAgeSeconds,
            sameSite: 'lax',
            path: '/',
        });

        return { success: true };
    } catch (e) {
        console.error('restoreSession error:', e);
        return { success: false };
    }
}

export async function getWeather(lat, lon) {
    let finalLat = lat;
    let finalLon = lon;

    if (!finalLat || !finalLon) {
        finalLat = 38.4127;
        finalLon = 27.1384;
    }

    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            return { temp: 18, description: 'Açık', icon: '☀️' };
        }

        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${finalLat}&lon=${finalLon}&appid=${apiKey}&units=metric&lang=tr`);
        const data = await res.json();

        const iconMap = {
            'Clouds': '☁️', 'Clear': '☀️', 'Rain': '🌧️', 'Drizzle': '🌦️',
            'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️', 'Smoke': '🌫️',
            'Haze': '🌫️', 'Dust': '🌫️', 'Fog': '🌫️', 'Sand': '🌫️',
            'Ash': '🌫️', 'Squall': '🌬️', 'Tornado': '🌪️'
        };

        return {
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: iconMap[data.weather[0].main] || '⛅'
        };
    } catch (e) {
        console.error('Weather action error:', e);
        return { temp: '--', description: 'Bilinmiyor', icon: '❓' };
    }
}

export async function getSafeSecurityQuestion(phoneNumber) {
    try {
        const normalizedPhone = phoneNumber.replace(/^0/, '');
        const withZero = '0' + normalizedPhone;
        const result = await db.execute({
            sql: 'SELECT secretQuestion FROM users WHERE phoneNumber = ? OR phoneNumber = ?',
            args: [normalizedPhone, withZero]
        });
        return result.rows[0]?.secretQuestion || null;
    } catch (e) {
        console.error('getSafeSecurityQuestion error:', e);
        return null;
    }
}

export async function resetPassword(phoneNumber, answer, newPassword) {
    try {
        const normalizedPhone = phoneNumber.replace(/^0/, '');
        const withZero = '0' + normalizedPhone;
        const result = await db.execute({
            sql: 'SELECT * FROM users WHERE phoneNumber = ? OR phoneNumber = ?',
            args: [normalizedPhone, withZero]
        });
        const user = result.rows[0];
        if (!user || !user.secretAnswer) return { success: false, message: 'Kullanıcı veya gizli soru bulunamadı.' };

        const isAnswerCorrect = await bcrypt.compare(answer.toLowerCase().trim(), user.secretAnswer);
        if (!isAnswerCorrect) return { success: false, message: 'Gizli soru cevabı hatalı!' };

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.execute({
            sql: 'UPDATE users SET password = ? WHERE id = ?',
            args: [hashedNewPassword, user.id]
        });

        return { success: true };
    } catch (e) {
        console.error('resetPassword error:', e);
        return { success: false, message: 'Bir hata oluştu.' };
    }
}

export async function getMyRaffleTickets() {
    const user = await getDashboardData();
    if (!user) return [];

    try {
        const result = await db.execute({
            sql: `SELECT rt.*, rc.name as campaignName 
                  FROM raffle_tickets rt 
                  JOIN raffle_campaigns rc ON rt.campaignId = rc.id 
                  WHERE rt.userId = ? 
                  ORDER BY rt.scannedAt DESC`,
            args: [user.id]
        });
        return result.rows;
    } catch (e) {
        console.error('getMyRaffleTickets error:', e);
        return [];
    }
}

export async function claimRaffleCode(code) {
    const user = await getDashboardData();
    if (!user) return { success: false, message: 'Oturum geçersiz.' };

    try {
        if (code.length !== 10) return { success: false, message: 'Geçersiz kod formatı.' };

        const existing = await db.execute({
            sql: 'SELECT id FROM raffle_tickets WHERE code = ?',
            args: [code]
        });
        if (existing.rows.length > 0) return { success: false, message: 'Bu kod daha önce kullanılmış.' };

        const campaign = await db.execute("SELECT id, name FROM raffle_campaigns WHERE status = 'active' LIMIT 1");
        if (!campaign.rows[0]) return { success: false, message: 'Aktif çekiliş bulunamadı.' };

        await db.execute({
            sql: 'INSERT INTO raffle_tickets (userId, campaignId, code) VALUES (?, ?, ?)',
            args: [user.id, campaign.rows[0].id, code]
        });

        return { success: true, message: `Biletiniz başarıyla tanımlandı: ${campaign.rows[0].name}` };
    } catch (e) {
        console.error('claimRaffleCode error:', e);
        return { success: false, message: 'İşlem sırasında bir hata oluştu.' };
    }
}
