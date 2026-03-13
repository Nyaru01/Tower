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
