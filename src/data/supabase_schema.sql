-- ==============================================================================
-- Cya Bot - Supabase Database Schema
-- Run this in your Supabase Project's SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Enable UUID Extension (optional, useful for unique IDs)
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

-- Index for fast lookup by status, email, and server_id
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_email ON public.transactions(email);
CREATE INDEX IF NOT EXISTS idx_transactions_server_id ON public.transactions(server_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 3. Email Logs Table (Audit trail for purchase confirmations, verified, and denial notices)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    from_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL, -- 'purchase_confirmation', 'payment_verified', 'payment_denied', 'bot_mail', 'test'
    status TEXT NOT NULL DEFAULT 'delivered', -- 'delivered', 'simulated', 'failed'
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(type);

-- 4. Bot Stats Table (Hourly synced metrics from Discord Bot)
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

-- 5. Featured Servers Table
CREATE TABLE IF NOT EXISTS public.featured_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    members INTEGER DEFAULT 0,
    icon TEXT,
    invite_url TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_servers ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- Allow public read access to bot_stats and featured_servers
DROP POLICY IF EXISTS "Public can view bot stats" ON public.bot_stats;
CREATE POLICY "Public can view bot stats" ON public.bot_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view featured servers" ON public.featured_servers;
CREATE POLICY "Public can view featured servers" ON public.featured_servers FOR SELECT USING (true);

-- Allow service role and anon key access (configured via server API)
DROP POLICY IF EXISTS "Full access to service role for transactions" ON public.transactions;
CREATE POLICY "Full access to service role for transactions" ON public.transactions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access to service role for email_logs" ON public.email_logs;
CREATE POLICY "Full access to service role for email_logs" ON public.email_logs
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access to service role for bot_stats" ON public.bot_stats;
CREATE POLICY "Full access to service role for bot_stats" ON public.bot_stats
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access to service role for featured_servers" ON public.featured_servers;
CREATE POLICY "Full access to service role for featured_servers" ON public.featured_servers
    FOR ALL USING (true) WITH CHECK (true);
