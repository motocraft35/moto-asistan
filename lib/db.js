import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = (url && authToken) ? createClient({
  url,
  authToken
}) : {
  execute: async () => ({ rows: [], lastInsertRowid: BigInt(0) }),
  batch: async () => []
};

let isDbInitialized = false;

// Initialize Database Schema (Async)
export const initDb = async () => {
  try {
    // Users Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        phoneNumber TEXT NOT NULL UNIQUE,
        licensePlate TEXT NOT NULL,
        subscriptionStatus TEXT DEFAULT 'Passive',
        subscriptionEndDate TEXT,
        dynamicCode TEXT,
        lastCodeUpdate TEXT,
        sessionToken TEXT,
        chatActive INTEGER DEFAULT 0,
        notificationsEnabled INTEGER DEFAULT 1,
        password TEXT,
        secretQuestion TEXT,
        secretAnswer TEXT,
        isMaster INTEGER DEFAULT 0,
        lastSeen TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ... (rest of tables) ...

    // MIGRATION: Attempt to add columns to existing table
    // We try/catch each one because SQLite throws if column exists
    const migrate = async (tableName, colName, colType) => {
      try {
        await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${colType}`);
        console.log(`Migrated: Added ${colName} to ${tableName}`);
      } catch (e) {
        // Ignore if column exists
      }
    };

    await migrate('users', 'password', 'TEXT');
    await migrate('users', 'secretQuestion', 'TEXT');
    await migrate('users', 'secretAnswer', 'TEXT');
    await migrate('users', 'isMaster', 'INTEGER DEFAULT 0');
    await migrate('users', 'lastSeen', 'TEXT');
    await migrate('users', 'lastHeartbeat', 'TEXT');
    await migrate('users', 'totalUsageMinutes', 'INTEGER DEFAULT 0');
    await migrate('clans', 'flagId', 'INTEGER DEFAULT 1');
    await migrate('users', 'respectPoints', 'INTEGER DEFAULT 0');
    await migrate('users', 'xp', 'INTEGER DEFAULT 0');
    await migrate('users', 'dailyKm', 'REAL DEFAULT 0.0');
    await migrate('users', 'lastKmReset', 'TEXT');
    await migrate('users', 'fuelPoints', 'INTEGER DEFAULT 0');
    await migrate('users', 'gender', 'TEXT DEFAULT "Erkek"');
    await migrate('users', 'latitude', 'REAL');
    await migrate('users', 'longitude', 'REAL');
    await migrate('developer_requests', 'userId', 'INTEGER');

    // Create Capture Logs Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS capture_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        locationId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        clanId INTEGER,
        capturedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(locationId) REFERENCES map_locations(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);
    await migrate('clans', 'color', 'TEXT');
    await migrate('clans', 'xp', 'INTEGER DEFAULT 0');
    await migrate('bikes', 'imageUrls', 'TEXT');
    await migrate('bikes', 'accessories', 'TEXT');

    // Usage Limits (AI Parts)
    await migrate('users', 'partsUsageCount', 'INTEGER DEFAULT 0');
    await migrate('users', 'partsUsageWeek', 'TEXT');

    // Settings Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Call Logs Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        licensePlate TEXT,
        note TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Messages Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL CHECK(sender IN ('user', 'expert')),
        content TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        userId INTEGER NOT NULL,
        isRead INTEGER DEFAULT 0,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Private Messages Table (New Feature Preparation)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS private_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        content TEXT NOT NULL,
        imageUrl TEXT, -- NEW: Support for images in PMs
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        isRead INTEGER DEFAULT 0,
        FOREIGN KEY(senderId) REFERENCES users(id),
        FOREIGN KEY(receiverId) REFERENCES users(id)
      )
    `);
    await migrate('private_messages', 'imageUrl', 'TEXT');

    // Community Messages Table (General Chat)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS community_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        content TEXT NOT NULL,
        imageUrl TEXT, -- NEW: Support for images in Warzone Chat
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);
    await migrate('community_messages', 'imageUrl', 'TEXT');

    // Marketplace Listings Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sellerId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT, -- 'bike', 'part', 'gear'
        brand TEXT,
        model TEXT,
        year INTEGER,
        kilometers INTEGER,
        city TEXT,
        district TEXT,
        imageUrl TEXT,
        status TEXT DEFAULT 'Active',
        isAiVerified INTEGER DEFAULT 0,
        aiAnalysis TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sellerId) REFERENCES users(id)
      )
    `);

    // Migration for existing tables
    await migrate('marketplace_listings', 'city', 'TEXT');
    await migrate('marketplace_listings', 'district', 'TEXT');
    await migrate('marketplace_listings', 'brand', 'TEXT');
    await migrate('marketplace_listings', 'model', 'TEXT');
    await migrate('marketplace_listings', 'year', 'INTEGER');
    await migrate('marketplace_listings', 'kilometers', 'INTEGER');
    await migrate('marketplace_listings', 'isAiVerified', 'INTEGER DEFAULT 0');
    await migrate('marketplace_listings', 'aiAnalysis', 'TEXT');

    // Notification Subscriptions Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS notification_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            subscription TEXT,
            userAgent TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    // Developer Requests Table (AI Update Line)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS developer_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            userId INTEGER,
            status TEXT DEFAULT 'pending', -- pending, processed, ai_response
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    // Social Features: Follows Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            followerId INTEGER NOT NULL,
            followingId INTEGER NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(followerId) REFERENCES users(id),
            FOREIGN KEY(followingId) REFERENCES users(id),
            UNIQUE(followerId, followingId)
        )
    `);

    // Migration for Social Features
    await migrate('users', 'profileImage', 'TEXT');

    // Migration for Social Features
    // (Redundant follows block removed)

    // Migration for Social Features
    await migrate('users', 'bio', 'TEXT'); // NEW: User Bio

    // Auth.js / NextAuth Support
    await migrate('users', 'email', 'TEXT UNIQUE');
    await migrate('users', 'image', 'TEXT');
    await migrate('users', 'provider', 'TEXT');

    // Garage: Bikes Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS bikes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER,
            nickname TEXT,
            kilometers INTEGER DEFAULT 0,
            imageUrl TEXT,
            tripsCount INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    // Gear Table (Helmets, Intercoms, etc.)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS user_gear (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            type TEXT NOT NULL, -- 'helmet', 'intercom'
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            imageUrl TEXT,
            purchaseDate TEXT,
            notes TEXT,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    // Map Locations Table (Mechanics, Cafes, etc.)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS map_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- 'mechanic', 'cafe', 'fuel', 'meetup'
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            address TEXT,
            description TEXT,
            imageUrl TEXT,
            createdBy INTEGER, -- Optional: if users can suggest locations
            ownerClanId INTEGER, -- NEW: Clan that currently owns this location
            lastCaptureAt TEXT, -- NEW: Timestamp of last ownership change
            weeklyCheckInCount INTEGER DEFAULT 0, -- NEW: Count for this week's race
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(ownerClanId) REFERENCES clans(id)
        )
    `);

    // NEW: Migration for map_locations
    await migrate('map_locations', 'ownerClanId', 'INTEGER');
    await migrate('map_locations', 'lastCaptureAt', 'TEXT');
    await migrate('map_locations', 'weeklyCheckInCount', 'INTEGER DEFAULT 0');
    await migrate('map_locations', 'is_partner', 'INTEGER DEFAULT 0');
    await migrate('map_locations', 'geometry_json', 'TEXT');
    await migrate('map_locations', 'phone', 'TEXT');
    await migrate('map_locations', 'rating', 'REAL DEFAULT 0.0');
    await migrate('map_locations', 'website', 'TEXT');
    await migrate('map_locations', 'logo_url', 'TEXT');
    await migrate('map_locations', 'has_banner', 'INTEGER DEFAULT 0');

    // Add indexes for map performance
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_map_locations_lat_lng ON map_locations(latitude, longitude)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_map_locations_is_partner ON map_locations(is_partner)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_map_locations_type ON map_locations(type)`);


    // NEW: Location Check-ins Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS location_checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            locationId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            clanId INTEGER, -- Clan ID at the time of check-in
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            latitude REAL,
            longitude REAL,
            FOREIGN KEY(locationId) REFERENCES map_locations(id),
            FOREIGN KEY(userId) REFERENCES users(id),
            FOREIGN KEY(clanId) REFERENCES clans(id)
        )
    `);

    // Fair Price Index: Market Listings / Reports Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS market_listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER,
            price REAL NOT NULL,
            currency TEXT DEFAULT 'TL',
            kilometers INTEGER,
            source_image_url TEXT,
            reported_by INTEGER,
            listing_date TEXT DEFAULT CURRENT_TIMESTAMP,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(reported_by) REFERENCES users(id)
        )
    `);

    // AI Price Cache Table
    await db.execute(`
        CREATE TABLE IF NOT EXISTS part_price_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cacheKey TEXT UNIQUE NOT NULL,
            data TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
            expiresAt TEXT NOT NULL
        )
    `);

    // Create Clans table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS clans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        leaderId INTEGER NOT NULL,
        city TEXT,
        logoUrl TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(leaderId) REFERENCES users(id)
      )
    `);

    // Create Clan Members table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS clan_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clanId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        role TEXT DEFAULT 'member', -- leader, officer, member
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(clanId) REFERENCES clans(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Create Clan Requests table (NEW)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS clan_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clanId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        status TEXT DEFAULT 'pending', -- pending, accepted, rejected
        message TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(clanId) REFERENCES clans(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Create Notifications table (NEW)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT, -- clan_request, system, message
        relatedId TEXT, -- optional link to other records
        isRead INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // SOS Signals Table (NEW: Community Help Network)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sos_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        message TEXT,
        type TEXT DEFAULT 'mechanical', -- mechanical, accident, fuel, other
        status TEXT DEFAULT 'active', -- active, resolved
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        resolvedAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    // Parties Table (NEW: Group Ride)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS parties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        leaderId INTEGER NOT NULL,
        inviteCode TEXT UNIQUE NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(leaderId) REFERENCES users(id)
      )
    `);

    // Parties Table Migration (Neural Sync Support)
    await migrate('parties', 'destLatitude', 'REAL');
    await migrate('parties', 'destLongitude', 'REAL');
    await migrate('parties', 'destName', 'TEXT');
    await migrate('parties', 'broadcastMode', 'INTEGER DEFAULT 0');

    // Raffle Campaigns Table (NEW)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS party_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partyId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(partyId) REFERENCES parties(id),
        FOREIGN KEY(userId) REFERENCES users(id),
        UNIQUE(partyId, userId)
      )
    `);

    // Raffle Campaigns Table (NEW)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS raffle_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        status TEXT DEFAULT 'active', -- active, completed
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Raffle Tickets Table (NEW)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS raffle_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        campaignId INTEGER NOT NULL,
        venueId INTEGER, -- Optional link to partner venue
        code TEXT UNIQUE NOT NULL, -- 10-character code from QR/receipt
        scannedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id),
        FOREIGN KEY(campaignId) REFERENCES raffle_campaigns(id),
        FOREIGN KEY(venueId) REFERENCES map_locations(id)
      )
    `);

    // User Reports / Feedback Table (NEW)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'bug', 'suggestion', 'idea'
        content TEXT NOT NULL,
        pageUrl TEXT,
        status TEXT DEFAULT 'pending', -- pending, resolved, dismissed
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    console.log('Database initialized successfully (Turso Cloud)');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    isDbInitialized = true;
  }
};

// Only call if not already inited in this process
if (!isDbInitialized && url && authToken) {
  initDb();
}

export default db;
