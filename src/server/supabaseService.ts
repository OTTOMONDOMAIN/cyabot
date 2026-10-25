import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, '../../.env');

// Initial load of .env
dotenv.config({ path: envFilePath });

export interface SupabaseTransaction {
  id: string;
  plan_name: string;
  amount: string;
  billing_cycle?: string;
  payment_method: string;
  phone_number?: string;
  discord_tag?: string;
  server_id?: string;
  trx_id?: string;
  email?: string;
  notes?: string;
  status: 'pending' | 'verified' | 'rejected';
  denial_reason?: string;
  created_at?: string;
  updated_at?: string;
}

let cachedClient: SupabaseClient | null = null;
let lastKnownUrl = '';
let lastKnownKey = '';

// Dynamically read directly from .env file + process.env
export function getSupabaseEnv(): {
  url: string;
  key: string;
  anonKey: string;
  serviceRoleKey: string;
  source: 'process_env' | 'dotenv_file' | 'none';
} {
  const fileEnv: Record<string, string> = {};
  try {
    if (fs.existsSync(envFilePath)) {
      const raw = fs.readFileSync(envFilePath, 'utf-8');
      raw.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const k = trimmed.substring(0, eqIdx).trim();
            let v = trimmed.substring(eqIdx + 1).trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.slice(1, -1);
            }
            fileEnv[k] = v;
          }
        }
      });
    }
  } catch (e) {
    console.warn('[Supabase] Could not read .env file directly:', e);
  }

  const url = (
    process.env.SUPABASE_URL ||
    fileEnv.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    fileEnv.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    fileEnv.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    fileEnv.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    fileEnv.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    fileEnv.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    fileEnv.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();

  const key = serviceRoleKey || anonKey;
  let source: 'process_env' | 'dotenv_file' | 'none' = 'none';
  if (process.env.SUPABASE_URL || process.env.SUPABASE_ANON_KEY) {
    source = 'process_env';
  } else if (fileEnv.SUPABASE_URL || fileEnv.SUPABASE_ANON_KEY) {
    source = 'dotenv_file';
  }

  return { url, key, anonKey, serviceRoleKey, source };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseEnv();

  if (!url || !key) {
    return null;
  }

  // Reuse existing client if credentials haven't changed
  if (cachedClient && lastKnownUrl === url && lastKnownKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastKnownUrl = url;
    lastKnownKey = key;
    return cachedClient;
  } catch (err) {
    console.error('[Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseEnv();
  return Boolean(url && key);
}

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  latencyMs?: number;
  message: string;
  tablesFound?: string[];
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase credentials not configured in environment variables (SUPABASE_URL, SUPABASE_ANON_KEY in .env).',
    };
  }

  const start = Date.now();
  try {
    // Try pinging transactions or checking a light query
    const { data, error } = await client.from('transactions').select('id').limit(1);
    const latencyMs = Date.now() - start;

    if (error) {
      // Check if error is table does not exist yet (code 42P01)
      if (error.code === '42P01' || error.message.includes('relation "public.transactions" does not exist')) {
        return {
          success: true,
          latencyMs,
          message: 'Connected to Supabase project! (Note: The "transactions" table is not created yet. Please execute the SQL migration script from the Supabase tab in Admin).',
          tablesFound: [],
        };
      }
      return {
        success: false,
        latencyMs,
        message: `Supabase query returned error: ${error.message} (Code: ${error.code || 'unknown'})`,
      };
    }

    return {
      success: true,
      latencyMs,
      message: `Successfully connected to Supabase in ${latencyMs}ms. Database is active and responsive.`,
      tablesFound: ['transactions'],
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect to Supabase: ${err.message || 'Unknown network error'}`,
    };
  }
}

export async function getSupabaseStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  url: string;
  hasAnonKey: boolean;
  hasServiceKey: boolean;
  source: 'process_env' | 'dotenv_file' | 'none';
  message: string;
  latencyMs?: number;
}> {
  const { url, anonKey, serviceRoleKey, source } = getSupabaseEnv();
  const hasAnonKey = Boolean(anonKey);
  const hasServiceKey = Boolean(serviceRoleKey);

  if (!url || (!hasAnonKey && !hasServiceKey)) {
    return {
      configured: false,
      connected: false,
      url: url || '',
      hasAnonKey,
      hasServiceKey,
      source,
      message: 'Supabase is not configured in .env yet. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file or save them below.',
    };
  }

  const test = await testSupabaseConnection();
  return {
    configured: true,
    connected: test.success,
    url,
    hasAnonKey,
    hasServiceKey,
    source,
    message: test.message,
    latencyMs: test.latencyMs,
  };
}

export async function saveTransactionToSupabase(tx: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row: SupabaseTransaction = {
      id: tx.id,
      plan_name: tx.planName,
      amount: tx.amount,
      billing_cycle: tx.billingCycle || 'per month',
      payment_method: tx.paymentMethod,
      phone_number: tx.phoneNumber || '',
      discord_tag: tx.discordTag || '',
      server_id: tx.serverId || '',
      trx_id: tx.trxId || '',
      email: tx.email || '',
      notes: tx.notes || '',
      status: tx.status || 'pending',
      denial_reason: tx.denialReason || '',
      created_at: tx.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('transactions').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] Failed to upsert transaction:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Error saving transaction:', err);
    return false;
  }
}

export async function updateTransactionStatusInSupabase(
  id: string,
  status: 'pending' | 'verified' | 'rejected',
  denialReason?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (denialReason !== undefined) {
      updatePayload.denial_reason = denialReason;
    }

    const { error } = await client.from('transactions').update(updatePayload).eq('id', id);
    if (error) {
      console.warn('[Supabase] Failed to update transaction status:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Error updating transaction:', err);
    return false;
  }
}

export async function fetchTransactionsFromSupabase(): Promise<any[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Error fetching transactions:', error.message);
      return null;
    }

    if (!data) return [];

    // Map database snake_case back to camelCase
    return data.map((row: any) => ({
      id: row.id,
      planName: row.plan_name,
      amount: row.amount,
      billingCycle: row.billing_cycle,
      paymentMethod: row.payment_method,
      phoneNumber: row.phone_number,
      discordTag: row.discord_tag,
      serverId: row.server_id,
      trxId: row.trx_id,
      email: row.email,
      notes: row.notes,
      status: row.status,
      denialReason: row.denial_reason,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('[Supabase] Fetch error:', err);
    return null;
  }
}

export async function saveEmailLogToSupabase(log: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: log.id,
      to_email: log.to,
      from_email: log.from,
      subject: log.subject,
      type: log.type,
      status: log.status,
      details: log.details || '',
      created_at: log.timestamp || new Date().toISOString(),
    };

    const { error } = await client.from('email_logs').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] Failed to save email log:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Error saving email log:', err);
    return false;
  }
}

export async function saveBotStatsToSupabase(stats: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: 'current',
      status: stats.status || 'online',
      servers: stats.servers || 0,
      users: stats.users || 0,
      commands: stats.commands || 45,
      shards: stats.shards || 1,
      latency: stats.latency || 15,
      bot_tag: stats.botTag || 'cya#0001',
      bot_id: stats.botId || '1552270485520384112',
      uptime: stats.uptime || 0,
      commands_per_min: stats.commandsPerMin || 0,
      cpu_percent: stats.cpuPercent || 0,
      memory_usage_mb: stats.memoryUsageMB || 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('bot_stats').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] Failed to save bot stats:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Error saving bot stats:', err);
    return false;
  }
}

export async function syncLocalDataToSupabase(
  localTransactions: any[],
  localLogs: any[]
): Promise<{ syncedTransactions: number; syncedLogs: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { syncedTransactions: 0, syncedLogs: 0, error: 'Supabase client is not configured' };
  }

  let txCount = 0;
  let logCount = 0;

  try {
    if (Array.isArray(localTransactions) && localTransactions.length > 0) {
      const rows = localTransactions.map((tx: any) => ({
        id: tx.id,
        plan_name: tx.planName || 'Plan',
        amount: tx.amount || '0',
        billing_cycle: tx.billingCycle || 'per month',
        payment_method: tx.paymentMethod || 'Manual',
        phone_number: tx.phoneNumber || '',
        discord_tag: tx.discordTag || '',
        server_id: tx.serverId || '',
        trx_id: tx.trxId || '',
        email: tx.email || '',
        notes: tx.notes || '',
        status: tx.status || 'pending',
        denial_reason: tx.denialReason || '',
        created_at: tx.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: txError } = await client.from('transactions').upsert(rows, { onConflict: 'id' });
      if (txError) {
        throw new Error(`Failed to sync transactions: ${txError.message}`);
      }
      txCount = rows.length;
    }

    if (Array.isArray(localLogs) && localLogs.length > 0) {
      const logRows = localLogs.map((log: any) => ({
        id: log.id,
        to_email: log.to || '',
        from_email: log.from || '',
        subject: log.subject || '',
        type: log.type || 'bot_mail',
        status: log.status || 'delivered',
        details: log.details || '',
        created_at: log.timestamp || new Date().toISOString(),
      }));

      const { error: logError } = await client.from('email_logs').upsert(logRows, { onConflict: 'id' });
      if (logError) {
        console.warn('[Supabase] Warning syncing logs:', logError.message);
      } else {
        logCount = logRows.length;
      }
    }

    return { syncedTransactions: txCount, syncedLogs: logCount };
  } catch (err: any) {
    return { syncedTransactions: txCount, syncedLogs: logCount, error: err.message || 'Sync failed' };
  }
}

export function updateSupabaseConfigInEnv(
  url: string,
  anonKey: string,
  serviceRoleKey?: string
): boolean {
  try {
    let content = '';
    if (fs.existsSync(envFilePath)) {
      content = fs.readFileSync(envFilePath, 'utf-8');
    }

    // Helper to replace or append
    const setOrAppend = (key: string, val: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${val}`);
      } else {
        content += `\n${key}=${val}`;
      }
    };

    setOrAppend('SUPABASE_URL', url.trim());
    setOrAppend('SUPABASE_ANON_KEY', anonKey.trim());
    if (serviceRoleKey !== undefined) {
      setOrAppend('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey.trim());
    }

    fs.writeFileSync(envFilePath, content.trim() + '\n', 'utf-8');

    // Update runtime process.env
    process.env.SUPABASE_URL = url.trim();
    process.env.SUPABASE_ANON_KEY = anonKey.trim();
    if (serviceRoleKey !== undefined) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey.trim();
    }

    // Reset cached client to force re-instantiation
    cachedClient = null;
    return true;
  } catch (err) {
    console.error('Failed to update Supabase config in .env:', err);
    return false;
  }
}
