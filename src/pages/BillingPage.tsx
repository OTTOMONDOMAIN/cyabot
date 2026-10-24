import React, { useState, useEffect } from 'react';
import { useConfig } from '../hooks/useData';
import { Footer } from '../components/Footer';
import { validatePaymentInput, downloadReceiptImage, ReceiptData } from '../utils/receiptGenerator';

interface BillingPageProps {
  onNavigate: (path: string) => void;
}

interface SelectedPlan {
  id: string;
  title: string;
  priceMonthly: number;
  priceAnnual: number;
  displayPrice: string;
  periodLabel: string;
  subtitle: string;
}

interface MethodPaymentConfig {
  qrCodeUrl: string;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
}

export type RegionCode = 'IN' | 'PK' | 'US';

export interface RegionPricingConfig {
  code: RegionCode;
  countryName: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  starterMonthly: number;
  starterAnnual: number;
  premiumMonthly: number;
  premiumAnnual: number;
  defaultMethod: 'EasyPaisa' | 'JazzCash' | 'Crypto' | 'UPI';
}

export const REGIONAL_PRICING: Record<RegionCode, RegionPricingConfig> = {
  IN: {
    code: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    starterMonthly: 99,
    starterAnnual: 999,
    premiumMonthly: 199,
    premiumAnnual: 1999,
    defaultMethod: 'UPI',
  },
  PK: {
    code: 'PK',
    countryName: 'Pakistan',
    flag: '🇵🇰',
    currencyCode: 'PKR',
    currencySymbol: 'Rs',
    starterMonthly: 160,
    starterAnnual: 1632,
    premiumMonthly: 310,
    premiumAnnual: 3162,
    defaultMethod: 'EasyPaisa',
  },
  US: {
    code: 'US',
    countryName: 'United States & Global',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    starterMonthly: 1.99,
    starterAnnual: 19.99,
    premiumMonthly: 3.99,
    premiumAnnual: 39.99,
    defaultMethod: 'Crypto',
  },
};

