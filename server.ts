import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));

// In-memory cache for live API proxy
const cache: Record<string, { data: any; expiry: number }> = {};
const CACHE_TTL_MS = 60 * 1000; // 1 minute

const ADMIN_ID = 'aver@cya.lat';
const ADMIN_PASS = 'dev.darky';
const ADMIN_TOKEN = 'cya_admin_token_99482716';

const transactionsFilePath = path.join(__dirname, 'src', 'data', 'transactions.json');
const paymentSettingsFilePath = path.join(__dirname, 'src', 'data', 'payment_settings.json');

interface TransactionItem {
  id: string;
  planName: string;
  amount: string;
  billingCycle: string;
  paymentMethod: string;
  phoneNumber: string;
  discordTag?: string;
  trxId?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

function readTransactions(): TransactionItem[] {
  try {
    if (fs.existsSync(transactionsFilePath)) {
      const raw = fs.readFileSync(transactionsFilePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read transactions:', e);
  }
  return [];
}

function writeTransactions(items: TransactionItem[]) {
  try {
    fs.writeFileSync(transactionsFilePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write transactions:', e);
  }
}

const DEFAULT_PAYMENT_SETTINGS = {
  EasyPaisa: {
    qrCodeUrl: '',
    accountTitle: 'Cya Bot Official',
    accountNumber: '03XX-XXXXXXX',
    instructions: 'Scan the EasyPaisa QR code using your EasyPaisa app, enter your EasyPaisa number below, and click Done after sending the payment.',
  },
  JazzCash: {
    qrCodeUrl: '',
    accountTitle: 'Cya Bot Official',
    accountNumber: '03XX-XXXXXXX',
    instructions: 'Scan the JazzCash QR code using your JazzCash app, enter your JazzCash mobile number below, and click Done after sending the payment.',
  },
  Crypto: {
    qrCodeUrl: '',
    accountTitle: 'Binance Pay / USDT (TRC20)',
    accountNumber: 'TXYZ...USDT_WALLET_OR_BINANCE_ID',
    instructions: 'Scan the Binance Pay / USDT QR code, enter your Sender UID or Wallet / Contact below, and click Done after sending.',
  },
};

function readPaymentSettings() {
  try {
    if (fs.existsSync(paymentSettingsFilePath)) {
      const raw = fs.readFileSync(paymentSettingsFilePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.EasyPaisa && parsed.JazzCash && parsed.Crypto) {
        return parsed;
      }
      // Migrate legacy flat structure if present
      return {
        ...DEFAULT_PAYMENT_SETTINGS,
        EasyPaisa: {
          qrCodeUrl: parsed.qrCodeUrl || '',
          accountTitle: parsed.accountTitle || 'Cya Bot Official',
          accountNumber: parsed.accountNumber || '03XX-XXXXXXX',
          instructions: parsed.instructions || DEFAULT_PAYMENT_SETTINGS.EasyPaisa.instructions,
        },
      };
    }
  } catch (e) {
    console.error('Failed to read payment settings:', e);
  }
  return DEFAULT_PAYMENT_SETTINGS;
}

function writePaymentSettings(settings: any) {
  try {
    fs.writeFileSync(paymentSettingsFilePath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write payment settings:', e);
  }
}

function verifyAdminAuth(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_TOKEN}`) return true;
  return false;
}

async function fetchWithFallback(endpoint: string, fallbackFile: string) {
  const now = Date.now();
  if (cache[endpoint] && cache[endpoint].expiry > now) {
    return cache[endpoint].data;
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

// Payment Settings Public Route
app.get('/api/payment-settings', (_req: Request, res: Response) => {
  res.json(readPaymentSettings());
});

// Create a New Transaction
app.post('/api/transactions', (req: Request, res: Response) => {
  const { planName, amount, billingCycle, paymentMethod, phoneNumber, discordTag, trxId } = req.body;

  if (!phoneNumber || !String(phoneNumber).trim()) {
    res.status(400).json({ error: 'Phone number is required' });
    return;
  }

  const transactions = readTransactions();
  const newTx: TransactionItem = {
    id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    planName: planName || 'Starter Plan',
    amount: amount || '90 Rs',
    billingCycle: billingCycle || 'monthly',
    paymentMethod: paymentMethod || 'EasyPaisa',
    phoneNumber: String(phoneNumber).trim(),
    discordTag: discordTag ? String(discordTag).trim() : '',
    trxId: trxId ? String(trxId).trim() : '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  transactions.unshift(newTx);
  writeTransactions(transactions);

  res.status(201).json({ transaction: newTx });
});

// Check a Single Transaction Status
app.get('/api/transactions/:id', (req: Request, res: Response) => {
  const transactions = readTransactions();
  const found = transactions.find((t) => t.id.toLowerCase() === String(req.params.id).toLowerCase());
  if (!found) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  res.json({ transaction: found });
});

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { id, password } = req.body;
  if (
    String(id || '').trim().toLowerCase() === ADMIN_ID.toLowerCase() &&
    String(password || '') === ADMIN_PASS
  ) {
    res.json({
      success: true,
      token: ADMIN_TOKEN,
      admin: { id: ADMIN_ID },
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid admin ID or password.',
    });
  }
});

// Admin: Get All Transactions
app.get('/api/admin/transactions', (req: Request, res: Response) => {
  if (!verifyAdminAuth(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ transactions: readTransactions() });
});

// Admin: Update Transaction Status (Verify / Reject / Pending)
app.patch('/api/admin/transactions/:id', (req: Request, res: Response) => {
  if (!verifyAdminAuth(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { status } = req.body;
  if (!['pending', 'verified', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const transactions = readTransactions();
  const idx = transactions.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  transactions[idx].status = status;
  writeTransactions(transactions);
  res.json({ transaction: transactions[idx] });
});

// Admin: Delete Transaction
app.delete('/api/admin/transactions/:id', (req: Request, res: Response) => {
  if (!verifyAdminAuth(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const transactions = readTransactions();
  const filtered = transactions.filter((t) => t.id !== req.params.id);
  writeTransactions(filtered);
  res.json({ success: true });
});

// Admin: Update Per-Method QR & Payment Settings
app.put('/api/admin/payment-settings', (req: Request, res: Response) => {
  if (!verifyAdminAuth(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const current = readPaymentSettings();
  const updated = {
    EasyPaisa: req.body.EasyPaisa ? { ...current.EasyPaisa, ...req.body.EasyPaisa } : current.EasyPaisa,
    JazzCash: req.body.JazzCash ? { ...current.JazzCash, ...req.body.JazzCash } : current.JazzCash,
    Crypto: req.body.Crypto ? { ...current.Crypto, ...req.body.Crypto } : current.Crypto,
  };
  writePaymentSettings(updated);
  res.json(updated);
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
