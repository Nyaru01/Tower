import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

console.log('🏁 [SERVER] Starting initialization...');

dotenv.config();

console.log('⚙️ [SERVER] Environment:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  HAS_DB_URL: !!process.env.DATABASE_URL
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔌 [SERVER] Initializing Express...');

const app = express();
const PORT = process.env.PORT || 3001;

const OFFICIAL_DEFAULTS = {
  1: {
    path: [{x:200,y:70},{x:200,y:675}],
    slots: [
      {id:1,x:106,y:250,r:16,tower:null,side:'left'},{id:2,x:106,y:400,r:16,tower:null,side:'left'},
      {id:3,x:106,y:550,r:16,tower:null,side:'left'},{id:4,x:294,y:250,r:16,tower:null,side:'right'},
      {id:5,x:294,y:400,r:16,tower:null,side:'right'},{id:6,x:294,y:550,r:16,tower:null,side:'right'},
    ]
  },
  2: {
    path: [{x:200,y:70}, {x:100,y:250}, {x:300,y:450}, {x:200,y:750}],
    slots: [
      {id:1,x:240,y:180,r:16,tower:null,side:'right'}, {id:2,x:50,y:350,r:16,tower:null,side:'left'},
      {id:3,x:350,y:350,r:16,tower:null,side:'right'}, {id:4,x:180,y:500,r:16,tower:null,side:'left'},
      {id:5,x:280,y:650,r:16,tower:null,side:'right'}, {id:6,x:100,y:600,r:16,tower:null,side:'left'},
    ]
  },
  3: {
    path: [{x:100,y:70}, {x:100,y:550}, {x:300,y:550}, {x:300,y:750}],
    slots: [
      {id:1,x:200,y:300,r:16,tower:null,side:'center'}, {id:2,x:200,y:450,r:16,tower:null,side:'center'},
      {id:3,x:40,y:300,r:16,tower:null,side:'left'}, {id:4,x:360,y:300,r:16,tower:null,side:'right'},
      {id:5,x:40,y:450,r:16,tower:null,side:'left'}, {id:6,x:360,y:450,r:16,tower:null,side:'right'},
    ]
  },
  4: {
    path: [{x:200,y:70}, {x:350,y:200}, {x:50,y:350}, {x:350,y:500}, {x:200,y:750}],
    slots: [
      {id:1,x:200,y:250,r:16,tower:null,side:'center'}, {id:2,x:200,y:400,r:16,tower:null,side:'center'},
      {id:3,x:80,y:150,r:16,tower:null,side:'left'}, {id:4,x:320,y:350,r:16,tower:null,side:'right'},
      {id:5,x:80,y:550,r:16,tower:null,side:'left'}, {id:6,x:320,y:650,r:16,tower:null,side:'right'},
    ]
  },
  5: {
    path: [{x:100,y:70}, {x:100,y:200}, {x:300,y:200}, {x:300,y:400}, {x:100,y:400}, {x:100,y:600}, {x:300,y:600}, {x:300,y:750}],
    slots: [
      {id:1,x:200,y:100,r:16,tower:null,side:'center'}, {id:2,x:200,y:300,r:16,tower:null,side:'center'},
      {id:3,x:200,y:500,r:16,tower:null,side:'center'}, {id:4,x:200,y:700,r:16,tower:null,side:'center'},
      {id:5,x:50,y:400,r:16,tower:null,side:'left'}, {id:6,x:350,y:200,r:16,tower:null,side:'right'},
    ]
  }
};

// PRE-INITIALIZE CLOUD DB (ASYNCHRONOUSLY)
async function initDatabase() {
  console.log('🐘 [SERVER] Starting database sync...');
  const serverDir = path.resolve(__dirname, '..');
  const prismaBin = path.join(serverDir, 'node_modules/.bin/prisma');
  const schemaPath = path.join(serverDir, 'prisma/schema.prisma');
  
  console.log(`⚙️ [SERVER] DB Config:`, { serverDir, prismaBin, schemaPath });

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }

    console.log('🐘 [SERVER] Running prisma db push...');
    // Use the absolute path to prisma binary and set the correct working directory
    execSync(`"${prismaBin}" db push --accept-data-loss --schema="${schemaPath}"`, { 
      stdio: 'inherit',
      cwd: serverDir,
      env: { ...process.env }
    });
    console.log('🐘 [SERVER] Database schema synced successfully');

    // Seed official levels if empty
    const count = await prisma.globalLevel.count();
    if (count === 0) {
      console.log('🐘 [SERVER] Seeding official levels...');
      for (const [lvl, data] of Object.entries(OFFICIAL_DEFAULTS)) {
        await prisma.globalLevel.create({
          data: {
            levelNumber: parseInt(lvl),
            data: data as any
          }
        });
      }
      console.log('🐘 [SERVER] Official levels seeded');
    }
  } catch (err) {
    console.error('❌ [SERVER] Database sync failed:', err);
  }
}