export const formatRegionalPrice = (amount: number, reg: RegionPricingConfig): string => {
  if (reg.code === 'IN') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  if (reg.code === 'US') {
    return `$${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
  }
  return `${amount.toLocaleString()} Rs`;
};

interface AllPaymentSettings {
  EasyPaisa: MethodPaymentConfig;
  JazzCash: MethodPaymentConfig;
  Crypto: MethodPaymentConfig;
  UPI: MethodPaymentConfig;
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
  UPI: {
    qrCodeUrl: '',
    accountTitle: 'Cya Bot Official (UPI)',
    accountNumber: 'cya@upi',
    instructions: 'Scan the UPI QR code using Google Pay, PhonePe, Paytm, or BHIM, enter your UPI ID or mobile number below, and click Done after sending.',
  },
};

const detectInitialRegion = (): RegionCode => {
  try {
    const saved = localStorage.getItem('cya_user_region') as RegionCode;
    if (saved && REGIONAL_PRICING[saved]) return saved;

    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    if (tz.includes('calcutta') || tz.includes('kolkata')) return 'IN';
    if (tz.includes('karachi')) return 'PK';

    const lang = (navigator.language || '').toLowerCase();
    if (lang.includes('-in')) return 'IN';
    if (lang.includes('-pk')) return 'PK';
  } catch {}
  return 'IN';
};

export const BillingPage: React.FC<BillingPageProps> = ({ onNavigate }) => {
  const config = useConfig();
  const [selectedRegion, setSelectedRegion] = useState<RegionCode>(detectInitialRegion);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [upiCopied, setUpiCopied] = useState(false);

  const currentRegion = REGIONAL_PRICING[selectedRegion];

  // Checkout & Verification State
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EasyPaisa' | 'JazzCash' | 'Crypto' | 'UPI'>(
    currentRegion.defaultMethod
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [trxId, setTrxId] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [formError, setFormError] = useState('');

  // Step: 'idle' | 'checkout' | 'verifying'
  const [flowStep, setFlowStep] = useState<'idle' | 'checkout' | 'verifying'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTx, setSubmittedTx] = useState<ReceiptData | null>(null);
  const [finalSubmittedConfirmation, setFinalSubmittedConfirmation] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState<AllPaymentSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    fetch('/api/payment-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.EasyPaisa) {
          setPaymentSettings({
            EasyPaisa: { ...DEFAULT_SETTINGS.EasyPaisa, ...data.EasyPaisa },
            JazzCash: { ...DEFAULT_SETTINGS.JazzCash, ...data.JazzCash },
            Crypto: { ...DEFAULT_SETTINGS.Crypto, ...data.Crypto },
            UPI: { ...DEFAULT_SETTINGS.UPI, ...(data.UPI || {}) },
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectRegion = (code: RegionCode) => {
    setSelectedRegion(code);
    try {
      localStorage.setItem('cya_user_region', code);
    } catch {}
    setPaymentMethod(REGIONAL_PRICING[code].defaultMethod);
  };

  // Poll transaction status if user is on verifying page and has a transaction ID
  useEffect(() => {
    if (flowStep !== 'verifying' || !submittedTx?.id) return;
    const timer = setInterval(() => {
      fetch(`/api/transactions/${submittedTx.id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.transaction) {
            setSubmittedTx(data.transaction);
          }
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [flowStep, submittedTx?.id]);

  // Current Regional Pricing figures
  const starterPriceNumber = annual ? currentRegion.starterAnnual : currentRegion.starterMonthly;
  const premiumPriceNumber = annual ? currentRegion.premiumAnnual : currentRegion.premiumMonthly;
  const starterPriceDisplay = formatRegionalPrice(starterPriceNumber, currentRegion);
  const premiumPriceDisplay = formatRegionalPrice(premiumPriceNumber, currentRegion);
  const periodUnit = annual ? '/ year' : '/ month';

  const currentMethodConfig = paymentSettings[paymentMethod] || DEFAULT_SETTINGS[paymentMethod];

  // Live validation check for phone / wallet / UPI input
  const phoneValidation = validatePaymentInput(paymentMethod, phoneNumber);

  const handleSelectPlan = (plan: SelectedPlan) => {
    setSelectedPlan(plan);
    setPaymentMethod(currentRegion.defaultMethod);
    setFormError('');
    setSubmittedTx(null);
    setFinalSubmittedConfirmation(false);
    setFlowStep('checkout');
  };

  // When user clicks "Done" -> Validates real number, moves to "Verifying your payment" page, and records transaction
  const handleClickDone = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validatePaymentInput(paymentMethod, phoneNumber);
    if (!check.valid) {
      setFormError(check.error || 'Please enter a valid mobile number.');
      return;
    }

    if (!buyerEmail.trim() || !buyerEmail.includes('@') || !buyerEmail.includes('.')) {
      setFormError('Please enter a valid email address to receive your official order receipt.');
      return;
    }

    setPhoneNumber(check.formatted);
    setFormError('');

    if (!selectedPlan) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: selectedPlan.title,
          amount: selectedPlan.displayPrice,
          billingCycle: annual ? 'per year' : 'per month',
          paymentMethod,
          phoneNumber: check.formatted,
          discordTag: discordTag.trim() || 'Not specified',
          trxId: trxId.trim() || `${paymentMethod} QR`,
          email: buyerEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Invalid mobile number.');
        setSubmitting(false);
        return;
      }
      setSubmittedTx(data.transaction);
      setFlowStep('verifying');
    } catch (err) {
      console.error(err);
      setFormError('Failed to submit transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // When user clicks "Submit" on the Verifying Payment page -> Confirms submission & shows receipt download
  const handleFinalSubmitToAdmin = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      if (!submittedTx) {
        const check = validatePaymentInput(paymentMethod, phoneNumber);
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planName: selectedPlan.title,
            amount: selectedPlan.displayPrice,
            billingCycle: annual ? 'per year' : 'per month',
            paymentMethod,
            phoneNumber: check.formatted,
            discordTag: discordTag.trim() || 'Not specified',
            trxId: trxId.trim() || `${paymentMethod} QR`,
            email: buyerEmail.trim(),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSubmittedTx(data.transaction);
        }
      }
      setFinalSubmittedConfirmation(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (!selectedPlan) return;
    const receiptPayload: ReceiptData = submittedTx || {
      id: 'TXN-PENDING',
      planName: selectedPlan.title,
      amount: selectedPlan.displayPrice,
      billingCycle: annual ? 'per year' : 'per month',
      paymentMethod,
      phoneNumber,
      discordTag: discordTag || 'Not specified',
      trxId: trxId || `${paymentMethod} QR`,
      email: buyerEmail.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    downloadReceiptImage(receiptPayload);
  };

  const renderMethodPlaceholderQr = () => {
    if (paymentMethod === 'EasyPaisa') {
      return (
        <div className="qr-placeholder-art ep-theme">
          <svg viewBox="0 0 120 120" width="126" height="126" fill="none">
            <rect x="6" y="6" width="34" height="34" rx="4" stroke="#10b981" strokeWidth="4" />
            <rect x="15" y="15" width="16" height="16" rx="2" fill="#10b981" />
            <rect x="80" y="6" width="34" height="34" rx="4" stroke="#10b981" strokeWidth="4" />
            <rect x="89" y="15" width="16" height="16" rx="2" fill="#10b981" />
            <rect x="6" y="80" width="34" height="34" rx="4" stroke="#10b981" strokeWidth="4" />
            <rect x="15" y="89" width="16" height="16" rx="2" fill="#10b981" />
            <rect x="50" y="12" width="8" height="8" fill="#cbd5e1" />
            <rect x="64" y="20" width="8" height="16" fill="#cbd5e1" />
            <rect x="46" y="46" width="28" height="28" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="3" />
            <text x="60" y="64" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold">EP</text>
            <rect x="12" y="52" width="12" height="8" fill="#cbd5e1" />
            <rect x="30" y="60" width="8" height="12" fill="#cbd5e1" />
            <rect x="82" y="50" width="10" height="10" fill="#cbd5e1" />
            <rect x="98" y="64" width="12" height="8" fill="#cbd5e1" />
            <rect x="52" y="84" width="16" height="8" fill="#cbd5e1" />
            <rect x="80" y="82" width="12" height="12" fill="#10b981" />
            <rect x="98" y="96" width="14" height="14" fill="#34d399" />
          </svg>
          <span className="qr-placeholder-tag" style={{ color: '#34d399' }}>EasyPaisa QR Slot</span>
        </div>
      );
    }

    if (paymentMethod === 'JazzCash') {
      return (
        <div className="qr-placeholder-art jc-theme">
          <svg viewBox="0 0 120 120" width="126" height="126" fill="none">
            <rect x="6" y="6" width="34" height="34" rx="4" stroke="#f59e0b" strokeWidth="4" />
            <rect x="15" y="15" width="16" height="16" rx="2" fill="#ef4444" />
            <rect x="80" y="6" width="34" height="34" rx="4" stroke="#f59e0b" strokeWidth="4" />
            <rect x="89" y="15" width="16" height="16" rx="2" fill="#ef4444" />
            <rect x="6" y="80" width="34" height="34" rx="4" stroke="#f59e0b" strokeWidth="4" />
            <rect x="15" y="89" width="16" height="16" rx="2" fill="#ef4444" />
            <rect x="48" y="14" width="14" height="8" fill="#fde68a" />
            <rect x="66" y="24" width="8" height="14" fill="#fde68a" />
            <rect x="46" y="46" width="28" height="28" rx="6" fill="#451a03" stroke="#f59e0b" strokeWidth="3" />
            <text x="60" y="64" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">JC</text>
            <rect x="14" y="54" width="10" height="10" fill="#fde68a" />
            <rect x="28" y="62" width="10" height="8" fill="#fde68a" />
            <rect x="84" y="52" width="12" height="8" fill="#fde68a" />
            <rect x="96" y="66" width="14" height="8" fill="#fde68a" />
            <rect x="50" y="86" width="18" height="8" fill="#fde68a" />
            <rect x="82" y="84" width="12" height="12" fill="#ef4444" />
            <rect x="96" y="96" width="14" height="14" fill="#f59e0b" />
          </svg>
          <span className="qr-placeholder-tag" style={{ color: '#fbbf24' }}>JazzCash QR Slot</span>
        </div>
      );
    }

    if (paymentMethod === 'UPI') {
      return (
        <div className="qr-placeholder-art upi-theme">
          <svg viewBox="0 0 120 120" width="126" height="126" fill="none">
            <rect x="6" y="6" width="34" height="34" rx="4" stroke="#a855f7" strokeWidth="4" />
            <rect x="15" y="15" width="16" height="16" rx="2" fill="#a855f7" />
            <rect x="80" y="6" width="34" height="34" rx="4" stroke="#a855f7" strokeWidth="4" />
            <rect x="89" y="15" width="16" height="16" rx="2" fill="#a855f7" />
            <rect x="6" y="80" width="34" height="34" rx="4" stroke="#a855f7" strokeWidth="4" />
            <rect x="15" y="89" width="16" height="16" rx="2" fill="#a855f7" />
            <rect x="42" y="44" width="36" height="32" rx="6" fill="#3b0764" stroke="#a855f7" strokeWidth="2.5" />
            <text x="60" y="64" textAnchor="middle" fill="#e9d5ff" fontSize="13" fontWeight="900" letterSpacing="0.5">UPI</text>
            <rect x="48" y="12" width="10" height="10" fill="#c084fc" />
            <rect x="66" y="20" width="8" height="16" fill="#cbd5e1" />
            <rect x="12" y="50" width="14" height="8" fill="#cbd5e1" />
            <rect x="30" y="62" width="8" height="12" fill="#cbd5e1" />
            <rect x="84" y="50" width="12" height="8" fill="#c084fc" />
            <rect x="100" y="64" width="10" height="10" fill="#cbd5e1" />
            <rect x="52" y="86" width="16" height="8" fill="#cbd5e1" />
            <rect x="80" y="84" width="12" height="12" fill="#a855f7" />
            <rect x="98" y="96" width="14" height="14" fill="#c084fc" />
          </svg>
          <span className="qr-placeholder-tag" style={{ color: '#c084fc' }}>BHIM / UPI QR Slot</span>
        </div>
      );
    }

    return (
      <div className="qr-placeholder-art crypto-theme">
        <svg viewBox="0 0 120 120" width="126" height="126" fill="none">
          <rect x="6" y="6" width="34" height="34" rx="4" stroke="#22d3ee" strokeWidth="4" />
          <rect x="15" y="15" width="16" height="16" rx="2" fill="#06b6d4" />
          <rect x="80" y="6" width="34" height="34" rx="4" stroke="#22d3ee" strokeWidth="4" />
          <rect x="89" y="15" width="16" height="16" rx="2" fill="#06b6d4" />
          <rect x="6" y="80" width="34" height="34" rx="4" stroke="#22d3ee" strokeWidth="4" />
          <rect x="15" y="89" width="16" height="16" rx="2" fill="#06b6d4" />
          <rect x="52" y="10" width="10" height="10" fill="#a5f3fc" />
          <rect x="66" y="22" width="8" height="12" fill="#a5f3fc" />
          <rect x="46" y="46" width="28" height="28" rx="6" fill="#083344" stroke="#22d3ee" strokeWidth="3" />
          <text x="60" y="64" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="bold">USDT</text>
          <rect x="14" y="50" width="14" height="8" fill="#a5f3fc" />
          <rect x="84" y="54" width="12" height="10" fill="#a5f3fc" />
          <rect x="50" y="82" width="14" height="10" fill="#a5f3fc" />
          <rect x="82" y="84" width="14" height="14" fill="#22d3ee" />
          <rect x="98" y="98" width="12" height="12" fill="#06b6d4" />
        </svg>
        <span className="qr-placeholder-tag" style={{ color: '#22d3ee' }}>Crypto / USDT QR Slot</span>
      </div>
    );
  };

  const faqs = [
    {
      q: 'How much does it cost in my local currency (India, Pakistan, US)?',
      a: 'We offer localized pricing tailored to each region: In India, Starter is just ₹99/mo (₹999/yr) and Premium is ₹199/mo (₹1,999/yr). In Pakistan, Starter is 160 Rs/mo (1,632 Rs/yr) and Premium is 310 Rs/mo (3,162 Rs/yr). In the US & Global, Starter is $1.99/mo ($19.99/yr) and Premium is $3.99/mo ($39.99/yr).',
    },
    {
      q: 'How does UPI, EasyPaisa, JazzCash, or Crypto QR payment work?',
      a: 'Simply select Starter or Premium, choose your preferred payment method (UPI for India, EasyPaisa / JazzCash for Pakistan, or Crypto / USDT globally), scan the dedicated QR or copy the UPI / Wallet ID, enter your real account reference, and click Done. You will receive an official downloadable receipt and our team verifies it swiftly.',
    },
    {
      q: 'What if my payment verification takes longer than expected?',
      a: 'Most transactions are verified within a few hours. Make sure to download your Payment Receipt PNG after paying — if verification takes more than 2 days, create a support ticket on our Discord server and attach your receipt.',
    },
    {
      q: 'How many servers are available in the free plan?',
      a: 'You can invite Cya to unlimited Discord servers on the Free Basic plan with access to standard commands, antinuke protection, and voice tools.',
    },
    {
      q: 'What is the difference between Starter and Premium?',
      a: 'The Starter plan gives you all core premium features including No Prefix mode, Unlimited Embeds, AI Commands, and Early View of new commands. The Premium plan includes everything in Starter plus a Custom Bot Profile Picture and Custom Banner exclusively for your server.',
    },
    {
      q: 'Can I upgrade from Starter to Premium later?',
      a: 'Yes! You can upgrade anytime by submitting the difference or selecting the Premium tier on your next billing cycle.',
    },
  ];

  const comparisonRows = [
    { feature: 'All Core Premium Features & Cooldowns', basic: false, starter: true, premium: true },
    { feature: 'No Prefix Mode (Command Without Prefix)', basic: false, starter: true, premium: true },
    { feature: 'Unlimited Custom Embeds', basic: 'Limited', starter: 'Unlimited', premium: 'Unlimited' },
    { feature: 'AI Commands (/ai ask & /ai reason)', basic: false, starter: true, premium: true },
    { feature: 'Early View & Access to New Commands', basic: false, starter: true, premium: true },
    { feature: 'Custom Bot Profile Picture & Banner', basic: false, starter: false, premium: true },
  ];

  // If user is on the dedicated "Verifying your payment" & Receipt page
  if (flowStep === 'verifying' && selectedPlan) {
    return (
      <div className="wise-billing-page" style={{ paddingTop: '96px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div className="verifying-payment-card">
            <div className="verifying-glow" aria-hidden="true"></div>

            {/* Animated Pulse Status Icon */}
            <div className="verifying-icon-wrap">
              {submittedTx?.status === 'verified' ? (
                <div className="verifying-circle verified">✓</div>
              ) : (
                <div className="verifying-circle">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
              )}
            </div>

            <span className="verifying-badge">
              {submittedTx?.status === 'verified'
                ? 'Payment Verified & Active'
                : finalSubmittedConfirmation
                ? 'Official Receipt Issued · Awaiting Admin Verification'
                : 'Payment Recorded · Download Your Receipt'}
            </span>

            <h1>Verifying your payment</h1>
            <p className="verifying-lead">
              We are verifying your <strong>{selectedPlan.displayPrice} ({selectedPlan.periodLabel})</strong> {paymentMethod} payment for the{' '}
              <strong>{selectedPlan.title}</strong>.{' '}
              <span className="highlight-warning">
                Please create a ticket on Discord if it takes more than 2 days.
              </span>
            </p>

            {/* Official Receipt Card */}
            <div className="official-receipt-preview">
              <div className="receipt-header-strip">
                <div className="receipt-brand">
                  <img
                    src="https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=1024"
                    alt="cya"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <strong>CYA OFFICIAL RECEIPT</strong>
                    <span>{submittedTx?.createdAt ? new Date(submittedTx.createdAt).toLocaleString() : new Date().toLocaleString()}</span>
                  </div>
                </div>
                <code className="receipt-id-tag">{submittedTx?.id || 'TXN-PENDING'}</code>
              </div>

              <div className="verifying-details-box" style={{ marginBottom: '14px' }}>
                <div className="detail-row">
                  <span>Selected Plan</span>
                  <strong>{selectedPlan.title} ({selectedPlan.displayPrice} {selectedPlan.periodLabel})</strong>
                </div>
                <div className="detail-row">
                  <span>Payment Gateway</span>
                  <strong style={{ color: '#22d3ee' }}>{paymentMethod}</strong>
                </div>
                <div className="detail-row">
                  <span>Registered {paymentMethod === 'Crypto' ? 'UID / Wallet' : 'Mobile Number'}</span>
                  <strong>{phoneNumber}</strong>
                </div>
                {discordTag && (
                  <div className="detail-row">
                    <span>Discord Account / Server</span>
                    <strong>{discordTag}</strong>
                  </div>
                )}
                {(submittedTx?.email || buyerEmail) && (
                  <div className="detail-row">
                    <span>Receipt &amp; Updates Email</span>
                    <strong style={{ color: '#38bdf8' }}>{submittedTx?.email || buyerEmail}</strong>
                  </div>
                )}
                {submittedTx?.status === 'rejected' && submittedTx.denialReason && (
                  <div className="detail-row" style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px 10px', borderRadius: '6px' }}>
                    <span style={{ color: '#fca5a5' }}>Denial Note</span>
                    <strong style={{ color: '#f87171' }}>{submittedTx.denialReason}</strong>
                  </div>
                )}
                <div className="detail-row">
                  <span>Verification Status</span>
                  <span
                    className={`tx-status-pill ${submittedTx?.status || 'pending'}`}
                  >
                    {submittedTx?.status === 'verified'
                      ? '✓ Verified by Admin'
                      : submittedTx?.status === 'rejected'
                      ? '✕ Declined / Denied'
                      : '● Pending Admin Verification'}
                  </span>
                </div>
              </div>

              {/* Download Receipt Button */}
              <button
                type="button"
                className="download-receipt-btn"
                onClick={handleDownloadReceipt}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Official Receipt (PNG)</span>
              </button>
            </div>

            {!finalSubmittedConfirmation ? (
              <div className="verifying-actions">
                <button
                  type="button"
                  className="wise-cta-btn primary-submit-btn"
                  disabled={submitting}
                  onClick={handleFinalSubmitToAdmin}
                >
                  {submitting ? 'Submitting to Admin...' : 'Submit Payment to Admin Panel'}
                </button>
              </div>
            ) : (
              <div className="submitted-success-banner">
                <div className="submitted-check">✓</div>
                <div>
                  <strong>Sent to Admin Transaction Panel!</strong>
                  <p>
                    Your transaction (<code>{submittedTx?.id}</code>) is now queued for verification.
                    {(submittedTx?.email || buyerEmail) && (
                      <> An order confirmation has been emailed to <strong>{submittedTx?.email || buyerEmail}</strong> from <code>cyabot@zohomail.com</code>.</>
                    )}
                    {' '}Save your downloaded receipt above and open a Discord ticket if verification takes more than 2 days.
                  </p>
                </div>
              </div>
            )}

            <div className="verifying-footer-links">
              <a
                href={config.supportServerUrl || 'https://dsc.gg/cyaa'}
                target="_blank"
                rel="noopener noreferrer"
                className="discord-ticket-btn"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.075.075 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.394-.405-.875-.618-1.25a.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.935 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.042 2.423 5.993 3.03a.077.077 0 0 0 .084-.028c.461-.63.873-1.295 1.226-1.994a.077.077 0 0 0-.042-.105 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.082.082 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028Z" />
                </svg>
                <span>Create Ticket on Discord (If &gt; 2 Days)</span>
              </a>

              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Or email your receipt to{' '}
                <a href="mailto:cyabot@zohomail.com" style={{ color: '#22d3ee', fontWeight: 600 }}>
                  cyabot@zohomail.com
                </a>
              </p>

              <button
                type="button"
                className="return-pricing-link"
                onClick={() => {
                  setFlowStep('idle');
                  setSelectedPlan(null);
                }}
              >
                Return to Pricing Plans
              </button>
            </div>
          </div>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="wise-billing-page">
      <main>
        {/* Top Pricing Hero Section matching reference image */}
        <section className="wise-pricing-hero">
          <div className="wise-container">
            <h1 className="wise-main-title">
              <strong>Pricing</strong> <span>plans</span>
            </h1>
            <p className="wise-subtitle">
              Best in features that will help your Discord community scale faster
            </p>

            {/* Regional Currency & Country Selector */}
            <div className="wise-region-container">
              <span className="wise-region-label">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Select Regional Pricing
              </span>
              <div className="wise-region-pills" role="radiogroup" aria-label="Select regional pricing">
                {(Object.keys(REGIONAL_PRICING) as RegionCode[]).map((code) => {
                  const reg = REGIONAL_PRICING[code];
                  const isSelected = selectedRegion === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`wise-region-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectRegion(code)}
                    >
                      <span className="flag">{reg.flag}</span>
                      <span>{reg.countryName}</span>
                      <span className="curr-tag">({reg.currencySymbol} {reg.currencyCode})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly / Annual Toggle */}
            <div className="wise-billing-toggle">
              <span className={!annual ? 'active' : ''}>Bill Monthly</span>
              <button
                type="button"
                role="switch"
                aria-checked={annual}
                className={`wise-switch ${annual ? 'on' : ''}`}
                onClick={() => setAnnual(!annual)}
              >
                <span className="wise-switch-thumb" />
              </button>
              <span className={annual ? 'active' : ''}>
                Bill Annually <em className="discount-tag">(15% off)</em>
              </span>
            </div>

            {/* 3 Pricing Cards Grid */}
            <div className="wise-cards-grid">
              {/* Card 1: Basic Plan (Free) */}
              <article className="wise-plan-card">
                <div className="wise-card-body">
                  <span className="wise-plan-label">Basic plan</span>
                  <div className="wise-price-block">
                    <strong className="wise-price-big">Free</strong>
                  </div>
                  <p className="wise-plan-desc">Free plan for all users.</p>

                  <ul className="wise-feature-list">
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>2 Server Workspaces</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>420+ Standard Commands</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Basic Antinuke Guard</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Unified Server Analytics</span>
                    </li>
                  </ul>

                  <a
                    href={config.inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wise-plan-btn"
                  >
                    Get Started Free
                  </a>
                </div>

                {/* Bottom Neon Wave Effect */}
                <div className="wise-card-wave" aria-hidden="true">
                  <svg viewBox="0 0 400 110" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                      </linearGradient>
                      <filter id="glow1">
                        <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <path
                      d="M-20,55 C90,110 220,15 420,85 L420,120 L-20,120 Z"
                      fill="url(#waveGrad1)"
                      opacity="0.22"
                    />
                    <path
                      d="M-10,65 C110,115 240,25 410,80"
                      fill="none"
                      stroke="url(#waveGrad1)"
                      strokeWidth="4"
                      filter="url(#glow1)"
                    />
                    <path
                      d="M-10,82 C130,45 270,110 410,55"
                      fill="none"
                      stroke="#a5f3fc"
                      strokeWidth="2"
                      opacity="0.7"
                    />
                  </svg>
                </div>
              </article>

              {/* Card 2: Starter / Standard Plan */}
              <article className="wise-plan-card featured-card">
                <div className="wise-card-body">
                  <span className="wise-plan-label">Starter plan</span>
                  <div className="wise-price-block">
                    <strong className="wise-price-big">{starterPriceDisplay}</strong>
                    <span className="wise-price-period">{periodUnit}</span>
                  </div>
                  <p className="wise-plan-desc">
                    {annual ? 'Billed yearly (Save 15% vs monthly).' : 'Ideal for growing communities.'}
                  </p>

                  <ul className="wise-feature-list">
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>All Premium Features Unlocked</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>No Prefix Mode</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Unlimited Custom Embeds</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Full AI Commands Access</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Early View of New Commands</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    className="wise-plan-btn"
                    onClick={() =>
                      handleSelectPlan({
                        id: `starter-${currentRegion.code.toLowerCase()}`,
                        title: 'Starter Plan',
                        priceMonthly: currentRegion.starterMonthly,
                        priceAnnual: currentRegion.starterAnnual,
                        displayPrice: starterPriceDisplay,
                        periodLabel: annual ? 'per year' : 'per month',
                        subtitle: 'Ideal for growing communities',
                      })
                    }
                  >
                    Get Starter Plan
                  </button>
                </div>

                {/* Bottom Neon Wave Effect */}
                <div className="wise-card-wave" aria-hidden="true">
                  <svg viewBox="0 0 400 110" preserveAspectRatio="none">
                    <path
                      d="M-20,75 C100,20 260,115 420,45 L420,120 L-20,120 Z"
                      fill="url(#waveGrad1)"
                      opacity="0.28"
                    />
                    <path
                      d="M-10,75 C110,25 250,115 410,50"
                      fill="none"
                      stroke="url(#waveGrad1)"
                      strokeWidth="4.5"
                      filter="url(#glow1)"
                    />
                    <path
                      d="M-10,90 C140,105 260,40 410,78"
                      fill="none"
                      stroke="#cffafe"
                      strokeWidth="2.2"
                      opacity="0.85"
                    />
                  </svg>
                </div>
              </article>

              {/* Card 3: Premium Plan */}
              <article className="wise-plan-card">
                <div className="wise-card-body">
                  <span className="wise-plan-label">Premium plan</span>
                  <div className="wise-price-block">
                    <strong className="wise-price-big">{premiumPriceDisplay}</strong>
                    <span className="wise-price-period">{periodUnit}</span>
                  </div>
                  <p className="wise-plan-desc">
                    {annual ? 'Billed yearly (Save 15% vs monthly).' : 'Works best for large & power servers.'}
                  </p>

                  <ul className="wise-feature-list">
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Everything in Starter Plan</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Custom Bot Profile Picture</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Custom Bot Profile Banner</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>No Prefix &amp; Unlimited Embeds</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>AI Commands &amp; Early Command View</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    className="wise-plan-btn"
                    onClick={() =>
                      handleSelectPlan({
                        id: `premium-${currentRegion.code.toLowerCase()}`,
                        title: 'Premium Plan',
                        priceMonthly: currentRegion.premiumMonthly,
                        priceAnnual: currentRegion.premiumAnnual,
                        displayPrice: premiumPriceDisplay,
                        periodLabel: annual ? 'per year' : 'per month',
                        subtitle: 'Works best for large & power servers',
                      })
                    }
                  >
                    Get Premium Plan
                  </button>
                </div>

                {/* Bottom Neon Wave Effect */}
                <div className="wise-card-wave" aria-hidden="true">
                  <svg viewBox="0 0 400 110" preserveAspectRatio="none">
                    <path
                      d="M-20,60 C120,115 240,20 420,75 L420,120 L-20,120 Z"
                      fill="url(#waveGrad1)"
                      opacity="0.25"
                    />
                    <path
                      d="M-10,62 C120,115 240,20 410,72"
                      fill="none"
                      stroke="url(#waveGrad1)"
                      strokeWidth="4"
                      filter="url(#glow1)"
                    />
                    <path
                      d="M-10,85 C150,50 280,105 410,48"
                      fill="none"
                      stroke="#a5f3fc"
                      strokeWidth="2"
                      opacity="0.75"
                    />
                  </svg>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Partner / Client Logos Strip matching reference image */}
        <section className="wise-logos-strip" aria-label="Trusted communities">
          <div className="wise-container logos-row">
            <span className="logo-item">◐ Invert</span>
            <span className="logo-item"><strong>Hitech</strong></span>
            <span className="logo-item">⚡ ProLine</span>
            <span className="logo-item">🛡️ DevWise</span>
            <span className="logo-item">❄️ Snowflake</span>
            <span className="logo-item">✦ Flash</span>
            <span className="logo-item">◉ CyberHub</span>
          </div>
        </section>

        {/* Feature Comparison Table Section */}
        <section className="wise-comparison-section">
          <div className="wise-container">
            <div className="wise-table-card">
              <div className="wise-table-header">
                <div className="col-feature">Feature comparison</div>
                <div className="col-tier">Basic (Free)</div>
                <div className="col-tier">Starter ({starterPriceDisplay})</div>
                <div className="col-tier">Premium ({premiumPriceDisplay})</div>
              </div>

              {comparisonRows.map((row, i) => (
                <div key={i} className="wise-table-row">
                  <div className="col-feature">{row.feature}</div>
                  <div className="col-tier">
                    {typeof row.basic === 'boolean' ? (
                      row.basic ? (
                        <span className="table-badge yes">✓</span>
                      ) : (
                        <span className="table-badge no">✕</span>
                      )
                    ) : (
                      <span className="table-text">{row.basic}</span>
                    )}
                  </div>
                  <div className="col-tier">
                    {typeof row.starter === 'boolean' ? (
                      row.starter ? (
                        <span className="table-badge yes">✓</span>
                      ) : (
                        <span className="table-badge no">✕</span>
                      )
                    ) : (
                      <span className="table-text">{row.starter}</span>
                    )}
                  </div>
                  <div className="col-tier">
                    {typeof row.premium === 'boolean' ? (
                      row.premium ? (
                        <span className="table-badge yes">✓</span>
                      ) : (
                        <span className="table-badge no">✕</span>
                      )
                    ) : (
                      <span className="table-text highlight">{row.premium}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="wise-faq-section">
          <div className="wise-container">
            <h2 className="wise-faq-heading">
              <strong>Frequently</strong> <span>asked questions</span>
            </h2>

            <div className="wise-faq-accordion">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`wise-faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="wise-faq-question"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className="wise-faq-chevron">{isOpen ? '⌃' : '⌄'}</span>
                    </button>
                    {isOpen && (
                      <div className="wise-faq-answer">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom Orbital Ring CTA matching reference image */}
        <section className="wise-orbital-cta">
          <div className="wise-container">
            <div className="orbital-ring-box">
              <div className="orbital-ellipse-outer" aria-hidden="true"></div>
              <div className="orbital-ellipse-inner" aria-hidden="true"></div>
              <div className="orbital-cta-content">
                <h2>
                  Ready to <strong>get</strong>
                  <br />
                  <strong>started?</strong>
                </h2>
                <button
                  type="button"
                  className="wise-plan-btn orbital-btn"
                  onClick={() =>
                    handleSelectPlan({
                      id: `premium-${currentRegion.code.toLowerCase()}`,
                      title: 'Premium Plan',
                      priceMonthly: currentRegion.premiumMonthly,
                      priceAnnual: currentRegion.premiumAnnual,
                      displayPrice: premiumPriceDisplay,
                      periodLabel: annual ? 'per year' : 'per month',
                      subtitle: 'Works best for large & power servers',
                    })
                  }
                >
                  Get Cya Premium ({premiumPriceDisplay})
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />

      {/* Multi-Method QR Checkout Modal */}
      {flowStep === 'checkout' && selectedPlan && (
        <div
          className="wise-modal-backdrop"
          onClick={() => setFlowStep('idle')}
        >
          <div
            className="wise-checkout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="wise-modal-close"
              onClick={() => setFlowStep('idle')}
              aria-label="Close payment modal"
            >
              ✕
            </button>

            <div className="modal-plan-header">
              <span className="modal-eyebrow">Cya Billing &amp; Checkout</span>
              <h3>{selectedPlan.title}</h3>
              <div className="modal-price-pill">
                <strong>{selectedPlan.displayPrice}</strong>
                <span>/ {annual ? 'year (15% off)' : 'month'}</span>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="modal-method-selector">
              <label className="modal-label">Select Payment Method (Each has its own QR)</label>
              <div className="method-tabs-grid">
                <button
                  type="button"
                  className={`method-tab-btn ${paymentMethod === 'UPI' ? 'active upi-active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('UPI');
                    setFormError('');
                  }}
                >
                  <strong>⚡ UPI (India)</strong>
                  <small>GPay / PhonePe / Paytm</small>
                </button>
                <button
                  type="button"
                  className={`method-tab-btn ${paymentMethod === 'EasyPaisa' ? 'active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('EasyPaisa');
                    setFormError('');
                  }}
                >
                  <strong>💚 EasyPaisa</strong>
                  <small>EasyPaisa QR</small>
                </button>
                <button
                  type="button"
                  className={`method-tab-btn ${paymentMethod === 'JazzCash' ? 'active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('JazzCash');
                    setFormError('');
                  }}
                >
                  <strong>🧡 JazzCash</strong>
                  <small>JazzCash QR</small>
                </button>
                <button
                  type="button"
                  className={`method-tab-btn ${paymentMethod === 'Crypto' ? 'active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('Crypto');
                    setFormError('');
                  }}
                >
                  <strong>🌐 Crypto (USDT)</strong>
                  <small>Binance QR</small>
                </button>
              </div>
            </div>

            {/* Method-Specific QR Code Box */}
            <div className="easypaisa-qr-section">
              <div className="qr-frame-box">
                {currentMethodConfig.qrCodeUrl ? (
                  <img
                    src={currentMethodConfig.qrCodeUrl}
                    alt={`${paymentMethod} QR Code`}
                    className="custom-qr-img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  renderMethodPlaceholderQr()
                )}
              </div>

              <div className="qr-instructions">
                <div className="ep-badge-row">
                  <span
                    className="ep-pill"
                    style={
                      paymentMethod === 'JazzCash'
                        ? {
                            background: 'rgba(245, 158, 11, 0.18)',
                            color: '#fbbf24',
                            borderColor: 'rgba(245, 158, 11, 0.4)',
                          }
                        : paymentMethod === 'Crypto'
                        ? {
                            background: 'rgba(6, 182, 212, 0.18)',
                            color: '#22d3ee',
                            borderColor: 'rgba(34, 211, 238, 0.4)',
                          }
                        : paymentMethod === 'UPI'
                        ? {
                            background: 'rgba(168, 85, 247, 0.18)',
                            color: '#d8b4fe',
                            borderColor: 'rgba(168, 85, 247, 0.4)',
                          }
                        : undefined
                    }
                  >
                    {paymentMethod === 'EasyPaisa'
                      ? 'EasyPaisa Merchant QR'
                      : paymentMethod === 'JazzCash'
                      ? 'JazzCash Merchant QR'
                      : paymentMethod === 'UPI'
                      ? 'Instant UPI QR (India)'
                      : 'USDT / Binance Pay QR'}
                  </span>
                  <span className="ep-amount-tag">Send {selectedPlan.displayPrice}</span>
                </div>
                <p>{currentMethodConfig.instructions}</p>
                {currentMethodConfig.accountNumber && (
                  <div className="ep-account-meta" style={{ alignItems: 'center' }}>
                    <span>
                      {paymentMethod === 'Crypto'
                        ? 'Network:'
                        : paymentMethod === 'UPI'
                        ? 'Receiver Name:'
                        : 'Title:'}{' '}
                      <strong>{currentMethodConfig.accountTitle}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {paymentMethod === 'Crypto'
                        ? 'ID/Address:'
                        : paymentMethod === 'UPI'
                        ? 'UPI ID (VPA):'
                        : 'No:'}{' '}
                      <strong style={{ color: paymentMethod === 'UPI' ? '#c084fc' : '#ffffff' }}>
                        {currentMethodConfig.accountNumber}
                      </strong>
                    </span>
                    {paymentMethod === 'UPI' && (
                      <button
                        type="button"
                        className="copy-upi-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(currentMethodConfig.accountNumber);
                          setUpiCopied(true);
                          setTimeout(() => setUpiCopied(false), 2000);
                        }}
                      >
                        {upiCopied ? '✓ Copied' : '📋 Copy UPI ID'}
                      </button>
                    )}
                  </div>
                )}
                {paymentMethod === 'UPI' && (
                  <div className="upi-apps-row">
                    <span>Accepted:</span>
                    <span className="app-tag">Google Pay</span>
                    <span className="app-tag">PhonePe</span>
                    <span className="app-tag">Paytm</span>
                    <span className="app-tag">BHIM</span>
                    <span className="app-tag">CRED</span>
                    <span className="app-tag">Any UPI App</span>
                  </div>
                )}
              </div>
            </div>

            {/* Form asking for user's real number or UPI ID */}
            <form onSubmit={handleClickDone} className="easypaisa-form">
              <div className="form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="ep-phone">
                    {paymentMethod === 'EasyPaisa'
                      ? 'Your Registered EasyPaisa Number *'
                      : paymentMethod === 'JazzCash'
                      ? 'Your Registered JazzCash Number *'
                      : paymentMethod === 'UPI'
                      ? 'Your UPI ID (VPA) or Indian Mobile Number *'
                      : 'Your Sender Wallet / Binance UID or Phone *'}
                  </label>
                  {phoneNumber.trim().length > 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: phoneValidation.valid ? '#34d399' : '#f87171',
                      }}
                    >
                      {phoneValidation.valid
                        ? `✓ ${phoneValidation.carrier} (${phoneValidation.formatted})`
                        : '✕ Invalid Number Format'}
                    </span>
                  )}
                </div>
                <input
                  id="ep-phone"
                  type="text"
                  placeholder={
                    paymentMethod === 'UPI'
                      ? 'e.g. username@okhdfcbank or 9876543210@paytm'
                      : paymentMethod === 'Crypto'
                      ? 'e.g. 849201928 or T... Wallet or 0312-3456789'
                      : '0312-3456789 (11-digit valid PK number)'
                  }
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (formError) setFormError('');
                  }}
                  style={
                    phoneNumber.trim().length > 0
                      ? {
                          borderColor: phoneValidation.valid
                            ? 'rgba(52, 211, 153, 0.5)'
                            : 'rgba(248, 113, 113, 0.5)',
                        }
                      : undefined
                  }
                  required
                />
              </div>

              <div className="form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label htmlFor="ep-email" style={{ margin: 0 }}>
                    Email Address (For Instant Receipt &amp; Status from cyabot@zohomail.com) *
                  </label>
                  <span style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 600 }}>
                    ✉️ Auto Mail on Purchase
                  </span>
                </div>
                <input
                  id="ep-email"
                  type="email"
                  placeholder="e.g. yourname@gmail.com or business email"
                  value={buyerEmail}
                  onChange={(e) => {
                    setBuyerEmail(e.target.value);
                    if (formError) setFormError('');
                  }}
                  required
                />
              </div>

              <div className="form-row-two">
                <div className="form-field">
                  <label htmlFor="ep-discord">Discord Username / Server ID</label>
                  <input
                    id="ep-discord"
                    type="text"
                    placeholder="e.g. user#0001 or Server ID"
                    value={discordTag}
                    onChange={(e) => setDiscordTag(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="ep-trx">TID / Reference (Optional)</label>
                  <input
                    id="ep-trx"
                    type="text"
                    placeholder="e.g. 192837465"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                  />
                </div>
              </div>

              {formError && <p className="ep-error-msg">{formError}</p>}

              <button
                type="submit"
                className="wise-plan-btn ep-done-btn"
                disabled={submitting}
              >
                {submitting ? 'Verifying & Generating Receipt...' : 'Done — Generate Receipt & Verify'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
