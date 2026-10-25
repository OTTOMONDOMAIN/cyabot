import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Save,
  Server,
  Table,
  UploadCloud,
  FileCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  url: string;
  hasAnonKey: boolean;
  hasServiceKey: boolean;
  source?: 'process_env' | 'dotenv_file' | 'none';
  message: string;
  latencyMs?: number;
}

interface SupabasePanelProps {
  token: string;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

const SUPABASE_SCHEMA_SQL = `-- Cya Bot - Supabase Database Schema
-- Run this in your Supabase Project's SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Transactions Table (Billing, Payments, Subscriptions)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    plan_name TEXT NOT NULL,
    amount TEXT NOT NULL,
    billing_cycle TEXT DEFAULT 'per month',
    payment_method TEXT NOT NULL,
    phone_number TEXT,
    discord_tag TEXT,
    server_id TEXT,
    trx_id TEXT,
    email TEXT,
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    denial_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_email ON public.transactions(email);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 3. Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    from_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'delivered',
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- 4. Bot Stats Table
CREATE TABLE IF NOT EXISTS public.bot_stats (
    id TEXT PRIMARY KEY DEFAULT 'current',
    status TEXT DEFAULT 'online',
    servers INTEGER DEFAULT 0,
    users INTEGER DEFAULT 0,
    commands INTEGER DEFAULT 45,
    shards INTEGER DEFAULT 1,
    latency INTEGER DEFAULT 15,
    bot_tag TEXT,
    bot_id TEXT,
    uptime BIGINT DEFAULT 0,
    commands_per_min INTEGER DEFAULT 0,
    cpu_percent NUMERIC(5,2) DEFAULT 0,
    memory_usage_mb NUMERIC(7,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security & Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full access to service role for transactions" ON public.transactions;
CREATE POLICY "Full access to service role for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access to service role for email_logs" ON public.email_logs;
CREATE POLICY "Full access to service role for email_logs" ON public.email_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view bot stats" ON public.bot_stats;
CREATE POLICY "Public can view bot stats" ON public.bot_stats FOR SELECT USING (true);`;

export const SupabasePanel: React.FC<SupabasePanelProps> = ({ token, onShowToast }) => {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form states
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  // Fetch status on mount
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/supabase/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.url) setUrl(data.url);
      }
    } catch (err) {
      console.error('Failed to fetch Supabase status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/supabase/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`Supabase Connected! ${data.message || ''}`, 'success');
        fetchStatus();
      } else {
        onShowToast(`Supabase Test Failed: ${data.message || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      onShowToast(`Connection Error: ${err.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      onShowToast('Please provide a valid Supabase Project URL', 'error');
      return;
    }
    if (!anonKey.trim() && !serviceRoleKey.trim()) {
      onShowToast('Please provide either an Anon Key or Service Role Key', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/supabase/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: url.trim(),
          anonKey: anonKey.trim(),
          serviceRoleKey: serviceRoleKey.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast('Supabase configuration saved & verified!', 'success');
        setAnonKey('');
        setServiceRoleKey('');
        fetchStatus();
      } else {
        onShowToast(`Failed to save: ${data.error || data.message || 'Unknown error'}`, 'error');
      }
    } catch (err: any) {
      onShowToast(`Save Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/supabase/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(
          `Sync Complete! Pushed ${data.syncedTransactions} transactions & ${data.syncedLogs} logs to Supabase.`,
          'success'
        );
      } else {
        onShowToast(`Sync Failed: ${data.error || 'Check table schema'}`, 'error');
      }
    } catch (err: any) {
      onShowToast(`Sync Error: ${err.message}`, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    onShowToast('Supabase SQL Schema copied to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-gray-900/60 to-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">Supabase Cloud Database</h2>
                {loading ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 animate-pulse">
                    Checking...
                  </span>
                ) : status?.connected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Connected ({status.latencyMs || 15}ms)
                  </span>
                ) : status?.configured ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Unreachable / Schema Needed
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                    Not Configured
                  </span>
                )}
                {status?.source && status.source !== 'none' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Loaded from .env
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                Real-time PostgreSQL persistence for Cya Bot billing transactions, customer records, audit email logs, and bot metrics. All credentials are read directly from your <code>.env</code> file.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
              title="Refresh connection status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing || !status?.configured}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 transition-all text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className={`w-3.5 h-3.5 ${testing ? 'animate-bounce' : ''}`} />
              {testing ? 'Pinging...' : 'Test Ping'}
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 transition-all text-xs font-semibold flex items-center gap-1.5"
            >
              Supabase Dashboard
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </a>
          </div>
        </div>

        {/* Diagnostic Status Message */}
        {status?.message && (
          <div className="mt-4 pt-4 border-t border-gray-800/80 flex items-start gap-2.5 text-xs text-gray-300">
            {status.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold text-white">Status Report: </span>
              {status.message}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Setup Credentials & Fast Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Credentials Form */}
        <div className="lg:col-span-7 bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Supabase Credentials</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="text-xs text-gray-400 hover:text-gray-200 underline"
            >
              {showKeys ? 'Hide Keys' : 'Reveal Keys'}
            </button>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full bg-gray-950/80 border border-gray-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-colors"
                required
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Found in your Supabase project under <strong>Settings → API → Project URL</strong>.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Supabase Anon Key (Public)
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder={status?.hasAnonKey ? '•••••••••••••••••••••••• (configured)' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}
                className="w-full bg-gray-950/80 border border-gray-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none font-mono transition-colors"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                API Key tagged as <code>anon</code> / <code>public</code>. Leave blank to keep existing.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Service Role Key (Secret / Optional)
              </label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={serviceRoleKey}
                onChange={(e) => setServiceRoleKey(e.target.value)}
                placeholder={status?.hasServiceKey ? '•••••••••••••••••••••••• (configured)' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'}
                className="w-full bg-gray-950/80 border border-gray-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none font-mono transition-colors"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Optional: Grants elevated backend permissions to bypass RLS policies during server queries.
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save & Connect Supabase'}
              </button>
            </div>
          </form>
        </div>

        {/* Sync & Instructions Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Migration / Sync Action */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 mb-3">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Sync Local Data to Supabase</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Push all existing local billing transactions, email audit logs, and bot configuration directly into your Supabase PostgreSQL tables.
            </p>

            <button
              onClick={handleSyncData}
              disabled={syncing || !status?.connected}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700/80 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-all text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <UploadCloud className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
              {syncing ? 'Syncing to Supabase...' : 'Run Data Sync Now'}
            </button>
            {!status?.connected && (
              <span className="text-[11px] text-amber-400/90 mt-2 block text-center">
                Connect and create Supabase tables first to enable sync.
              </span>
            )}
          </div>

          {/* Quick Steps */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              How It Works
            </h4>
            <ol className="text-xs text-gray-300 space-y-2.5 list-decimal list-inside leading-relaxed">
              <li>
                <span className="font-medium text-white">Create project:</span> Head to Supabase and create a new free PostgreSQL project.
              </li>
              <li>
                <span className="font-medium text-white">Run Schema:</span> Copy the SQL script below and paste into Supabase SQL Editor.
              </li>
              <li>
                <span className="font-medium text-white">Save Keys:</span> Paste your Project URL & Anon Key into the form on the left.
              </li>
              <li>
                <span className="font-medium text-white">Zero Downtime:</span> If Supabase is offline or not configured, Cya Bot automatically falls back to local storage without interruption.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* SQL Migration Script Box */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">Supabase SQL Schema Migration</h3>
              <p className="text-xs text-gray-400">
                Run this once in your Supabase SQL Editor to create <code>transactions</code>, <code>email_logs</code>, and <code>bot_stats</code>.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopySql}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy SQL Script
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="bg-gray-950 border border-gray-800/90 rounded-xl p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-80 leading-relaxed selection:bg-emerald-500/30 selection:text-white">
            {SUPABASE_SCHEMA_SQL}
          </pre>
        </div>
      </div>
    </div>
  );
};
