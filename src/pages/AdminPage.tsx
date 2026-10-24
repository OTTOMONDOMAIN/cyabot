import React, { useState, useEffect, useRef } from 'react';
import { downloadReceiptImage, ReceiptData } from '../utils/receiptGenerator';
import type { FeaturedServerItem } from '../types';
import fallbackFeatured from '../data/featured_servers.json';
import { MailSettingsPanel } from '../components/MailSettingsPanel';
import { DenialModal } from '../components/DenialModal';

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
  const [activeSection, setActiveSection] = useState<'transactions' | 'qr-settings' | 'bot-stats' | 'featured-servers' | 'mail-snippets'>('transactions');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedTxModal, setSelectedTxModal] = useState<ReceiptData | null>(null);

  // Denial Modal & Mail Feedback State
  const [denialModalTx, setDenialModalTx] = useState<ReceiptData | null>(null);
  const [denialReasonInput, setDenialReasonInput] = useState('Payment transaction ID could not be verified in payment gateway records.');
  const [mailActionToast, setMailActionToast] = useState('');
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);

  // Auto-Mail & Bot /mail Snippets State
  const [mailLogs, setMailLogs] = useState<any[]>([]);
  const [loadingMailLogs, setLoadingMailLogs] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<{
    host: string;
    port: number;
    secure: boolean;
    user: string;
    from: string;
    hasPass: boolean;
  } | null>(null);
  const [testMailRecipient, setTestMailRecipient] = useState('');
  const [sendingTestMail, setSendingTestMail] = useState(false);
  const [testMailMsg, setTestMailMsg] = useState('');
  const [snippetLanguage, setSnippetLanguage] = useState<'python' | 'javascript'>('python');
  const [customMailRecipient, setCustomMailRecipient] = useState('');
  const [customMailSubject, setCustomMailSubject] = useState('Official Notice from Cya Bot Team');
  const [customMailBody, setCustomMailBody] = useState('');
  const [sendingCustomMail, setSendingCustomMail] = useState(false);
  const [customMailMsg, setCustomMailMsg] = useState('');

  // SMTP Settings Form State
  const [editSmtpUser, setEditSmtpUser] = useState('cyabot@zohomail.com');
  const [editSmtpPass, setEditSmtpPass] = useState('');
  const [editSmtpHost, setEditSmtpHost] = useState('smtp.zoho.com');
  const [editSmtpPort, setEditSmtpPort] = useState(465);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpSavedMsg, setSmtpSavedMsg] = useState('');

  // Featured Servers & Widgets State
  const [featuredServers, setFeaturedServers] = useState<FeaturedServerItem[]>(fallbackFeatured as FeaturedServerItem[]);
  const [newWidgetOrIdInput, setNewWidgetOrIdInput] = useState('');
  const [newServerInviteInput, setNewServerInviteInput] = useState('');
  const [newServerNameInput, setNewServerNameInput] = useState('');
  const [newServerMembersInput, setNewServerMembersInput] = useState('');
  const [newServerIconInput, setNewServerIconInput] = useState('');
  const [resolvingFeatured, setResolvingFeatured] = useState(false);
  const [featuredSavedMsg, setFeaturedSavedMsg] = useState('');
  const [previewWidgetId, setPreviewWidgetId] = useState<string | null>('1508096258185887884');

  // Bot Live Stats State
  const [botServers, setBotServers] = useState<number>(1);
  const [botUsers, setBotUsers] = useState<number>(1);
  const [botCommands, setBotCommands] = useState<number>(45);
  const [botShards, setBotShards] = useState<number>(1);
  const [botTokenInput, setBotTokenInput] = useState<string>('');
  const [showTokenPassword, setShowTokenPassword] = useState<boolean>(false);
  const [botSyncMsg, setBotSyncMsg] = useState<string>('');

  // Per-Method QR Settings State
  const [editingMethod, setEditingMethod] = useState<'EasyPaisa' | 'JazzCash' | 'Crypto'>('EasyPaisa');
  const [allSettings, setAllSettings] = useState<AllPaymentSettings>(DEFAULT_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  // Real-Time DB Auto-Save & Hourly Discord Token Sync Status
  const [isDbAutoSaving, setIsDbAutoSaving] = useState(false);
  const [lastSavedDbTime, setLastSavedDbTime] = useState<string | null>(null);
  const [hourlySyncInfo, setHourlySyncInfo] = useState<{
    enabled: boolean;
    intervalHours: number;
    lastSyncTime: string | null;
    lastSyncSuccess: boolean;
    nextSyncTimestamp?: number;
    hasEnvToken: boolean;
  } | null>(null);

  const featuredLoadedRef = useRef(false);
  const paymentLoadedRef = useRef(false);

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
      paymentLoadedRef.current = true;

      const stRes = await fetch('/api/status');
      if (stRes.ok) {
        const stData = await stRes.json();
        setBotServers(stData.servers ?? 1);
        setBotUsers(stData.users ?? 1);
        setBotCommands(stData.commands ?? 45);
        setBotShards(stData.shards ?? 1);
        if (stData.hourlyAutoSync) {
          setHourlySyncInfo(stData.hourlyAutoSync);
        }
      }
      const featRes = await fetch('/api/featured-servers');
      if (featRes.ok) {
        const featData = await featRes.json();
        if (Array.isArray(featData.servers) && featData.servers.length > 0) {
          setFeaturedServers(featData.servers);
        }
      }
      featuredLoadedRef.current = true;
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddOrResolveFeaturedServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWidgetOrIdInput.trim()) return;
    setResolvingFeatured(true);
    setFeaturedSavedMsg('');
    try {
      const res = await fetch('/api/featured-servers/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetHtml: newWidgetOrIdInput.trim(),
          inviteUrl: newServerInviteInput.trim(),
          name: newServerNameInput.trim() || undefined,
          memberCount: newServerMembersInput ? Number(newServerMembersInput) : undefined,
          iconUrl: newServerIconInput.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.server) {
          const updatedList = [
            ...featuredServers.filter((s) => s.id !== data.server.id),
            data.server,
          ];
          setFeaturedServers(updatedList);
          await saveFeaturedServersList(updatedList, `✓ Added & auto-fetched "${data.server.name}" (${data.server.memberCount} members)!`);
          setNewWidgetOrIdInput('');
          setNewServerInviteInput('');
          setNewServerNameInput('');
          setNewServerMembersInput('');
          setNewServerIconInput('');
          setPreviewWidgetId(data.server.id);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setFeaturedSavedMsg(err.error || 'Could not resolve Discord Server ID.');
      }
    } catch {
      setFeaturedSavedMsg('Failed to resolve server widget.');
    } finally {
      setResolvingFeatured(false);
    }
  };

  const saveFeaturedServersList = async (listToSave = featuredServers, customToast?: string) => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/featured-servers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ servers: listToSave }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.servers)) {
          setFeaturedServers(data.servers);
        }
        setLastSavedDbTime(new Date().toLocaleTimeString());
        setFeaturedSavedMsg(customToast || '✓ Featured Communities saved to DB!');
        setTimeout(() => setFeaturedSavedMsg(''), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  // Debounced auto-save to DB whenever featuredServers is edited
  useEffect(() => {
    if (!featuredLoadedRef.current || !token) return;
    setIsDbAutoSaving(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/featured-servers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ servers: featuredServers }),
        });
        if (res.ok) {
          setLastSavedDbTime(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error('Featured servers DB autosave error:', err);
      } finally {
        setIsDbAutoSaving(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [featuredServers, token]);

  // Debounced auto-save to DB whenever QR & payment settings are edited
  useEffect(() => {
    if (!paymentLoadedRef.current || !token) return;
    setIsDbAutoSaving(true);
    const timer = setTimeout(async () => {
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
          setLastSavedDbTime(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error('Payment settings DB autosave error:', err);
      } finally {
        setIsDbAutoSaving(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [allSettings, token]);

  const handleUpdateFeaturedField = (id: string, field: keyof FeaturedServerItem, value: any) => {
    setFeaturedServers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveFeaturedServer = async (id: string) => {
    const next = featuredServers.filter((s) => s.id !== id);
    setFeaturedServers(next);
    await saveFeaturedServersList(next, '✓ Server removed from DB showcase.');
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
        setLastSavedDbTime(new Date().toLocaleTimeString());
        setBotSyncMsg(
          data.envSaved && data.discordApiSynced
            ? '✓ Token saved to .env & verified! Live Discord stats loaded into DB.'
            : data.discordApiSynced
            ? '✓ Synced live Guilds & Users directly from Discord API & saved to DB!'
            : '✓ Live Guilds & Active Users saved to DB across all pages!'
        );
        setTimeout(() => setBotSyncMsg(''), 4500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAutoLoadEnvTokenNow = async () => {
    setSavingSettings(true);
    setBotSyncMsg('');
    try {
      const res = await fetch('/api/bot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ syncEnvToken: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setBotServers(data.status.servers ?? botServers);
          setBotUsers(data.status.users ?? botUsers);
          setBotCommands(data.status.commands ?? botCommands);
          setBotShards(data.status.shards ?? botShards);
        }
        setLastSavedDbTime(new Date().toLocaleTimeString());
        setBotSyncMsg(
          data.discordApiSynced
            ? '✓ Auto-loaded live stats from DISCORD_BOT_TOKEN & saved to DB!'
            : '✓ Stats synced with DB (Hourly auto-sync from environmental variable is running).'
        );
        setTimeout(() => setBotSyncMsg(''), 4500);
        fetchPaymentSettings();
      }
    } catch (err) {
      console.error(err);
      setBotSyncMsg('Failed to trigger environmental token sync.');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchMailLogs = async (authToken = token) => {
    if (!authToken) return;
    setLoadingMailLogs(true);
    try {
      const res = await fetch('/api/admin/mail-logs', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMailLogs(data.logs || []);
        if (data.smtp) {
          setSmtpStatus(data.smtp);
          setEditSmtpUser(data.smtp.user || 'cyabot@zohomail.com');
          setEditSmtpHost(data.smtp.host || 'smtp.zoho.com');
          setEditSmtpPort(data.smtp.port || 465);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMailLogs(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions(token);
      fetchPaymentSettings();
      fetchMailLogs(token);
      const interval = setInterval(() => {
        fetchTransactions(token);
        if (activeSection === 'mail-snippets') {
          fetchMailLogs(token);
        }
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [token, activeSection]);

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
        fetchMailLogs(data.token);
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

  const handleUpdateStatus = async (id: string, status: 'pending' | 'verified' | 'rejected', reason?: string) => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, denialReason: reason }),
      });
      if (res.ok) {
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? { ...tx, status, ...(reason ? { denialReason: reason } : {}) } : tx))
        );
        if (selectedTxModal?.id === id) {
          setSelectedTxModal((prev) => (prev ? { ...prev, status, ...(reason ? { denialReason: reason } : {}) } : null));
        }
        setMailActionToast(
          status === 'verified'
            ? '✓ Verified! Approval & Activation email sent to buyer from cyabot@zohomail.com'
            : status === 'rejected'
            ? '✕ Payment Denied! Rejection notice with reason emailed to buyer from cyabot@zohomail.com'
            : '● Status reset to Pending'
        );
        setTimeout(() => setMailActionToast(''), 4500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenRejectModal = (tx: ReceiptData) => {
    setDenialModalTx(tx);
    setDenialReasonInput('Payment transaction ID (TID) could not be verified in payment gateway records.');
  };

  const handleConfirmDenial = async () => {
    if (!denialModalTx) return;
    await handleUpdateStatus(denialModalTx.id, 'rejected', denialReasonInput.trim());
    setDenialModalTx(null);
  };

  const handleResendEmail = async (tx: ReceiptData, type: 'confirm' | 'verified' | 'denied') => {
    setResendingEmailId(tx.id);
    try {
      const res = await fetch(`/api/admin/transactions/${tx.id}/resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, customEmail: tx.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMailActionToast(`✓ Email sent to ${tx.email} from cyabot@zohomail.com!`);
      } else {
        setMailActionToast(`✕ Resend error: ${data.error || 'Failed'}`);
      }
    } catch (err: any) {
      setMailActionToast(`✕ Error: ${err?.message || 'Network error'}`);
    } finally {
      setResendingEmailId(null);
      setTimeout(() => setMailActionToast(''), 4500);
    }
  };

  const handleSaveSmtpSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setSmtpSavedMsg('');
    try {
      const res = await fetch('/api/admin/mail-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          host: editSmtpHost,
          port: Number(editSmtpPort),
          user: editSmtpUser,
          pass: editSmtpPass,
          from: `"Cya Bot Billing" <${editSmtpUser}>`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSmtpSavedMsg('✓ SMTP credentials saved to .env & activated!');
        fetchMailLogs(token);
      } else {
        setSmtpSavedMsg(`✕ Failed: ${data.error || 'Error'}`);
      }
    } catch (err: any) {
      setSmtpSavedMsg(`✕ Error: ${err.message}`);
    } finally {
      setSavingSmtp(false);
      setTimeout(() => setSmtpSavedMsg(''), 4500);
    }
  };

  const handleSendTestMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMailRecipient.trim()) return;
    setSendingTestMail(true);
    setTestMailMsg('');
    try {
      const res = await fetch('/api/admin/mail-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: testMailRecipient.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestMailMsg(`✓ ${data.message}`);
        fetchMailLogs(token);
      } else {
        setTestMailMsg(`✕ ${data.error || 'Test email failed'}`);
      }
    } catch (err: any) {
      setTestMailMsg(`✕ Error: ${err.message}`);
    } finally {
      setSendingTestMail(false);
      setTimeout(() => setTestMailMsg(''), 5000);
    }
  };

  const handleSendCustomMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMailRecipient.trim() || !customMailBody.trim()) return;
    setSendingCustomMail(true);
    setCustomMailMsg('');
    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: customMailRecipient.trim(),
          subject: customMailSubject.trim(),
          message: customMailBody.trim(),
          senderBotTag: 'Cya Bot Admin Portal',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomMailMsg(`✓ Email dispatched to ${customMailRecipient} from cyabot@zohomail.com!`);
        setCustomMailBody('');
        fetchMailLogs(token);
      } else {
        setCustomMailMsg(`✕ ${data.error || 'Failed to send'}`);
      }
    } catch (err: any) {
      setCustomMailMsg(`✕ Error: ${err.message}`);
    } finally {
      setSendingCustomMail(false);
      setTimeout(() => setCustomMailMsg(''), 5000);
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
        setLastSavedDbTime(new Date().toLocaleTimeString());
        setSettingsSavedMsg(`✓ ${editingMethod} QR & account settings saved to DB!`);
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="admin-eyebrow">Cya Billing &amp; Verification Console</span>
                <span className="admin-live-dot" title="Auto-syncing every 6 seconds">● Live Sync</span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: isDbAutoSaving ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isDbAutoSaving ? '#fbbf24' : '#34d399',
                  }}
                  title="All admin changes automatically persist to backend database"
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isDbAutoSaving ? '#fbbf24' : '#10b981',
                      boxShadow: isDbAutoSaving ? '0 0 8px #fbbf24' : '0 0 8px #10b981',
                    }}
                  />
                  <span>
                    {isDbAutoSaving
                      ? 'Saving to DB...'
                      : lastSavedDbTime
                      ? `Auto-saved to DB (${lastSavedDbTime})`
                      : 'All changes saved to DB'}
                  </span>
                </div>
              </div>
              <h1>
                {activeSection === 'bot-stats'
                  ? 'Live Bot Guilds & Stats'
                  : activeSection === 'featured-servers'
                  ? 'Featured Communities & Widgets'
                  : activeSection === 'qr-settings'
                  ? 'Payment Gateways & QR Setup'
                  : activeSection === 'mail-snippets'
                  ? 'Auto Mail (Zoho/Gmail) & Discord Bot /mail Snippets'
                  : 'Transaction Management'}
              </h1>
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
              className={`admin-tab-switch ${activeSection === 'featured-servers' ? 'active' : ''}`}
              onClick={() => setActiveSection('featured-servers')}
            >
              <span>✨ Featured Servers &amp; Widgets</span>
            </button>
            <button
              type="button"
              className={`admin-tab-switch ${activeSection === 'mail-snippets' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('mail-snippets');
                fetchMailLogs();
              }}
            >
              <span>✉️ Auto Mail &amp; Bot /mail</span>
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

        {mailActionToast && (
          <div
            style={{
              padding: '12px 18px',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
              border: '1px solid rgba(34, 211, 238, 0.4)',
              borderRadius: '10px',
              color: '#e0f2fe',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span style={{ fontSize: '18px' }}>✉️</span>
            <span>{mailActionToast}</span>
          </div>
        )}

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
        ) : activeSection === 'featured-servers' ? (
          <section className="admin-settings-panel">
            <div className="settings-header-flex">
              <div>
                <h2>Featured Communities &amp; Live Discord Widget Showcase</h2>
                <p className="settings-desc" style={{ marginBottom: 0 }}>
                  Manage the moving animated server cards shown on the Home page. Paste any Discord Server ID or full <code>&lt;iframe src=&quot;https://discord.com/widget?id=...&quot;&gt;</code> code to auto-fetch live server names &amp; member counts, or edit any server directly below.
                </p>
              </div>
              <button
                type="button"
                className="admin-refresh-btn"
                onClick={async () => {
                  setResolvingFeatured(true);
                  try {
                    const res = await fetch('/api/featured-servers?refresh=1');
                    if (res.ok) {
                      const d = await res.json();
                      if (Array.isArray(d.servers)) setFeaturedServers(d.servers);
                      setFeaturedSavedMsg('✓ Auto-fetched live names & member counts from Discord!');
                      setTimeout(() => setFeaturedSavedMsg(''), 3500);
                    }
                  } finally {
                    setResolvingFeatured(false);
                  }
                }}
              >
                ↻ {resolvingFeatured ? 'Syncing Discord Widgets...' : 'Auto-Fetch Live Widget Counts'}
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '20px 0' }} />

            {/* Add New Server via Widget Iframe or Server ID */}
            <form onSubmit={handleAddOrResolveFeaturedServer} className="admin-qr-form" style={{ marginBottom: '28px' }}>
              <div className="admin-form-grid">
                <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
                  <label>Paste Discord Widget Iframe HTML or Server ID (17–20 digits)</label>
                  <input
                    type="text"
                    placeholder='e.g. 1508096258185887884 or <iframe src="https://discord.com/widget?id=1508096258185887884&theme=dark" ...></iframe>'
                    value={newWidgetOrIdInput}
                    onChange={(e) => setNewWidgetOrIdInput(e.target.value)}
                    required
                  />
                </div>
                <div className="admin-field">
                  <label>Optional: Server Name (Leave blank to auto-fetch)</label>
                  <input
                    type="text"
                    placeholder="Auto-fetched from Discord Widget / Config"
                    value={newServerNameInput}
                    onChange={(e) => setNewServerNameInput(e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <label>Optional: Member Count (Leave blank to auto-fetch)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Auto-fetched live count"
                    value={newServerMembersInput}
                    onChange={(e) => setNewServerMembersInput(e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <label>Optional: Invite URL (Auto-fetches exact member count &amp; icon)</label>
                  <input
                    type="text"
                    placeholder="https://discord.gg/..."
                    value={newServerInviteInput}
                    onChange={(e) => setNewServerInviteInput(e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <label>Optional: Custom Server Icon URL</label>
                  <input
                    type="text"
                    placeholder="https://cdn.discordapp.com/icons/..."
                    value={newServerIconInput}
                    onChange={(e) => setNewServerIconInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="admin-login-btn"
                  style={{ width: 'auto', padding: '11px 24px' }}
                  disabled={resolvingFeatured}
                >
                  {resolvingFeatured ? 'Auto-Fetching from Discord...' : '+ Add & Auto-Fetch Server Widget'}
                </button>
              </div>
            </form>

            {featuredSavedMsg && <div className="admin-save-toast" style={{ marginBottom: '16px' }}>{featuredSavedMsg}</div>}

            {/* Editable List of Featured Servers + Live Widget Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '24px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {featuredServers.map((srv, idx) => (
                  <div
                    key={srv.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '52px 1.4fr 110px 100px 1.2fr auto',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: previewWidgetId === srv.id ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <img
                      src={srv.iconUrl}
                      alt={srv.name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=256';
                      }}
                    />

                    <div className="admin-field" style={{ margin: 0 }}>
                      <label style={{ fontSize: '10px' }}>#{idx + 1} · ID: {srv.id}</label>
                      <input
                        type="text"
                        value={srv.name}
                        onChange={(e) => handleUpdateFeaturedField(srv.id, 'name', e.target.value)}
                      />
                    </div>

                    <div className="admin-field" style={{ margin: 0 }}>
                      <label style={{ fontSize: '10px' }}>Members</label>
                      <input
                        type="number"
                        min={1}
                        value={srv.memberCount}
                        onChange={(e) => handleUpdateFeaturedField(srv.id, 'memberCount', Number(e.target.value))}
                      />
                    </div>

                    <div className="admin-field" style={{ margin: 0 }}>
                      <label style={{ fontSize: '10px' }}>Badge</label>
                      <select
                        className="admin-method-select"
                        style={{ width: '100%', height: '38px' }}
                        value={srv.badgeColor || 'green'}
                        onChange={(e) => handleUpdateFeaturedField(srv.id, 'badgeColor', e.target.value as any)}
                      >
                        <option value="green">Green ✓</option>
                        <option value="blue">Blue ✓</option>
                      </select>
                    </div>

                    <div className="admin-field" style={{ margin: 0 }}>
                      <label style={{ fontSize: '10px' }}>Icon URL</label>
                      <input
                        type="text"
                        value={srv.iconUrl}
                        onChange={(e) => handleUpdateFeaturedField(srv.id, 'iconUrl', e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="admin-refresh-btn"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                        onClick={() => setPreviewWidgetId(srv.id)}
                      >
                        👁 Widget
                      </button>
                      <button
                        type="button"
                        className="admin-logout-btn"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                        onClick={() => handleRemoveFeaturedServer(srv.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="admin-login-btn"
                    style={{ width: 'auto', padding: '12px 28px' }}
                    disabled={savingSettings}
                    onClick={() => saveFeaturedServersList(featuredServers)}
                  >
                    {savingSettings ? 'Saving...' : 'Save All Featured Servers Changes'}
                  </button>
                </div>
              </div>

              {/* Live Discord Iframe Widget Preview */}
              {previewWidgetId && (
                <div
                  style={{
                    background: '#0b0f19',
                    border: '1px solid rgba(34, 211, 238, 0.25)',
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#22d3ee' }}>
                      Live Discord Widget ({previewWidgetId})
                    </span>
                  </div>
                  <iframe
                    src={`https://discord.com/widget?id=${previewWidgetId}&theme=dark`}
                    width="350"
                    height="500"
                    allowTransparency={true}
                    frameBorder="0"
                    sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                    title="Discord Widget Preview"
                    style={{ borderRadius: '12px' }}
                  />
                </div>
              )}
            </div>
          </section>
        ) : activeSection === 'bot-stats' ? (
          <section className="admin-settings-panel">
            <h2>Live Bot Guilds &amp; Active Users Sync</h2>
            <p className="settings-desc">
              Set your exact real Guild (Server) and Active User counts, or trigger an instant auto-sync using the token from your environmental variables (<code>process.env.DISCORD_BOT_TOKEN</code>).
            </p>

            {/* Hourly Auto-Sync from Environmental Variable Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '16px',
                padding: '22px',
                marginBottom: '26px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'inline-block',
                        boxShadow: '0 0 12px #10b981',
                      }}
                    />
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 700 }}>
                      Hourly Auto-Load from Environmental Variable Token
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                    The backend auto-loads live Guild and Member statistics every <strong>1 hour</strong> using <code>process.env.DISCORD_BOT_TOKEN</code> and persists them directly to the database.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-login-btn"
                  style={{ width: 'auto', padding: '10px 22px', fontSize: '13px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}
                  onClick={handleAutoLoadEnvTokenNow}
                  disabled={savingSettings}
                >
                  {savingSettings ? 'Syncing...' : '⚡ Auto-Load from Token Now'}
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Token Source
                  </span>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600, marginTop: '2px' }}>
                    {hourlySyncInfo?.hasEnvToken ? '✓ process.env.DISCORD_BOT_TOKEN' : 'Configured Discord Token'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Auto-Load Interval
                  </span>
                  <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>
                    Every 1 Hour (Automatic Interval)
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Last Auto-Sync
                  </span>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600, marginTop: '2px' }}>
                    {hourlySyncInfo?.lastSyncTime
                      ? new Date(hourlySyncInfo.lastSyncTime).toLocaleTimeString()
                      : 'On Server Boot / Hourly'}
                  </div>
                </div>
              </div>
            </div>

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

              {/* Discord Bot Token Configuration Box */}
              <div
                style={{
                  marginTop: '12px',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#e0e7ff', margin: 0 }}>
                    🔑 Discord Bot Token (Auto-Fetches Live Guilds &amp; Users Every Hour)
                  </label>
                  <span style={{ fontSize: '11px', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                    Saves to .env &amp; Database
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  You can add your bot token in two ways:
                  <br />
                  <strong>Option 1 (Instant):</strong> Paste your Discord Bot Token below and click <strong>&quot;Save Token &amp; Sync Live Stats&quot;</strong>.
                  <br />
                  <strong>Option 2 (.env file):</strong> Add <code style={{ color: '#818cf8', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>DISCORD_BOT_TOKEN=your_token_here</code> inside your <code style={{ color: '#818cf8', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>.env</code> file.
                </p>

                <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type={showTokenPassword ? 'text' : 'password'}
                    placeholder="Paste your 72-character Discord Bot Token..."
                    value={botTokenInput}
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    style={{ flex: 1, paddingRight: '70px', fontFamily: showTokenPassword ? 'monospace' : 'inherit' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenPassword(!showTokenPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {showTokenPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {botSyncMsg && <div className="admin-save-toast">{botSyncMsg}</div>}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                <button
                  type="submit"
                  className="admin-login-btn"
                  style={{
                    width: 'auto',
                    padding: '12px 24px',
                    background: botTokenInput.trim() ? 'linear-gradient(135deg, #4f46e5, #06b6d4)' : undefined,
                  }}
                  disabled={savingSettings}
                >
                  {savingSettings
                    ? 'Syncing & Saving...'
                    : botTokenInput.trim()
                    ? '💾 Save Token & Sync Live Stats'
                    : 'Update Live Guilds & Users Now'}
                </button>
              </div>
            </form>
          </section>
        ) : activeSection === 'mail-snippets' ? (
          <MailSettingsPanel
            token={token}
            smtpStatus={smtpStatus}
            mailLogs={mailLogs}
            loadingMailLogs={loadingMailLogs}
            onRefreshLogs={() => fetchMailLogs(token)}
            onMailToast={(msg) => {
              setMailActionToast(msg);
              setTimeout(() => setMailActionToast(''), 4500);
            }}
          />
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
                      <th>Sender / Customer Email</th>
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
                          {tx.email && (
                            <div style={{ marginTop: '4px' }}>
                              <button
                                type="button"
                                className="copyable-chip"
                                style={{
                                  fontSize: '11px',
                                  color: '#38bdf8',
                                  background: 'rgba(56, 189, 248, 0.1)',
                                  border: '1px solid rgba(56, 189, 248, 0.25)',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                onClick={() => handleCopy(tx.email!, 'em')}
                                title="Click to copy Customer Email"
                              >
                                <span>✉️ {tx.email}</span>
                                <span className="copy-hint" style={{ fontSize: '10px' }}>
                                  {copiedText === `em:${tx.email}` ? '✓' : 'Copy'}
                                </span>
                              </button>
                            </div>
                          )}
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
                              ? '✕ Denied'
                              : '● Pending'}
                          </span>
                          {tx.status === 'rejected' && tx.denialReason && (
                            <div style={{ fontSize: '11px', color: '#f87171', marginTop: '3px', maxWidth: '170px', lineHeight: 1.3 }}>
                              Note: {tx.denialReason}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="admin-row-actions">
                            {tx.status !== 'verified' && (
                              <button
                                type="button"
                                className="action-btn verify"
                                onClick={() => handleUpdateStatus(tx.id, 'verified')}
                                title="Approve & Send Activation Email from cyabot@zohomail.com"
                              >
                                ✓ Verify
                              </button>
                            )}
                            {tx.status !== 'rejected' && (
                              <button
                                type="button"
                                className="action-btn reject"
                                onClick={() => handleOpenRejectModal(tx)}
                                title="Deny Payment & Send Rejection Notice"
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
                            {tx.email && (
                              <button
                                type="button"
                                className="action-btn receipt"
                                style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                                onClick={() =>
                                  handleResendEmail(
                                    tx,
                                    tx.status === 'verified' ? 'verified' : tx.status === 'rejected' ? 'denied' : 'confirm'
                                  )
                                }
                                disabled={resendingEmailId === tx.id}
                                title="Resend automated email to customer"
                              >
                                {resendingEmailId === tx.id ? '...' : '✉ Resend'}
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
              {selectedTxModal.email && (
                <div className="detail-row">
                  <span>Customer Email</span>
                  <strong style={{ color: '#38bdf8' }}>{selectedTxModal.email}</strong>
                </div>
              )}
              {selectedTxModal.status === 'rejected' && selectedTxModal.denialReason && (
                <div className="detail-row" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px 10px', borderRadius: '6px' }}>
                  <span style={{ color: '#fca5a5' }}>Denial Reason</span>
                  <strong style={{ color: '#f87171' }}>{selectedTxModal.denialReason}</strong>
                </div>
              )}
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

              {selectedTxModal.email && (
                <button
                  type="button"
                  className="download-receipt-btn"
                  style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}
                  onClick={() =>
                    handleResendEmail(
                      selectedTxModal,
                      selectedTxModal.status === 'verified'
                        ? 'verified'
                        : selectedTxModal.status === 'rejected'
                        ? 'denied'
                        : 'confirm'
                    )
                  }
                  disabled={resendingEmailId === selectedTxModal.id}
                >
                  ✉ Re-send Customer Notification Email
                </button>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedTxModal.status !== 'verified' && (
                  <button
                    type="button"
                    className="action-btn verify"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => handleUpdateStatus(selectedTxModal.id, 'verified')}
                  >
                    ✓ Verify &amp; Send Activation Email
                  </button>
                )}
                {selectedTxModal.status !== 'rejected' && (
                  <button
                    type="button"
                    className="action-btn reject"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => {
                      const target = selectedTxModal;
                      setSelectedTxModal(null);
                      handleOpenRejectModal(target);
                    }}
                  >
                    ✕ Deny &amp; Send Rejection Email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Denial Reason Modal with Automated Email */}
      {denialModalTx && (
        <DenialModal
          tx={denialModalTx}
          onClose={() => setDenialModalTx(null)}
          onConfirm={handleConfirmDenial}
        />
      )}
    </div>
  );
};
