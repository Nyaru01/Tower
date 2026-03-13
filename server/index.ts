import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../../dist')));

// Routes de base
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
  console.log(`🚀 Proxy Tower Server started on 0.0.0.0:${PORT}`);
  console.log(`📡 Healthcheck path: /health`);
});

// All other requests serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
