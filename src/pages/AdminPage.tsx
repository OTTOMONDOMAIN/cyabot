import React, { useState, useEffect } from 'react';

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
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'transactions' | 'qr-settings'>('transactions');

  // Per-Method QR Settings State
  const [editingMethod, setEditingMethod] = useState<'EasyPaisa' | 'JazzCash' | 'Crypto'>('EasyPaisa');
  const [allSettings, setAllSettings] = useState<AllPaymentSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

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
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions(token);
      fetchPaymentSettings();
      const interval = setInterval(() => fetchTransactions(token), 8000);
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
      }
    } catch (e) {
      console.error(e);
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
      }
    } catch (e) {
      console.error(e);
    }
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
        setSettingsSavedMsg(`${editingMethod} QR & account settings saved!`);
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
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1>Cya Admin Portal</h1>
          <p>Restricted access. Sign in with your administrator credentials to manage billing transactions.</p>

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
              {loggingIn ? 'Authenticating...' : 'Sign In to Transaction Panel'}
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
        {/* Top Bar (No admin email shown) */}
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">Protected Administrator Console</span>
            <h1>Cya Transaction &amp; Billing Panel</h1>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className={`admin-tab-switch ${activeSection === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveSection('transactions')}
            >
              Transactions ({transactions.length})
            </button>
            <button
              type="button"
              className={`admin-tab-switch ${activeSection === 'qr-settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('qr-settings')}
            >
              Method QR Setup
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
              className="admin-logout-btn"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Summary KPI Strip */}
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <span>Total Submissions</span>
            <strong>{transactions.length}</strong>
          </div>
          <div className="admin-kpi-card warning">
            <span>Awaiting Verification</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="admin-kpi-card success">
            <span>Verified Payments</span>
            <strong>{verifiedCount}</strong>
          </div>
          <div className="admin-kpi-card cyan">
            <span>Verified Revenue</span>
            <strong>{totalRevenue} Rs</strong>
          </div>
        </div>

        {activeSection === 'qr-settings' ? (
          <section className="admin-settings-panel">
            <h2>Payment Method QR Codes &amp; Account Setup</h2>
            <p className="settings-desc">
              Each payment method has its own dedicated QR code and merchant details. Select a payment method below to upload its QR code or update its account details.
            </p>

            {/* Method Selector Pills */}
            <div className="status-filter-pills" style={{ marginBottom: '22px' }}>
              {(['EasyPaisa', 'JazzCash', 'Crypto'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`filter-pill ${editingMethod === m ? 'active' : ''}`}
                  onClick={() => setEditingMethod(m)}
                >
                  {m === 'Crypto' ? 'Crypto (USDT / Binance)' : m} QR Setup
                </button>
              ))}
            </div>

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
                    <span>No Custom {editingMethod} QR Set (Using {editingMethod} Placeholder)</span>
                  )}
                </div>

                <div className="admin-qr-inputs">
                  <div className="admin-field">
                    <label>Upload {editingMethod} QR Image From Device</label>
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
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
                    Reset {editingMethod} QR to Placeholder
                  </button>
                )}
              </div>
            </form>
          </section>
        ) : (
          <section className="admin-transactions-section">
            {/* Filter & Search Bar */}
            <div className="admin-filter-bar">
              <div className="status-filter-pills">
                {(['all', 'pending', 'verified', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`filter-pill ${filterStatus === st ? 'active' : ''}`}
                    onClick={() => setFilterStatus(st)}
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>

              <input
                type="search"
                className="admin-search-input"
                placeholder="Search by phone number, method, Discord user, or TXN ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Transactions Table */}
            <div className="admin-table-wrapper">
              {filteredTransactions.length === 0 ? (
                <div className="admin-empty-state">
                  <p>No transactions match the current filter.</p>
                </div>
              ) : (
                <table className="admin-tx-table">
                  <thead>
                    <tr>
                      <th>TXN ID &amp; Date</th>
                      <th>Plan &amp; Amount</th>
                      <th>Method</th>
                      <th>Sender Number / Wallet</th>
                      <th>Discord / TID</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Verify Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <code className="tx-id-code">{tx.id}</code>
                          <div className="tx-date">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: '#fff', display: 'block' }}>{tx.planName}</strong>
                          <span style={{ color: '#22d3ee', fontSize: '13px', fontWeight: 700 }}>
                            {tx.amount} ({tx.billingCycle})
                          </span>
                        </td>
                        <td>
                          <span className="method-badge">{tx.paymentMethod}</span>
                        </td>
                        <td>
                          <div className="phone-cell">
                            <strong>{tx.phoneNumber}</strong>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px', color: '#e2e8f0' }}>
                            {tx.discordTag || '—'}
                          </div>
                          {tx.trxId && (
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              Ref: {tx.trxId}
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
                              >
                                ✓ Verify
                              </button>
                            )}
                            {tx.status !== 'rejected' && (
                              <button
                                type="button"
                                className="action-btn reject"
                                onClick={() => handleUpdateStatus(tx.id, 'rejected')}
                              >
                                Reject
                              </button>
                            )}
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
    </div>
  );
};
