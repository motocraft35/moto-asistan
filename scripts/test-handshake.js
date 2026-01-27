const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'collaboration_log.json');

const testEntries = [
    {
        timestamp: new Date().toISOString(),
        source: 'Ghost Gear AI',
        content: "ANTIGRAVITY: Profil sayfasındaki 'StatCard' bileşeninde neon efekti zayıf görünüyor. Bunu güçlendirebilir misin?",
        type: 'insight'
    },
    {
        timestamp: new Date(Date.now() + 1000).toISOString(),
        source: 'Antigravity',
        content: "ANLAŞILDI. StatCard bileşenini inceliyorum ve neon doygunluğunu artırıyorum. Değişiklikler birazdan ekranda olacak.",
        type: 'intervention_request'
    }
];

const currentData = {
    last_insight: testEntries[1],
    history: testEntries.reverse()
};

fs.writeFileSync(logPath, JSON.stringify(currentData, null, 2));
console.log('AI Collaboration Handshake Simulated!');
