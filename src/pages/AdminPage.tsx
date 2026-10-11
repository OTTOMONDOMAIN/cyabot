import React, { useState, useEffect } from 'react';
import { downloadReceiptImage, ReceiptData } from '../utils/receiptGenerator';

interface MethodPaymentConfig {
  qrCodeUrl: string;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
}

interface AllPaymentSettings {
  EasyPaisa: MethodPaymentConfig;
  JazzCash: MethodPaymentConfig;
  Crypto: MethodPaymentConfig;
}

const DEFAULT_SETTINGS: AllPaymentSettings = {
  EasyPaisa: {
    qrCodeUrl: '',
    accountTitle: 'Cya Bot Official',
    accountNumber: '03XX-XXXXXXX',
    instructions: 'Scan the EasyPaisa QR code using your EasyPaisa app, enter your EasyPaisa mobile number below, and click Done after sending.',
  },
  JazzCash: {
    qrCodeUrl: '',
    accountTitle: 'Cya Bot Official',
    accountNumber: '03XX-XXXXXXX',
    instructions: 'Scan the JazzCash QR code using your JazzCash app, enter your JazzCash mobile number below, and click Done after sending.',
  },
  Crypto: {
    qrCodeUrl: '',
    accountTitle: 'Binance Pay / USDT (TRC20)',
    accountNumber: 'TXYZ...USDT_WALLET_OR_BINANCE_ID',
    instructions: 'Scan the Binance Pay / USDT QR code, enter your Sender UID or Contact number below, and click Done after sending.',
  },
};

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [token, setToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('cya_admin_token') || '';
    }
    return '';
  });

  // Login Form State
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard State
  const [transactions, setTransactions] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | 'EasyPaisa' | 'JazzCash' | 'Crypto'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'transactions' | 'qr-settings' | 'bot-stats'>('transactions');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedTxModal, setSelectedTxModal] = useState<ReceiptData | null>(null);

  // Bot Live Stats State
  const [botServers, setBotServers] = useState<number>(1);
  const [botUsers, setBotUsers] = useState<number>(1);
  const [botCommands, setBotCommands] = useState<number>(45);
  const [botShards, setBotShards] = useState<number>(1);
  const [botTokenInput, setBotTokenInput] = useState<string>('');
  const [botSyncMsg, setBotSyncMsg] = useState<string>('');

  // Per-Method QR Settings State
  const [editingMethod, setEditingMethod] = useState<'EasyPaisa' | 'JazzCash' | 'Crypto'>('EasyPaisa');
  const [allSettings, setAllSettings] = useState<AllPaymentSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  const handleCopy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(`${label}:${val}`);
    setTimeout(() => setCopiedText(null), 1600);
  };

  const fetchTransactions = async (authToken = token) => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch('/api/payment-settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.EasyPaisa) {
          setAllSettings({
            EasyPaisa: { ...DEFAULT_SETTINGS.EasyPaisa, ...data.EasyPaisa },
            JazzCash: { ...DEFAULT_SETTINGS.JazzCash, ...data.JazzCash },
            Crypto: { ...DEFAULT_SETTINGS.Crypto, ...data.Crypto },
          });
        }
      }
      const stRes = await fetch('/api/status');
      if (stRes.ok) {
        const stData = await stRes.json();
        setBotServers(stData.servers ?? 1);
        setBotUsers(stData.users ?? 1);
        setBotCommands(stData.commands ?? 45);
        setBotShards(stData.shards ?? 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBotStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setBotSyncMsg('');
    try {
      const payload: any = {
        servers: Number(botServers),
        users: Number(botUsers),
        commands: Number(botCommands),
        shards: Number(botShards),
      };
      if (botTokenInput.trim()) {
        payload.botToken = botTokenInput.trim();
        delete payload.servers;
        delete payload.users;
      }
      const res = await fetch('/api/bot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setBotServers(data.status.servers ?? botServers);
          setBotUsers(data.status.users ?? botUsers);
          setBotCommands(data.status.commands ?? botCommands);
          setBotShards(data.status.shards ?? botShards);
        }
        setBotSyncMsg(
          data.discordApiSynced
            ? '✓ Synced live Guilds & Users directly from Discord API!'
            : '✓ Live Guilds & Active Users updated across Home & Status pages!'
        );
        setTimeout(() => setBotSyncMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions(token);
      fetchPaymentSettings();
      const interval = setInterval(() => fetchTransactions(token), 6000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adminId, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        sessionStorage.setItem('cya_admin_token', data.token);
        setToken(data.token);
        fetchTransactions(data.token);
      } else {
        setLoginError(data.error || 'Invalid credentials. Access denied.');
      }
    } catch (err) {
      setLoginError('Network error while authenticating.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cya_admin_token');
    setToken('');
    setAdminId('');
    setPassword('');
  };

  const handleUpdateStatus = async (id: string, status: 'pending' | 'verified' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? { ...tx, status } : tx))
        );
        if (selectedTxModal?.id === id) {
          setSelectedTxModal((prev) => (prev ? { ...prev, status } : null));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyAllPending = async () => {
    const pendingList = transactions.filter((t) => t.status === 'pending');
    for (const tx of pendingList) {
      await handleUpdateStatus(tx.id, 'verified');
    }
  };

  const handleDeleteTx = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTransactions((prev) => prev.filter((tx) => tx.id !== id));
        if (selectedTxModal?.id === id) setSelectedTxModal(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Date', 'Plan', 'Amount', 'Cycle', 'Method', 'Phone/Wallet', 'Discord', 'TID', 'Status'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      new Date(t.createdAt).toISOString(),
      t.planName,
      t.amount,
      t.billingCycle,
      t.paymentMethod,
      t.phoneNumber,
      t.discordTag || '',
      t.trxId || '',
      t.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cya-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentConfig = allSettings[editingMethod];

  const updateCurrentMethodField = (field: keyof MethodPaymentConfig, value: string) => {
    setAllSettings((prev) => ({
      ...prev,
      [editingMethod]: {
        ...prev[editingMethod],
        [field]: value,
      },
    }));
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateCurrentMethodField('qrCodeUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSavedMsg('');
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(allSettings),
      });
      if (res.ok) {
        setSettingsSavedMsg(`${editingMethod} QR & account settings saved successfully!`);
        setTimeout(() => setSettingsSavedMsg(''), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered Transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
    if (filterMethod !== 'all' && tx.paymentMethod !== filterMethod) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.phoneNumber.toLowerCase().includes(q) ||
        (tx.discordTag || '').toLowerCase().includes(q) ||
        tx.planName.toLowerCase().includes(q) ||
        (tx.trxId || '').toLowerCase().includes(q) ||
        tx.paymentMethod.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const verifiedCount = transactions.filter((t) => t.status === 'verified').length;
  const rejectedCount = transactions.filter((t) => t.status === 'rejected').length;
  const totalRevenue = transactions
    .filter((t) => t.status === 'verified')
    .reduce((acc, t) => {
      const num = parseInt(t.amount.replace(/[^0-9]/g, ''), 10);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);

  // If NOT authenticated, show the Admin Login Screen (NO email shown!)
  if (!token) {
    return (
      <div className="cya-admin-login-shell">
        <div className="cya-admin-login-card">
          <div className="admin-lock-badge">
            <img
              src="https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=1024"
              alt="cya"
              style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'cover' }}
              referrerPolicy="no-referrer"
            />
          </div>
          <h1>Cya Admin Control Center</h1>
          <p>Restricted portal. Enter your administrator credentials to manage billing &amp; verify payments.</p>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="admin-field">
              <label htmlFor="admin-id">Admin ID</label>
              <input
                id="admin-id"
                type="text"
                placeholder="Enter Admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="admin-field">
              <label htmlFor="admin-pass">Password</label>
              <input
                id="admin-pass"
                type="password"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {loginError && <div className="admin-error-alert">{loginError}</div>}

            <button type="submit" className="admin-login-btn" disabled={loggingIn}>
              {loggingIn ? 'Authenticating...' : 'Unlock Transaction Panel'}
            </button>
          </form>

          <button
            type="button"
            className="admin-return-home"
            onClick={() => onNavigate('/')}
          >
            ← Return to Public Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cya-admin-dashboard">
      <div className="admin-container">
        {/* Sleek Command-Center Header */}
        <header className="admin-topbar">
          <div className="admin-brand-left">
            <img
              src="https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=1024"
              alt="cya"
              className="admin-header-avatar"
              referrerPolicy="no-referrer"
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="admin-eyebrow">Cya Billing &amp; Verification Console</span>
                <span className="admin-live-dot" title="Auto-syncing every 6 seconds">● Live Sync</span>
              </div>
              <h1>Transaction Management</h1>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className={`admin-tab-switch ${activeSection === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveSection('transactions')}
            >
              <span>📋 Transactions</span>
              {pendingCount > 0 && <span className="pending-count-bubble">{pendingCount}</span>}
            </button>
            <button
              type="button"
              className={`admin-tab-switch ${activeSection === 'qr-settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('qr-settings')}
            >
              <span>📲 QR &amp; Gateways</span>
            </button>
            <button
              type="button"
              className={`admin-tab-switch ${activeSection === 'bot-stats' ? 'active' : ''}`}
              onClick={() => setActiveSection('bot-stats')}
            >
              <span>🤖 Bot Live Stats</span>
            </button>
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={() => fetchTransactions()}
              disabled={loading}
            >
              ↻ {loading ? 'Syncing...' : 'Refresh'}
            </button>
            <button
              type="button"
              className="admin-refresh-btn"
              onClick={() => onNavigate('/billing')}
            >
              ↗ View Billing Page
            </button>
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
            >
              Lock Panel
            </button>
          </div>
        </header>

        {/* Summary KPI Strip with Quick Action */}
        <div className="admin-kpi-grid">
          <div
            className={`admin-kpi-card clickable ${filterStatus === 'all' ? 'selected-kpi' : ''}`}
            onClick={() => {
              setActiveSection('transactions');
              setFilterStatus('all');
            }}
          >
            <div className="kpi-top-row">
              <span>Total Submissions</span>
              <small style={{ color: '#64748b' }}>All Gateways</small>
            </div>
            <strong>{transactions.length}</strong>
            <div className="kpi-sub">Click to view all records</div>
          </div>

          <div
            className={`admin-kpi-card warning clickable ${filterStatus === 'pending' ? 'selected-kpi' : ''}`}
            onClick={() => {
              setActiveSection('transactions');
              setFilterStatus('pending');
            }}
          >
            <div className="kpi-top-row">
              <span>Pending Verification</span>
              {pendingCount > 0 && (
                <button
                  type="button"
                  className="verify-all-mini-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVerifyAllPending();
                  }}
                >
                  ✓ Verify All ({pendingCount})
                </button>
              )}
            </div>
            <strong>{pendingCount}</strong>
            <div className="kpi-sub">Needs admin approval</div>
          </div>

          <div
            className={`admin-kpi-card success clickable ${filterStatus === 'verified' ? 'selected-kpi' : ''}`}
            onClick={() => {
              setActiveSection('transactions');
              setFilterStatus('verified');
            }}
          >
            <div className="kpi-top-row">
              <span>Verified &amp; Approved</span>
              <small style={{ color: '#64748b' }}>{rejectedCount} Rejected</small>
            </div>
            <strong>{verifiedCount}</strong>
            <div className="kpi-sub">Active subscriptions</div>
          </div>

          <div className="admin-kpi-card cyan">
            <div className="kpi-top-row">
              <span>Verified Revenue</span>
              <small style={{ color: '#22d3ee' }}>PKR</small>
            </div>
            <strong>{totalRevenue.toLocaleString()} Rs</strong>
            <div className="kpi-sub">From {verifiedCount} verified payments</div>
          </div>
        </div>

        {activeSection === 'qr-settings' ? (
          <section className="admin-settings-panel">
            <div className="settings-header-flex">
              <div>
                <h2>Payment Method QR Codes &amp; Account Setup</h2>
                <p className="settings-desc" style={{ marginBottom: 0 }}>
                  Configure separate QR codes and receiver details for <strong>EasyPaisa</strong>, <strong>JazzCash</strong>, and <strong>Crypto (USDT)</strong>.
                </p>
              </div>
              <div className="status-filter-pills">
                {(['EasyPaisa', 'JazzCash', 'Crypto'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`filter-pill ${editingMethod === m ? 'active' : ''}`}
                    onClick={() => setEditingMethod(m)}
                  >
                    {m === 'Crypto' ? 'Crypto (USDT)' : m}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '20px 0' }} />

            <form onSubmit={handleSavePaymentSettings} className="admin-qr-form">
              <div className="admin-qr-preview-row">
                <div className="admin-qr-box">
                  {currentConfig.qrCodeUrl ? (
                    <img
                      src={currentConfig.qrCodeUrl}
                      alt={`${editingMethod} QR Preview`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>No Custom {editingMethod} QR Uploaded</span>
                  )}
                </div>

                <div className="admin-qr-inputs">
                  <div className="admin-field">
                    <label>Upload {editingMethod} QR Image From Computer / Phone</label>
                    <input type="file" accept="image/*" onChange={handleQrFileUpload} />
                  </div>
                  <div className="admin-field">
                    <label>Or Paste Direct {editingMethod} QR Image URL</label>
                    <input
                      type="text"
                      placeholder={`https://example.com/${editingMethod.toLowerCase()}-qr.png`}
                      value={currentConfig.qrCodeUrl}
                      onChange={(e) => updateCurrentMethodField('qrCodeUrl', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>
                    {editingMethod === 'Crypto' ? 'Network / Platform Title' : `${editingMethod} Account Title`}
                  </label>
                  <input
                    type="text"
                    value={currentConfig.accountTitle}
                    onChange={(e) => updateCurrentMethodField('accountTitle', e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <label>
                    {editingMethod === 'Crypto'
                      ? 'USDT Wallet Address / Binance Pay ID'
                      : `${editingMethod} Account Number`}
                  </label>
                  <input
                    type="text"
                    value={currentConfig.accountNumber}
                    onChange={(e) => updateCurrentMethodField('accountNumber', e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-field">
                <label>{editingMethod} Checkout Instructions</label>
                <input
                  type="text"
                  value={currentConfig.instructions}
                  onChange={(e) => updateCurrentMethodField('instructions', e.target.value)}
                />
              </div>

              {settingsSavedMsg && <div className="admin-save-toast">{settingsSavedMsg}</div>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="admin-login-btn"
                  style={{ width: 'auto', padding: '12px 28px' }}
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Saving...' : `Save ${editingMethod} QR & Settings`}
                </button>
                {currentConfig.qrCodeUrl && (
                  <button
                    type="button"
                    className="admin-logout-btn"
                    onClick={() => updateCurrentMethodField('qrCodeUrl', '')}
                  >
                    Clear {editingMethod} QR
                  </button>
                )}
              </div>
            </form>
          </section>
        ) : activeSection === 'bot-stats' ? (
          <section className="admin-settings-panel">
            <h2>Live Bot Guilds &amp; Active Users Sync</h2>
            <p className="settings-desc">
              Set your exact real Guild (Server) and Active User counts, or paste your full Discord Bot Token to pull live guild &amp; member counts directly from Discord's API.
            </p>

            <form onSubmit={handleSaveBotStats} className="admin-qr-form">
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Active Guilds (Servers)</label>
                  <input
                    type="number"
                    min={0}
                    value={botServers}
                    onChange={(e) => setBotServers(Number(e.target.value))}
                  />
                </div>
                <div className="admin-field">
                  <label>Active Users (Total Members)</label>
                  <input
                    type="number"
                    min={0}
                    value={botUsers}
                    onChange={(e) => setBotUsers(Number(e.target.value))}
                  />
                </div>
                <div className="admin-field">
                  <label>Active Commands Count</label>
                  <input
                    type="number"
                    min={1}
                    value={botCommands}
                    onChange={(e) => setBotCommands(Number(e.target.value))}
                  />
                </div>
                <div className="admin-field">
                  <label>Active Shards</label>
                  <input
                    type="number"
                    min={1}
                    value={botShards}
                    onChange={(e) => setBotShards(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="admin-field" style={{ marginTop: '8px' }}>
                <label>Optional: Full Discord Bot Token (Auto-Fetches Guilds &amp; Users from Discord API)</label>
                <input
                  type="password"
                  placeholder="Paste full 72-character Discord Bot Token to auto-sync from Discord API..."
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                />
              </div>

              {botSyncMsg && <div className="admin-save-toast">{botSyncMsg}</div>}

              <div>
                <button
                  type="submit"
                  className="admin-login-btn"
                  style={{ width: 'auto', padding: '12px 28px' }}
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Syncing...' : 'Update Live Guilds & Users Now'}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="admin-transactions-section">
            {/* Multi-Filter & Search Toolbar */}
            <div className="admin-filter-bar">
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="status-filter-pills">
                  {(['all', 'pending', 'verified', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`filter-pill ${filterStatus === st ? 'active' : ''}`}
                      onClick={() => setFilterStatus(st)}
                    >
                      {st === 'all'
                        ? `All (${transactions.length})`
                        : st === 'pending'
                        ? `Pending (${pendingCount})`
                        : st === 'verified'
                        ? `Verified (${verifiedCount})`
                        : `Rejected (${rejectedCount})`}
                    </button>
                  ))}
                </div>

                <select
                  className="admin-method-select"
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value as any)}
                >
                  <option value="all">All Gateways</option>
                  <option value="EasyPaisa">EasyPaisa Only</option>
                  <option value="JazzCash">JazzCash Only</option>
                  <option value="Crypto">Crypto Only</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="search"
                  className="admin-search-input"
                  placeholder="Search phone, Discord, TID, or TXN ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="admin-refresh-btn"
                  onClick={handleExportCsv}
                  title="Export filtered transactions to CSV"
                >
                  ⬇ Export CSV
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="admin-table-wrapper">
              {filteredTransactions.length === 0 ? (
                <div className="admin-empty-state">
                  <p>No transactions match your current filter criteria.</p>
                </div>
              ) : (
                <table className="admin-tx-table">
                  <thead>
                    <tr>
                      <th>Receipt ID &amp; Time</th>
                      <th>Plan &amp; Price</th>
                      <th>Gateway</th>
                      <th>Sender Number (Click to Copy)</th>
                      <th>Discord / Reference</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Quick Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className={tx.status === 'pending' ? 'pending-highlight-row' : ''}>
                        <td>
                          <button
                            type="button"
                            className="copyable-chip"
                            onClick={() => handleCopy(tx.id, 'id')}
                            title="Click to copy Receipt ID"
                          >
                            <code className="tx-id-code">{tx.id}</code>
                            <span className="copy-hint">
                              {copiedText === `id:${tx.id}` ? '✓ Copied' : '📋'}
                            </span>
                          </button>
                          <div className="tx-date">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: '#fff', display: 'block', fontSize: '14px' }}>{tx.planName}</strong>
                          <span style={{ color: '#22d3ee', fontSize: '13px', fontWeight: 700 }}>
                            {tx.amount} <small style={{ color: '#94a3b8', fontWeight: 500 }}>({tx.billingCycle})</small>
                          </span>
                        </td>
                        <td>
                          <span
                            className="method-badge"
                            style={
                              tx.paymentMethod === 'JazzCash'
                                ? { background: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24' }
                                : tx.paymentMethod === 'Crypto'
                                ? { background: 'rgba(6, 182, 212, 0.16)', color: '#22d3ee' }
                                : undefined
                            }
                          >
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="copyable-chip phone-chip"
                            onClick={() => handleCopy(tx.phoneNumber, 'phone')}
                            title="Click to copy Sender Phone/Wallet"
                          >
                            <strong>{tx.phoneNumber}</strong>
                            <span className="copy-hint">
                              {copiedText === `phone:${tx.phoneNumber}` ? '✓ Copied!' : 'Copy'}
                            </span>
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>
                              {tx.discordTag || '—'}
                            </span>
                            {tx.discordTag && tx.discordTag !== 'Not specified' && (
                              <button
                                type="button"
                                className="mini-copy-icon"
                                onClick={() => handleCopy(tx.discordTag!, 'dc')}
                                title="Copy Discord tag"
                              >
                                {copiedText === `dc:${tx.discordTag}` ? '✓' : '📋'}
                              </button>
                            )}
                          </div>
                          {tx.trxId && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              TID: {tx.trxId}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`tx-status-pill ${tx.status}`}>
                            {tx.status === 'verified'
                              ? '✓ Verified'
                              : tx.status === 'rejected'
                              ? '✕ Rejected'
                              : '● Pending'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="admin-row-actions">
                            {tx.status !== 'verified' && (
                              <button
                                type="button"
                                className="action-btn verify"
                                onClick={() => handleUpdateStatus(tx.id, 'verified')}
                                title="Approve & Verify Payment"
                              >
                                ✓ Verify
                              </button>
                            )}
                            {tx.status !== 'rejected' && (
                              <button
                                type="button"
                                className="action-btn reject"
                                onClick={() => handleUpdateStatus(tx.id, 'rejected')}
                                title="Reject Payment"
                              >
                                ✕ Reject
                              </button>
                            )}
                            {tx.status !== 'pending' && (
                              <button
                                type="button"
                                className="action-btn reset"
                                onClick={() => handleUpdateStatus(tx.id, 'pending')}
                                title="Move back to Pending"
                              >
                                ↺
                              </button>
                            )}
                            <button
                              type="button"
                              className="action-btn receipt"
                              onClick={() => setSelectedTxModal(tx)}
                              title="View / Download Official Receipt"
                            >
                              🧾 Receipt
                            </button>
                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() => handleDeleteTx(tx.id)}
                              title="Delete transaction"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Receipt Inspector Modal inside Admin Panel */}
      {selectedTxModal && (
        <div className="wise-modal-backdrop" onClick={() => setSelectedTxModal(null)}>
          <div className="wise-checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <button
              type="button"
              className="wise-modal-close"
              onClick={() => setSelectedTxModal(null)}
            >
              ✕
            </button>
            <span className="modal-eyebrow">Official Receipt Inspector</span>
            <h3 style={{ margin: '4px 0 16px', color: '#fff' }}>{selectedTxModal.id}</h3>

            <div className="verifying-details-box" style={{ marginBottom: '18px' }}>
              <div className="detail-row">
                <span>Date &amp; Time</span>
                <strong>{new Date(selectedTxModal.createdAt).toLocaleString()}</strong>
              </div>
              <div className="detail-row">
                <span>Plan &amp; Amount</span>
                <strong style={{ color: '#22d3ee' }}>
                  {selectedTxModal.planName} · {selectedTxModal.amount} ({selectedTxModal.billingCycle})
                </strong>
              </div>
              <div className="detail-row">
                <span>Payment Gateway</span>
                <strong>{selectedTxModal.paymentMethod}</strong>
              </div>
              <div className="detail-row">
                <span>Sender Number / Wallet</span>
                <strong>{selectedTxModal.phoneNumber}</strong>
              </div>
              <div className="detail-row">
                <span>Discord Account</span>
                <strong>{selectedTxModal.discordTag || 'Not specified'}</strong>
              </div>
              <div className="detail-row">
                <span>Gateway Reference</span>
                <strong>{selectedTxModal.trxId || 'Standard QR'}</strong>
              </div>
              <div className="detail-row">
                <span>Current Status</span>
                <span className={`tx-status-pill ${selectedTxModal.status}`}>
                  {selectedTxModal.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button
                type="button"
                className="download-receipt-btn"
                onClick={() => downloadReceiptImage(selectedTxModal)}
              >
                ⬇ Download Receipt Image (PNG)
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedTxModal.status !== 'verified' && (
                  <button
                    type="button"
                    className="action-btn verify"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => handleUpdateStatus(selectedTxModal.id, 'verified')}
                  >
                    ✓ Verify Payment Now
                  </button>
                )}
                {selectedTxModal.status !== 'rejected' && (
                  <button
                    type="button"
                    className="action-btn reject"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => handleUpdateStatus(selectedTxModal.id, 'rejected')}
                  >
                    ✕ Reject Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
