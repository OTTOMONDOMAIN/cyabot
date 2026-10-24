export interface ReceiptData {
  id: string;
  planName: string;
  amount: string;
  billingCycle: string;
  paymentMethod: string;
  phoneNumber: string;
  discordTag?: string;
  trxId?: string;
  email?: string;
  denialReason?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export function validatePaymentInput(
  method: 'EasyPaisa' | 'JazzCash' | 'Crypto' | 'UPI',
  rawInput: string
): { valid: boolean; formatted: string; carrier?: string; error?: string } {
  const raw = String(rawInput || '').trim();
  const digitsOnly = raw.replace(/[\s\-()]/g, '');

  const checkPakPhone = (digits: string) => {
    let normalized = digits;
    if (normalized.startsWith('+92')) {
      normalized = '0' + normalized.slice(3);
    } else if (normalized.startsWith('92') && normalized.length === 12) {
      normalized = '0' + normalized.slice(2);
    }

    if (!/^03[0-5]\d{8}$/.test(normalized)) {
      return {
        valid: false,
        formatted: raw,
        error: 'Must be a valid 11-digit Pakistani mobile number starting with 030–035 (e.g. 0312-3456789).',
      };
    }

    const prefix = parseInt(normalized.slice(0, 4), 10);
    const subscriber = normalized.slice(4);

    // Reject fake/repetitive patterns like 03000000000, 03121234567, 03001111111
    if (
      /^(\d)\1{6}$/.test(subscriber) ||
      subscriber === '1234567' ||
      subscriber === '7654321' ||
      subscriber === '0123456' ||
      subscriber === '1231231'
    ) {
      return {
        valid: false,
        formatted: raw,
        error: 'Fake or repetitive numbers are not allowed. Enter your real registered mobile number.',
      };
    }

    let carrier = 'Valid PK Network';
    if (prefix >= 300 && prefix <= 309) carrier = 'Jazz / Mobilink';
    else if (prefix >= 310 && prefix <= 319) carrier = 'Zong 4G';
    else if (prefix >= 320 && prefix <= 329) carrier = 'Jazz / Warid';
    else if (prefix >= 330 && prefix <= 339) carrier = 'Ufone 4G';
    else if (prefix >= 340 && prefix <= 349) carrier = 'Telenor / EasyPaisa';
    else if (prefix === 355) carrier = 'SCOM';

    return {
      valid: true,
      formatted: `${normalized.slice(0, 4)}-${normalized.slice(4)}`,
      carrier,
    };
  };

  if (method === 'EasyPaisa' || method === 'JazzCash') {
    return checkPakPhone(digitsOnly);
  }

  if (method === 'UPI') {
    // Check if valid UPI VPA (e.g. name@upi, user@okhdfcbank, 9876543210@paytm)
    if (/^[\w.\-_]{2,64}@[a-zA-Z0-9]{2,32}$/i.test(raw)) {
      return {
        valid: true,
        formatted: raw.toLowerCase(),
        carrier: 'UPI Virtual Payment Address (VPA)',
      };
    }

    // Check Indian mobile number (10 digits starting with 6-9, optional +91 or 0 prefix)
    let inDigits = digitsOnly;
    if (inDigits.startsWith('+91')) inDigits = inDigits.slice(3);
    else if (inDigits.startsWith('91') && inDigits.length === 12) inDigits = inDigits.slice(2);
    else if (inDigits.startsWith('0') && inDigits.length === 11) inDigits = inDigits.slice(1);

    if (/^[6-9]\d{9}$/.test(inDigits)) {
      if (!/^(\d)\1{9}$/.test(inDigits) && inDigits !== '1234567890') {
        return {
          valid: true,
          formatted: `+91 ${inDigits.slice(0, 5)} ${inDigits.slice(5)}`,
          carrier: 'Indian Mobile (UPI Linked)',
        };
      }
    }

    // Also accept 12-digit UTR/TID
    if (/^\d{12}$/.test(raw)) {
      return {
        valid: true,
        formatted: raw,
        carrier: 'UPI UTR / Bank Reference',
      };
    }

    return {
      valid: false,
      formatted: raw,
      error: 'Enter a valid UPI ID (e.g. username@upi, 9876543210@paytm) or a 10-digit Indian mobile number.',
    };
  }

  // Crypto: TRC20, EVM, Binance UID, or PK Phone
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(raw)) {
    return { valid: true, formatted: raw, carrier: 'TRON (TRC20) Address' };
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(raw)) {
    return { valid: true, formatted: raw, carrier: 'EVM / BSC Wallet Address' };
  }
  if (
    /^\d{8,11}$/.test(digitsOnly) &&
    !/^(\d)\1+$/.test(digitsOnly) &&
    digitsOnly !== '12345678' &&
    digitsOnly !== '123456789'
  ) {
    const phoneAttempt = checkPakPhone(digitsOnly);
    if (phoneAttempt.valid) return phoneAttempt;
    return { valid: true, formatted: digitsOnly, carrier: 'Binance Pay UID' };
  }

  return {
    valid: false,
    formatted: raw,
    error: 'Enter a valid 8–10 digit Binance UID, TRC20 wallet (T...), or 03XX mobile number.',
  };
}

