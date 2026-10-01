import React, { useState } from 'react';
import { useConfig } from '../hooks/useData';

interface CheckoutModalProps {
  selectedTier: { name: string; duration: string; price: string } | null;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ selectedTier, onClose }) => {
  const config = useConfig();
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'crypto' | 'binance' | 'paypal'>('crypto');

  if (!selectedTier) return null;

  const ticketUrl = config.supportServerUrl || 'https://dsc.gg/cya';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0c1014',
          border: '1px solid rgba(34, 211, 238, 0.25)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.7), 0 0 35px rgba(6, 182, 212, 0.2)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#949ba4',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        <span style={{ fontSize: '12px', fontWeight: 600, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Cya Premium
        </span>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: '4px 0 16px' }}>
          {selectedTier.name} Plan ({selectedTier.duration})
        </h2>

        <div
          style={{
            backgroundColor: '#06090c',
            border: '1px solid rgba(34, 211, 238, 0.15)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ color: '#71717a', fontSize: '13px' }}>Price</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#22d3ee' }}>{selectedTier.price}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#71717a', fontSize: '13px' }}>Coverage</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>User or Guild</div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
            Select Preferred Payment Method
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { id: 'crypto', label: 'Crypto (USDT / SOL / LTC)', badge: 'Instant' },
              { id: 'upi', label: 'UPI / GPay / PhonePe', badge: 'INR' },
              { id: 'binance', label: 'Binance Pay', badge: '0% fee' },
              { id: 'paypal', label: 'PayPal (>$5.00)', badge: 'Ticket' },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as any)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px',
                  borderRadius: '12px',
                  border: paymentMethod === method.id ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.06)',
                  backgroundColor: paymentMethod === method.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{method.label}</span>
                </div>
                <span style={{ fontSize: '11px', color: paymentMethod === method.id ? '#22d3ee' : '#71717a' }}>{method.badge}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#888b94', lineHeight: 1.5, marginBottom: '24px' }}>
          Payments are handled securely via ticket on our official Discord server. Once opened, mention your chosen plan (<strong>{selectedTier.name}</strong>) and payment method.
        </div>

        <a
          href={ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            color: '#fff',
            borderRadius: '999px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.35)',
            transition: 'all 0.2s',
          }}
        >
          <span>Open Ticket to Purchase</span>
          <span>↗</span>
        </a>
      </div>
    </div>
  );
};
