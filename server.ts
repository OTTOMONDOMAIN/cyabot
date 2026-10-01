import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory cache for live API proxy
const cache: Record<string, { data: any; expiry: number }> = {};
const CACHE_TTL_MS = 60 * 1000; // 1 minute

async function fetchWithFallback(endpoint: string, fallbackFile: string) {
  const now = Date.now();
  if (cache[endpoint] && cache[endpoint].expiry > now) {
    return cache[endpoint].data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://www.hedwig.site${endpoint}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'HedwigSite-Clone/1.0',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      cache[endpoint] = { data, expiry: now + CACHE_TTL_MS };
      return data;
    }
  } catch (err) {
    // network or abort error, use fallback
  }

  const filePath = path.join(__dirname, 'src', 'data', fallbackFile);
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    cache[endpoint] = { data: parsed, expiry: now + CACHE_TTL_MS };
    return parsed;
  }

  return null;
}

// API Routes
app.get('/api/config', async (_req: Request, res: Response) => {
  res.json({
    supportServerUrl: 'https://dsc.gg/cya',
    inviteUrl: 'https://discord.com/oauth2/authorize?client_id=1552270485520384112&permissions=8&integration_type=0&scope=bot',
    turnstileSiteKey: '0x4AAAAAAEr18JVU94yRvN4b',
  });
});

app.get('/api/status', async (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'src', 'data', 'status.json');
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    parsed.botTag = 'cya#0001';
    parsed.botId = '1552270485520384112';
    res.json(parsed);
  } else {
    res.json({
      status: 'online',
      servers: 1180,
      users: 245000,
      commands: 420,
      shards: 1,
      latency: 14,
      uptime: 1450000000,
      botTag: 'cya#0001',
      botId: '1552270485520384112',
    });
  }
});

app.get('/api/commands', async (_req: Request, res: Response) => {
  const data = await fetchWithFallback('/api/commands', 'commands.json');
  res.json(data || { commands: [] });
});

app.get('/api/categories', async (_req: Request, res: Response) => {
  const data = await fetchWithFallback('/api/categories', 'categories.json');
  res.json(data || { categories: [] });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const portNum = Number(PORT);
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${portNum}`);
  });
}

startServer();
