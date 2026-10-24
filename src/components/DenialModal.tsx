import React, { useState } from 'react';
import { ReceiptData } from '../utils/receiptGenerator';

interface DenialModalProps {
  tx: ReceiptData | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  'Payment transaction ID (TID) could not be verified in payment gateway records.',
  'Incomplete transfer: Received payment amount was less than plan subscription price.',
  'Sender account number / mobile does not match payment gateway statement.',
  'Duplicate transaction reference: This TID has already been redeemed.',
  'Invalid payment screenshot or unverified recipient account.',
];

export const DenialModal: React.FC<DenialModalProps> = ({ tx, onClose, onConfirm }) => {
  const [reason, setReason] = useState(PRESET_REASONS[0]);
  const [submitting, setSubmitting] = useState(false);

  if (!tx) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wise-modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="wise-checkout-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', background: '#0b1120', border: '1px solid rgba(239, 68, 68, 0.4)' }}
      >
        <button type="button" className="wise-modal-close" onClick={onClose}>
          ✕
        </button>

        <span className="modal-eyebrow" style={{ color: '#f87171' }}>
          Payment Denial &bull; Automated Email Notice
        </span>

        <h3 style={{ margin: '4px 0 8px', color: '#ffffff', fontSize: '18px' }}>
          Deny Order {tx.id}
        </h3>

        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
          This will mark the transaction as <strong>Denied</strong> and automatically dispatch an official denial email to{' '}
          <strong style={{ color: '#38bdf8' }}>{tx.email || 'the customer'}</strong> from{' '}
          <code style={{ color: '#22d3ee' }}>cyabot@zohomail.com</code> with your explanation and appeal instructions.
        </p>

        {/* Order Details summary */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12.5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#64748b' }}>Plan &amp; Amount:</span>
            <strong style={{ color: '#fff' }}>{tx.planName} &bull; {tx.amount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#64748b' }}>Gateway &amp; Sender:</span>
            <span style={{ color: '#cbd5e1' }}>{tx.paymentMethod} &bull; {tx.phoneNumber}</span>
          </div>
          {tx.email && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Target Email:</span>
              <strong style={{ color: '#38bdf8' }}>{tx.email}</strong>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: '8px' }}>
              Select Common Denial Preset:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: reason === preset ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: reason === preset ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: reason === preset ? '#fca5a5' : '#cbd5e1',
                    fontSize: '12px',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                  }}
                >
                  &bull; {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-field" style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
              Denial Reason (Sent in Customer Email):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the transaction was declined..."
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                padding: '10px 12px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              className="action-btn reject"
              style={{ flex: 1, padding: '12px', fontSize: '13px', fontWeight: 700 }}
              disabled={submitting}
            >
              {submitting ? 'Sending Email & Denying...' : '✕ Confirm Denial & Send Email'}
            </button>
            <button
              type="button"
              className="action-btn reset"
              style={{ padding: '12px 18px', fontSize: '13px' }}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
