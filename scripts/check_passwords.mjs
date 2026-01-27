import bcrypt from 'bcryptjs';
import fs from 'fs';

const testAccounts = JSON.parse(fs.readFileSync('test_accounts_final.json', 'utf8'));
const commonPasswords = ['123456', 'test123456', 'moto123', 'asistan123', 'password', '05224444444', '5551234567'];

async function run() {
    const results = [];
    for (const user of testAccounts) {
        let found = false;
        for (const pw of commonPasswords) {
            if (await bcrypt.compare(pw, user.password)) {
                results.push({
                    fullName: user.fullName,
                    phoneNumber: user.phoneNumber,
                    password: pw
                });
                found = true;
                break;
            }
        }
        if (!found) {
            results.push({
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                password: '[Bilinmiyor - Reset Önerilir]'
            });
        }
    }
    fs.writeFileSync('bot_credentials.json', JSON.stringify(results, null, 2));
    console.log('Done');
}

run();