export function downloadReceiptImage(receipt: ReceiptData) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1020;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#070b12');
  bgGrad.addColorStop(1, '#04060a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Cyan Glow
  const glow = ctx.createRadialGradient(400, 90, 10, 400, 90, 340);
  glow.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
  glow.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, 400);

  // Outer Card Border
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 720, 940);

  // Header Badge
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL PAYMENT RECEIPT · CYA DISCORD BOT', 400, 105);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 38px system-ui, -apple-system, sans-serif';
  ctx.fillText('cya billing receipt', 400, 155);

  // Status Pill
  const statusLabel =
    receipt.status === 'verified'
      ? '✓ VERIFIED & APPROVED'
      : receipt.status === 'rejected'
      ? '✕ PAYMENT DECLINED'
      : '● VERIFYING PAYMENT (PENDING ADMIN)';
  ctx.fillStyle =
    receipt.status === 'verified'
      ? 'rgba(16, 185, 129, 0.2)'
      : receipt.status === 'rejected'
      ? 'rgba(239, 68, 68, 0.2)'
      : 'rgba(245, 158, 11, 0.18)';
  ctx.fillRect(230, 182, 340, 38);
  ctx.strokeStyle =
    receipt.status === 'verified' ? '#10b981' : receipt.status === 'rejected' ? '#ef4444' : '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(230, 182, 340, 38);

  ctx.fillStyle =
    receipt.status === 'verified' ? '#34d399' : receipt.status === 'rejected' ? '#fca5a5' : '#fbbf24';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(statusLabel, 400, 206);

  // Big Amount Box
  ctx.fillStyle = '#0d131d';
  ctx.fillRect(85, 250, 630, 125);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeRect(85, 250, 630, 125);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOTAL AMOUNT PAID', 400, 286);

  ctx.fillStyle = '#22d3ee';
  ctx.font = '800 44px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${receipt.amount} (${receipt.billingCycle})`, 400, 342);

  // Details Rows
  const rows: Array<[string, string]> = [
    ['Receipt Reference ID', receipt.id],
    ['Date & Timestamp', new Date(receipt.createdAt).toLocaleString()],
    ['Subscribed Plan', receipt.planName],
    ['Billing Frequency', receipt.billingCycle.toUpperCase()],
    ['Payment Gateway', receipt.paymentMethod],
    ['Sender Account / Mobile', receipt.phoneNumber],
    ['Customer Email', receipt.email || 'cyabot@zohomail.com'],
    ['Discord User / Server ID', receipt.discordTag || 'Not Provided'],
    ['Gateway TID / Reference', receipt.trxId || 'Standard QR Payment'],
  ];

  if (receipt.denialReason && receipt.status === 'rejected') {
    rows.push(['Denial Reason', receipt.denialReason]);
  }

  let y = 430;
  rows.forEach(([label, val]) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(label, 95, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 17px monospace, system-ui';
    ctx.fillText(String(val), 705, y);

    // Subtle divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(95, y + 18);
    ctx.lineTo(705, y + 18);
    ctx.stroke();

    y += 52;
  });

  // Notice Box at Bottom
  ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
  ctx.fillRect(85, 855, 630, 80);
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
  ctx.strokeRect(85, 855, 630, 80);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    'Keep this receipt for your records. If verification takes more than 2 days,',
    400,
    888
  );
  ctx.fillStyle = '#22d3ee';
  ctx.fillText(
    'Support: https://dsc.gg/cyaa  |  Official Mail: cyabot@zohomail.com',
    400,
    912
  );

  // Trigger Download
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `Cya-Receipt-${receipt.id}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