const prisma = new PrismaClient();

// ULTRA-PRIORITY Healthcheck for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(cors());
app.use(express.json());

// Resolve static path
const staticPath = path.join(__dirname, '../../dist');
console.log(`📂 [SERVER] Static files path: ${staticPath}`);
console.log(`📂 [SERVER] Exists:`, { dist: path.join(__dirname, '../../dist') });

// Serve static files from frontend
app.use(express.static(staticPath));

// Sync Progress
app.post('/api/sync', async (req, res) => {
  const { terminalId, diamonds, talentPoints, maxLevelUnlocked, unlockedTalents } = req.body;
  
  try {
    const player = await prisma.player.upsert({
      where: { terminalId },
      update: {
        diamonds,
        talentPoints,
        maxLevelUnlocked,
        unlockedTalents
      },
      create: {
        terminalId,
        diamonds,
        talentPoints,
        maxLevelUnlocked,
        unlockedTalents
      }
    });
    res.json(player);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to sync progress' });
  }
});

// Load Progress
app.get('/api/progress/:terminalId', async (req, res) => {
  const { terminalId } = req.params;
  try {
    const player = await prisma.player.findUnique({
      where: { terminalId },
      include: { customLevels: true }
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

// Save Level
app.post('/api/levels', async (req, res) => {
  const { terminalId, levelNumber, data } = req.body;
  
  try {
    const player = await prisma.player.findUnique({ where: { terminalId } });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const level = await prisma.customLevel.upsert({
      where: {
        playerId_levelNumber: {
          playerId: player.id,
          levelNumber
        }
      },
      update: { data },
      create: {
        playerId: player.id,
        levelNumber,
        data
      }
    });
    res.json(level);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save level' });
  }
});

// Official Levels (Global)
app.get('/api/official-levels', async (req, res) => {
  try {
    const levels = await prisma.globalLevel.findMany({
      orderBy: { levelNumber: 'asc' }
    });
    res.json(levels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load official levels' });
  }
});

app.post('/api/official-levels', async (req, res) => {
  const { terminalId, levelNumber, data } = req.body;
  
  // For now, let's allow anyone to save official levels to make it easy to update
  // but we can restrict this to the user's terminalId in the future.
  try {
    const level = await prisma.globalLevel.upsert({
      where: { levelNumber },
      update: { data },
      create: {
        levelNumber,
        data
      }
    });
    console.log(`🌍 [SERVER] Global level ${levelNumber} updated by ${terminalId}`);
    res.json(level);
  } catch (error) {
    console.error('Failed to save official level:', error);
    res.status(500).json({ error: 'Failed to save official level' });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✅ [SERVER] Proxy Tower Server is UP and listening on 0.0.0.0:${PORT}`);
  console.log(`🏥 [SERVER] Healthcheck available at: /health`);
  
  // Start database sync in background to not block healthcheck
  initDatabase().then(() => {
    return prisma.$connect();
  }).then(() => {
    console.log('🐘 [SERVER] Prisma client connected');
  }).catch(err => {
    console.error('❌ [SERVER] Background DB init failed:', err);
  });
}).on('error', (err) => {
  console.error('❌ [SERVER] Failed to listen:', err);
});

// All other requests serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
