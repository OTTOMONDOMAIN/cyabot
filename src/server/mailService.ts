import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const emailLogsPath = path.join(__dirname, '..', 'data', 'email_logs.json');

export interface EmailLogEntry {
  id: string;
  to: string;
  from: string;
  subject: string;
  type: 'purchase_confirm' | 'payment_verified' | 'payment_denied' | 'bot_mail' | 'test';
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
  details?: string;
  timestamp: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export function getSmtpConfig(): SmtpConfig {
  const host = (process.env.SMTP_HOST || 'smtp.zoho.com').trim();
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = (process.env.SMTP_USER || 'cyabot@zohomail.com').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const from = (process.env.SMTP_FROM || `"Cya Bot Billing" <${user}>`).trim();
  const secure = process.env.SMTP_SECURE === 'false' || port === 587 ? false : true;

  return { host, port, secure, user, pass, from };
}

export function readEmailLogs(): EmailLogEntry[] {
  try {
    if (fs.existsSync(emailLogsPath)) {
      return JSON.parse(fs.readFileSync(emailLogsPath, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read email_logs.json:', err);
  }
  return [];
}

export function appendEmailLog(entry: EmailLogEntry): void {
  try {
    const logs = readEmailLogs();
    logs.unshift(entry);
    if (logs.length > 100) logs.splice(100);
    fs.writeFileSync(emailLogsPath, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write email_logs.json:', err);
  }
}

function getTransporter() {
  const config = getSmtpConfig();
  if (!config.pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Useful for Zoho / Gmail with secure options
    tls: {
      rejectUnauthorized: false,
    },
  });
}

function wrapEmailTemplate(title: string, badgeText: string, badgeBg: string, badgeColor: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050811; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050811; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: #0c1222; border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.5);" cellspacing="0" cellpadding="0">
          
          <!-- Top Neon Header -->
          <tr>
            <td style="padding: 28px 32px 20px; background: linear-gradient(180deg, rgba(6, 182, 212, 0.12) 0%, rgba(12, 18, 34, 0) 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
              <table role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 8px 14px; background: rgba(34, 211, 238, 0.1); border: 1px solid rgba(34, 211, 238, 0.3); border-radius: 999px; margin-bottom: 14px;">
                      <span style="color: #22d3ee; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">CYA DISCORD BOT</span>
                    </div>
                    <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${title}</h1>
                    <div style="display: inline-block; padding: 4px 12px; background: ${badgeBg}; color: ${badgeColor}; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                      ${badgeText}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: #070b16; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">
                Official automated notice sent by <strong>Cya Bot</strong> &bull; <a href="mailto:cyabot@zohomail.com" style="color: #38bdf8; text-decoration: none;">cyabot@zohomail.com</a>
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                Need help or have questions? Join our <a href="https://dsc.gg/cyaa" style="color: #22d3ee; text-decoration: underline;">Discord Support Server</a> or open a ticket.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendMailInternal(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: EmailLogEntry['type'];
  details?: string;
}): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const config = getSmtpConfig();
  const logId = `EML-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const cleanTo = (params.to || '').trim();

  if (!cleanTo || !cleanTo.includes('@')) {
    const errorMsg = 'Invalid recipient email address';
    appendEmailLog({
      id: logId,
      to: cleanTo,
      from: config.from,
      subject: params.subject,
      type: params.type,
      status: 'failed',
      error: errorMsg,
      details: params.details,
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: errorMsg };
  }

  const transporter = getTransporter();

  // If no SMTP password provided, simulate and log gracefully
  if (!transporter) {
    console.log(`[MailService Simulated] To: ${cleanTo} | Subject: ${params.subject} (Configure SMTP_PASS in .env to send real Zoho Mail)`);
    appendEmailLog({
      id: logId,
      to: cleanTo,
      from: config.from,
      subject: params.subject,
      type: params.type,
      status: 'simulated',
      details: `${params.details || ''} [Simulated: Set SMTP_PASS in .env to deliver real Zoho/Gmail emails]`,
      timestamp: new Date().toISOString(),
    });
    return {
      success: true,
      simulated: true,
    };
  }

  try {
    await transporter.sendMail({
      from: config.from,
      to: cleanTo,
      subject: params.subject,
      html: params.html,
      text: params.text || params.subject,
    });

    appendEmailLog({
      id: logId,
      to: cleanTo,
      from: config.from,
      subject: params.subject,
      type: params.type,
      status: 'sent',
      details: params.details,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (err: any) {
    console.error('Mail delivery error:', err);
    const errorMsg = err?.message || 'SMTP delivery failed';
    appendEmailLog({
      id: logId,
      to: cleanTo,
      from: config.from,
      subject: params.subject,
      type: params.type,
      status: 'failed',
      error: errorMsg,
      details: params.details,
      timestamp: new Date().toISOString(),
    });
    return { success: false, error: errorMsg };
  }
}

// 1. Send Order Confirmation Email when user submits purchase
export async function sendPurchaseConfirmationEmail(tx: {
  id: string;
  planName: string;
  amount: string;
  billingCycle: string;
  paymentMethod: string;
  phoneNumber: string;
  discordTag?: string;
  trxId?: string;
  email?: string;
}) {
  if (!tx.email) return { success: false, error: 'No email provided in transaction' };

  const contentHtml = `
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
      Thank you for purchasing <strong>${tx.planName}</strong> for Cya Bot! We have received your order details and payment submission.
    </p>

    <!-- Receipt Details Table -->
    <table role="presentation" width="100%" style="margin: 20px 0; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; font-size: 13.5px;" cellpadding="10">
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <td style="color: #94a3b8; width: 40%;">Order Reference:</td>
        <td style="color: #38bdf8; font-weight: 700; font-family: monospace;">${tx.id}</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <td style="color: #94a3b8;">Plan Subscribed:</td>
        <td style="color: #ffffff; font-weight: 600;">${tx.planName} (${tx.billingCycle})</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <td style="color: #94a3b8;">Amount Paid:</td>
        <td style="color: #22d3ee; font-weight: 800; font-size: 15px;">${tx.amount}</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <td style="color: #94a3b8;">Payment Gateway:</td>
        <td style="color: #ffffff;">${tx.paymentMethod}</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <td style="color: #94a3b8;">Account / Number:</td>
        <td style="color: #ffffff; font-family: monospace;">${tx.phoneNumber}</td>
      </tr>
      ${tx.discordTag ? `
      <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <td style="color: #94a3b8;">Discord Username / Server:</td>
        <td style="color: #ffffff;">${tx.discordTag}</td>
      </tr>` : ''}
      ${tx.trxId ? `
      <tr>
        <td style="color: #94a3b8;">Gateway TID / Ref:</td>
        <td style="color: #e2e8f0; font-family: monospace;">${tx.trxId}</td>
      </tr>` : ''}
    </table>

    <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
      <strong style="color: #fbbf24; font-size: 13px; display: block; margin-bottom: 4px;">⏳ Verification in Progress</strong>
      <span style="color: #cbd5e1; font-size: 12.5px; line-height: 1.5;">
        Our billing administrators are reviewing your transaction. Most payments are verified within a few hours. Once verified, you will receive an approval email and premium features will be activated immediately!
      </span>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://dsc.gg/cyaa" style="display: inline-block; padding: 12px 26px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
        Join Support Server &bull; dsc.gg/cyaa
      </a>
    </div>
  `;

  const html = wrapEmailTemplate(
    'Payment Received & Queued',
    'Pending Verification',
    'rgba(245, 158, 11, 0.2)',
    '#fbbf24',
    contentHtml
  );

  return sendMailInternal({
    to: tx.email,
    subject: `🛒 Order Received: ${tx.planName} (Ref ${tx.id}) | Cya Bot`,
    html,
    type: 'purchase_confirm',
    details: `Plan: ${tx.planName} | Ref: ${tx.id} | Amount: ${tx.amount}`,
  });
}

// 2. Send Payment Verified & Approved Email
export async function sendPaymentVerifiedEmail(tx: {
  id: string;
  planName: string;
  amount: string;
  billingCycle: string;
  paymentMethod: string;
  phoneNumber: string;
  discordTag?: string;
  email?: string;
}) {
  if (!tx.email) return { success: false, error: 'No email provided in transaction' };

  const contentHtml = `
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
      Great news! Your payment for <strong>${tx.planName}</strong> (${tx.amount}) has been <span style="color: #34d399; font-weight: 700;">successfully verified</span> by the Cya Bot administration team!
    </p>

    <!-- Success highlight card -->
    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px 20px; margin: 20px 0; text-align: center;">
      <div style="color: #34d399; font-size: 28px; margin-bottom: 6px;">🎉</div>
      <h3 style="margin: 0 0 6px; color: #ffffff; font-size: 17px;">Premium Perks are Now Active!</h3>
      <p style="margin: 0; color: #94a3b8; font-size: 13px;">
        Ref ID: <strong style="color: #38bdf8; font-family: monospace;">${tx.id}</strong> &bull; Plan: <strong>${tx.planName}</strong>
      </p>
    </div>

    <h4 style="color: #e2e8f0; font-size: 14px; margin: 18px 0 8px;">What's unlocked for your server:</h4>
    <ul style="color: #94a3b8; font-size: 13px; line-height: 1.8; margin: 0 0 20px 18px; padding: 0;">
      <li><strong style="color: #ffffff;">No Prefix Mode:</strong> Execute commands seamlessly without standard prefixes.</li>
      <li><strong style="color: #ffffff;">Unlimited Embeds & AI Commands:</strong> Supercharge your server automation.</li>
      <li><strong style="color: #ffffff;">24/7 Voice & High-Fidelity Audio:</strong> Keep music and voice channels alive round-the-clock.</li>
      <li><strong style="color: #ffffff;">Custom Bot Persona:</strong> Customized profile picture &amp; banner for your community.</li>
    </ul>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://dsc.gg/cyaa" style="display: inline-block; padding: 12px 26px; background: linear-gradient(135deg, #10b981, #06b6d4); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
        Go to Support Server &amp; Claim Role
      </a>
    </div>
  `;

  const html = wrapEmailTemplate(
    'Payment Verified & Approved!',
    '✓ Verified',
    'rgba(16, 185, 129, 0.2)',
    '#34d399',
    contentHtml
  );

  return sendMailInternal({
    to: tx.email,
    subject: `🎉 Payment Verified & Premium Activated (Ref ${tx.id}) | Cya Bot`,
    html,
    type: 'payment_verified',
    details: `Verified Ref: ${tx.id} for ${tx.planName}`,
  });
}

// 3. Send Payment Denied Email when Admin rejects transaction
export async function sendPaymentDeniedEmail(
  tx: {
    id: string;
    planName: string;
    amount: string;
    paymentMethod: string;
    phoneNumber: string;
    email?: string;
  },
  reason?: string
) {
  if (!tx.email) return { success: false, error: 'No email provided in transaction' };

  const denialNote = (reason || '').trim() || 'Payment transaction ID or sender details could not be verified against the payment gateway statement.';

  const contentHtml = `
    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
      We are writing to inform you that your payment submission for <strong>${tx.planName}</strong> (Order Ref: <code style="color: #f87171;">${tx.id}</code>) could not be approved and has been <strong>Denied</strong> by our billing team.
    </p>

    <!-- Denial Reason Card -->
    <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
      <strong style="color: #fca5a5; font-size: 13.5px; display: block; margin-bottom: 6px;">✕ Reason for Denial:</strong>
      <p style="margin: 0; color: #f1f5f9; font-size: 13px; line-height: 1.6;">
        ${denialNote}
      </p>
    </div>

    <!-- Summary -->
    <table role="presentation" width="100%" style="margin: 16px 0; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; font-size: 13px;" cellpadding="8">
      <tr>
        <td style="color: #94a3b8; width: 40%;">Order Ref:</td>
        <td style="color: #ffffff; font-family: monospace;">${tx.id}</td>
      </tr>
      <tr>
        <td style="color: #94a3b8;">Plan:</td>
        <td style="color: #ffffff;">${tx.planName}</td>
      </tr>
      <tr>
        <td style="color: #94a3b8;">Reported Amount:</td>
        <td style="color: #ffffff;">${tx.amount}</td>
      </tr>
      <tr>
        <td style="color: #94a3b8;">Gateway:</td>
        <td style="color: #ffffff;">${tx.paymentMethod}</td>
      </tr>
    </table>

    <h4 style="color: #e2e8f0; font-size: 14px; margin: 20px 0 8px;">Believe this is a mistake?</h4>
    <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
      If you already completed this transaction, please do not worry! Open a support ticket on our Discord server and attach your official mobile banking transaction SMS or receipt screenshot. Our team will manually review and resolve it promptly.
    </p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://dsc.gg/cyaa" style="display: inline-block; padding: 12px 26px; background: linear-gradient(135deg, #ef4444, #f97316); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">
        Open Discord Ticket &bull; Appeal Denial
      </a>
    </div>
  `;

  const html = wrapEmailTemplate(
    'Payment Submission Denied',
    '✕ Denied',
    'rgba(239, 68, 68, 0.2)',
    '#f87171',
    contentHtml
  );

  return sendMailInternal({
    to: tx.email,
    subject: `⚠️ Payment Denied: Transaction Ref ${tx.id} | Cya Bot`,
    html,
    type: 'payment_denied',
    details: `Denied Ref: ${tx.id} | Reason: ${denialNote}`,
  });
}

// 4. Send Custom Bot Mail (Called by Discord Bot's /mail slash command or Admin Panel)
export async function sendCustomBotMail(params: {
  to: string;
  subject?: string;
  message: string;
  senderBotTag?: string;
}) {
  const subject = params.subject?.trim() || 'Official Message from Cya Bot';
  const sender = params.senderBotTag?.trim() || 'Cya Discord Bot';

  const contentHtml = `
    <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #c7d2fe;">
      ✉️ Message sent by <strong>${sender}</strong> via Cya Bot Mail Delivery System
    </div>

    <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 20px; font-size: 14px; line-height: 1.7; color: #f1f5f9; white-space: pre-wrap;">
${params.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://dsc.gg/cyaa" style="display: inline-block; padding: 10px 22px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); color: #e2e8f0; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px;">
        Join Official Discord &bull; dsc.gg/cyaa
      </a>
    </div>
  `;

  const html = wrapEmailTemplate(
    subject,
    'Bot Direct Mail',
    'rgba(99, 102, 241, 0.2)',
    '#a5b4fc',
    contentHtml
  );

  return sendMailInternal({
    to: params.to,
    subject: `${subject} | Cya Bot`,
    html,
    text: params.message,
    type: 'bot_mail',
    details: `From: ${sender} | Subject: ${subject}`,
  });
}
