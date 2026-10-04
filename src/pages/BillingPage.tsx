import React, { useState, useEffect } from 'react';
import { useConfig } from '../hooks/useData';
import { Footer } from '../components/Footer';

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

export const BillingPage: React.FC<BillingPageProps> = ({ onNavigate }) => {
  const config = useConfig();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Checkout & Verification State
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EasyPaisa' | 'JazzCash' | 'Crypto'>('EasyPaisa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [trxId, setTrxId] = useState('');
  const [formError, setFormError] = useState('');

  // Step: 'idle' | 'checkout' | 'verifying'
  const [flowStep, setFlowStep] = useState<'idle' | 'checkout' | 'verifying'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTx, setSubmittedTx] = useState<any | null>(null);
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
          });
        }
      })
      .catch(() => {});
  }, []);

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

  // Monthly: 90 Rs / month, 150 Rs / month
  // Annually (15% off per year): 918 Rs / year (90 * 12 * 0.85), 1530 Rs / year (150 * 12 * 0.85)
  const starterPrice = annual ? 918 : 90;
  const premiumPrice = annual ? 1530 : 150;
  const periodUnit = annual ? '/ year' : '/ month';

  const currentMethodConfig = paymentSettings[paymentMethod] || DEFAULT_SETTINGS[paymentMethod];

  const handleSelectPlan = (plan: SelectedPlan) => {
    setSelectedPlan(plan);
    setPaymentMethod('EasyPaisa');
    setFormError('');
    setSubmittedTx(null);
    setFinalSubmittedConfirmation(false);
    setFlowStep('checkout');
  };

  // When user clicks "Done" -> Moves to "Verifying your payment" page and records transaction
  const handleClickDone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setFormError(
        paymentMethod === 'Crypto'
          ? 'Please enter your Sender UID, Wallet, or Phone number so we can verify your payment.'
          : `Please enter your ${paymentMethod} mobile number so we can verify your payment.`
      );
      return;
    }
    setFormError('');
    setFlowStep('verifying');

    if (selectedPlan && !submittedTx) {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planName: selectedPlan.title,
            amount: selectedPlan.displayPrice,
            billingCycle: annual ? 'per year' : 'per month',
            paymentMethod,
            phoneNumber: phoneNumber.trim(),
            discordTag: discordTag.trim() || 'Not specified',
            trxId: trxId.trim() || `${paymentMethod} QR`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSubmittedTx(data.transaction);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // When user clicks "Submit" on the Verifying Payment page -> Confirms & ensures it is in /admin transaction panel
  const handleFinalSubmitToAdmin = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      if (!submittedTx) {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planName: selectedPlan.title,
            amount: selectedPlan.displayPrice,
            billingCycle: annual ? 'per year' : 'per month',
            paymentMethod,
            phoneNumber: phoneNumber.trim(),
            discordTag: discordTag.trim() || 'Not specified',
            trxId: trxId.trim() || `${paymentMethod} QR`,
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
      q: 'How much does it cost if I need more features?',
      a: 'Our Starter plan is just 90 Rs/month (or 918 Rs/year with 15% off) and covers all essential cooldown reductions, vote-gate bypasses, and 24/7 music. For full guild coverage and maximum AI limits, the Premium plan is 150 Rs/month (or 1,530 Rs/year).',
    },
    {
      q: 'How does EasyPaisa, JazzCash, or Crypto QR verification work?',
      a: 'Simply select the 90 Rs or 150 Rs plan, choose your preferred payment method (EasyPaisa, JazzCash, or Crypto), scan the dedicated QR code, enter your number, and click Done. Once submitted, your transaction appears directly in our Admin Transaction Panel for approval.',
    },
    {
      q: 'What if my payment verification takes longer than expected?',
      a: 'Most transactions are verified within a few hours. If your payment takes more than 2 days to verify, please create a support ticket on our official Discord server with your Transaction ID.',
    },
    {
      q: 'How many servers are available in the free plan?',
      a: 'You can invite Cya to unlimited Discord servers on the Free Basic plan with access to 420+ commands, standard antinuke protection, and voice tools.',
    },
    {
      q: 'Who is the 150 Rs Premium plan designed for?',
      a: 'The 150 Rs Premium plan is built for active community owners and power users who want zero vote restrictions, halved global cooldowns, 45/hr AI queries, and priority support.',
    },
    {
      q: 'Can I upgrade from the 90 Rs plan to the 150 Rs plan later?',
      a: 'Yes! You can upgrade anytime by submitting the difference or selecting the 150 Rs Premium tier on your next billing cycle.',
    },
  ];

  const comparisonRows = [
    { feature: 'Global Command Cooldowns', basic: '10s Default', starter: '5s (50% Faster)', premium: '1.5s Instant' },
    { feature: 'AI Ask & Reason Queries / Hr', basic: '10', starter: '25', premium: 'Unlimited' },
    { feature: 'Bypass Top.gg Vote Requirement', basic: false, starter: true, premium: true },
    { feature: '24/7 Music & Audio Equalizer Filters', basic: false, starter: true, premium: true },
    { feature: 'Full Guild-Wide Member Coverage', basic: false, starter: false, premium: true },
    { feature: 'Autonomous Antinuke & Role Recovery', basic: true, starter: true, premium: true },
  ];

  // If user is on the dedicated "Verifying your payment" page
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
                  <span className="spinner-ring"></span>
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
                ? 'Sent to Admin Panel · Awaiting Review'
                : 'Step 2 of 2 · Confirm Submission'}
            </span>

            <h1>Verifying your payment</h1>
            <p className="verifying-lead">
              We are verifying your <strong>{selectedPlan.displayPrice} ({selectedPlan.periodLabel})</strong> {paymentMethod} payment for the{' '}
              <strong>{selectedPlan.title}</strong>.{' '}
              <span className="highlight-warning">
                Please create a ticket on Discord if it takes more than 2 days.
              </span>
            </p>

            {/* Summary Box */}
            <div className="verifying-details-box">
              <div className="detail-row">
                <span>Selected Plan</span>
                <strong>{selectedPlan.title} ({selectedPlan.displayPrice} {selectedPlan.periodLabel})</strong>
              </div>
              <div className="detail-row">
                <span>Payment Method</span>
                <strong style={{ color: '#22d3ee' }}>{paymentMethod}</strong>
              </div>
              <div className="detail-row">
                <span>Sender {paymentMethod === 'Crypto' ? 'UID / Wallet' : 'Mobile Number'}</span>
                <strong>{phoneNumber}</strong>
              </div>
              {discordTag && (
                <div className="detail-row">
                  <span>Discord Account / Server</span>
                  <strong>{discordTag}</strong>
                </div>
              )}
              {submittedTx && (
                <div className="detail-row">
                  <span>Reference ID</span>
                  <code style={{ color: '#22d3ee', fontWeight: 700 }}>{submittedTx.id}</code>
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
                    ? '✕ Declined'
                    : '● Pending Admin Verification'}
                </span>
              </div>
            </div>

            {!finalSubmittedConfirmation ? (
              <div className="verifying-actions">
                <button
                  type="button"
                  className="wise-cta-btn primary-submit-btn"
                  disabled={submitting}
                  onClick={handleFinalSubmitToAdmin}
                >
                  {submitting ? 'Submitting to Admin...' : 'Submit Payment for Verification'}
                </button>
                <button
                  type="button"
                  className="wise-back-btn"
                  onClick={() => setFlowStep('checkout')}
                >
                  ← Edit Payment Details
                </button>
              </div>
            ) : (
              <div className="submitted-success-banner">
                <div className="submitted-check">✓</div>
                <div>
                  <strong>Payment Submitted Successfully!</strong>
                  <p>
                    Your transaction (<code>{submittedTx?.id}</code>) has been sent to the Admin Transaction Panel.
                    If verification takes more than 2 days, open a ticket on our Discord server.
                  </p>
                </div>
              </div>
            )}

            <div className="verifying-footer-links">
              <a
                href={config.supportServerUrl || 'https://dsc.gg/cya'}
                target="_blank"
                rel="noopener noreferrer"
                className="discord-ticket-btn"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.075.075 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.394-.405-.875-.618-1.25a.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.935 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.042 2.423 5.993 3.03a.077.077 0 0 0 .084-.028c.461-.63.873-1.295 1.226-1.994a.077.077 0 0 0-.042-.105 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.082.082 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028Z" />
                </svg>
                <span>Create Ticket on Discord (If &gt; 2 Days)</span>
              </a>

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

              {/* Card 2: Starter / Standard Plan (90 Rs/mo or 918 Rs/yr) */}
              <article className="wise-plan-card featured-card">
                <div className="wise-card-body">
                  <span className="wise-plan-label">Starter plan</span>
                  <div className="wise-price-block">
                    <strong className="wise-price-big">{starterPrice} Rs</strong>
                    <span className="wise-price-period">{periodUnit}</span>
                  </div>
                  <p className="wise-plan-desc">
                    {annual ? 'Billed yearly (Save 15% vs monthly).' : 'Ideal for growing communities.'}
                  </p>

                  <ul className="wise-feature-list">
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>50% Faster Command Cooldowns</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Skip All 20+ Top.gg Vote Gates</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>24/7 Non-Stop Music Radio</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Unified Server Analytics</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Dynamic VoiceMaster Access</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    className="wise-plan-btn"
                    onClick={() =>
                      handleSelectPlan({
                        id: 'starter-90',
                        title: 'Starter Plan',
                        priceMonthly: 90,
                        priceAnnual: 918,
                        displayPrice: `${starterPrice} Rs`,
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

              {/* Card 3: Premium Plan (150 Rs/mo or 1530 Rs/yr) */}
              <article className="wise-plan-card">
                <div className="wise-card-body">
                  <span className="wise-plan-label">Premium plan</span>
                  <div className="wise-price-block">
                    <strong className="wise-price-big">{premiumPrice} Rs</strong>
                    <span className="wise-price-period">{periodUnit}</span>
                  </div>
                  <p className="wise-plan-desc">
                    {annual ? 'Billed yearly (Save 15% vs monthly).' : 'Works best for large & power servers.'}
                  </p>

                  <ul className="wise-feature-list">
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Unlimited Guild + User Coverage</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Unlimited /ai ask &amp; /ai reason</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Instant Antinuke Role Recovery</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>All Audio Equalizer Filters (8D)</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Custom Ticket HTML Transcripts</span>
                    </li>
                    <li>
                      <span className="wise-check-icon">✓</span>
                      <span>Dedicated VIP Priority Support</span>
                    </li>
                  </ul>

                  <button
                    type="button"
                    className="wise-plan-btn"
                    onClick={() =>
                      handleSelectPlan({
                        id: 'premium-150',
                        title: 'Premium Plan',
                        priceMonthly: 150,
                        priceAnnual: 1530,
                        displayPrice: `${premiumPrice} Rs`,
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
                <div className="col-tier">Starter ({starterPrice} Rs)</div>
                <div className="col-tier">Premium ({premiumPrice} Rs)</div>
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
                      id: 'premium-150',
                      title: 'Premium Plan',
                      priceMonthly: 150,
                      priceAnnual: 1530,
                      displayPrice: `${premiumPrice} Rs`,
                      periodLabel: annual ? 'per year' : 'per month',
                      subtitle: 'Works best for large & power servers',
                    })
                  }
                >
                  Get Cya Premium
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
                  className={`method-tab-btn ${paymentMethod === 'EasyPaisa' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('EasyPaisa')}
                >
                  <strong>EasyPaisa</strong>
                  <small>EasyPaisa QR</small>
                </button>
                <button
                  type="button"
                  className={`method-tab-btn ${paymentMethod === 'JazzCash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('JazzCash')}
                >
                  <strong>JazzCash</strong>
                  <small>JazzCash QR</small>
                </button>
                <button
                  type="button"
                  className={`method-tab-btn ${paymentMethod === 'Crypto' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('Crypto')}
                >
                  <strong>Crypto (USDT)</strong>
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
                        : undefined
                    }
                  >
                    {paymentMethod === 'EasyPaisa'
                      ? 'EasyPaisa Merchant QR'
                      : paymentMethod === 'JazzCash'
                      ? 'JazzCash Merchant QR'
                      : 'USDT / Binance Pay QR'}
                  </span>
                  <span className="ep-amount-tag">Send {selectedPlan.displayPrice}</span>
                </div>
                <p>{currentMethodConfig.instructions}</p>
                {currentMethodConfig.accountNumber && (
                  <div className="ep-account-meta">
                    <span>
                      {paymentMethod === 'Crypto' ? 'Network:' : 'Title:'}{' '}
                      <strong>{currentMethodConfig.accountTitle}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {paymentMethod === 'Crypto' ? 'ID/Address:' : 'No:'}{' '}
                      <strong>{currentMethodConfig.accountNumber}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Form asking for user's number */}
            <form onSubmit={handleClickDone} className="easypaisa-form">
              <div className="form-field">
                <label htmlFor="ep-phone">
                  {paymentMethod === 'EasyPaisa'
                    ? 'Your EasyPaisa Mobile Number *'
                    : paymentMethod === 'JazzCash'
                    ? 'Your JazzCash Mobile Number *'
                    : 'Your Sender Wallet / Binance UID or Phone *'}
                </label>
                <input
                  id="ep-phone"
                  type="text"
                  placeholder={
                    paymentMethod === 'Crypto'
                      ? 'Enter your Binance UID, Wallet, or Phone'
                      : '03XX-XXXXXXX'
                  }
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
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

              <button type="submit" className="wise-plan-btn ep-done-btn">
                Done — Proceed to Verification
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
