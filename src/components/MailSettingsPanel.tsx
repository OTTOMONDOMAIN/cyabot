import React, { useState } from 'react';

interface SmtpInfo {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  hasPass: boolean;
}

interface MailLogItem {
  id: string;
  to: string;
  from: string;
  subject: string;
  type: string;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
  details?: string;
  timestamp: string;
}

interface MailSettingsPanelProps {
  token: string;
  smtpStatus: SmtpInfo | null;
  mailLogs: MailLogItem[];
  loadingMailLogs: boolean;
  onRefreshLogs: () => void;
  onMailToast: (msg: string) => void;
}

export const MailSettingsPanel: React.FC<MailSettingsPanelProps> = ({
  token,
  smtpStatus,
  mailLogs,
  loadingMailLogs,
  onRefreshLogs,
  onMailToast,
}) => {
  // SMTP credentials form state
  const [editSmtpHost, setEditSmtpHost] = useState(smtpStatus?.host || 'smtp.zoho.com');
  const [editSmtpPort, setEditSmtpPort] = useState(smtpStatus?.port || 465);
  const [editSmtpUser, setEditSmtpUser] = useState(smtpStatus?.user || 'cyabot@zohomail.com');
  const [editSmtpPass, setEditSmtpPass] = useState('');
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpSavedMsg, setSmtpSavedMsg] = useState('');

  // Test mail form state
  const [testMailRecipient, setTestMailRecipient] = useState('');
  const [sendingTestMail, setSendingTestMail] = useState(false);
  const [testMailMsg, setTestMailMsg] = useState('');

  // Snippet language
  const [snippetLanguage, setSnippetLanguage] = useState<'python' | 'javascript'>('python');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Direct web mail dispatch
  const [customMailRecipient, setCustomMailRecipient] = useState('');
  const [customMailSubject, setCustomMailSubject] = useState('Official Notice from Cya Bot Team');
  const [customMailBody, setCustomMailBody] = useState('');
  const [sendingCustomMail, setSendingCustomMail] = useState(false);
  const [customMailMsg, setCustomMailMsg] = useState('');

  const handleSaveSmtp = async (e: React.FormEvent) => {
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
          host: editSmtpHost.trim(),
          port: Number(editSmtpPort),
          user: editSmtpUser.trim(),
          pass: editSmtpPass.trim(),
          from: `"Cya Bot Billing" <${editSmtpUser.trim()}>`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSmtpSavedMsg('✓ SMTP credentials saved to .env & active!');
        onMailToast('✓ SMTP credentials saved to .env');
        onRefreshLogs();
      } else {
        setSmtpSavedMsg(`✕ Failed: ${data.error || 'Unknown error'}`);
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
        onMailToast('✓ Test email dispatched!');
        onRefreshLogs();
      } else {
        setTestMailMsg(`✕ ${data.error || 'Failed to send test email'}`);
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
        onMailToast(`✓ Email sent to ${customMailRecipient}`);
        setCustomMailBody('');
        onRefreshLogs();
      } else {
        setCustomMailMsg(`✕ ${data.error || 'Failed to send email'}`);
      }
    } catch (err: any) {
      setCustomMailMsg(`✕ Error: ${err.message}`);
    } finally {
      setSendingCustomMail(false);
      setTimeout(() => setCustomMailMsg(''), 5000);
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-xnd7yjx4ckthqewf466huu-229885291959.asia-east1.run.app';

  const pythonSnippet = `# Cya Bot Slash Command: /mail (Python / discord.py)
import discord
from discord import app_commands
import aiohttp

API_ENDPOINT = "${currentOrigin}/api/mail/send"
# Your bot token or admin token
AUTH_TOKEN = "${token || 'cya_admin_token_99482716'}"

@bot.tree.command(name="mail", description="Send an official email from cyabot@zohomail.com")
@app_commands.describe(
    target="Recipient email address (e.g. user@gmail.com)",
    message="Message content to send to the recipient",
    subject="Email subject line (Optional)"
)
async def mail(interaction: discord.Interaction, target: str, message: str, subject: str = "Message from Cya Bot Team"):
    # Restrict to administrators or bot owners
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message("❌ Only server administrators can use /mail.", ephemeral=True)
        return

    await interaction.response.defer(ephemeral=True)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AUTH_TOKEN}"
    }
    payload = {
        "to": target.strip(),
        "subject": subject.strip(),
        "message": message.strip(),
        "senderBotTag": f"{interaction.user.name} ({interaction.user.id})"
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(API_ENDPOINT, json=payload, headers=headers, timeout=15) as resp:
                data = await resp.json()
                if resp.status == 200 and data.get("success"):
                    embed = discord.Embed(
                        title="✉️ Email Sent Successfully!",
                        description=f"**To:** \`{target}\`\\n**Subject:** {subject}\\n**From:** \`cyabot@zohomail.com\`",
                        color=0x22c55e
                    )
                    embed.add_field(name="Message", value=f"\`\`\`{message[:900]}\`\`\`", inline=False)
                    embed.set_footer(text="Sent via Zoho Mail SMTP • Cya Bot System")
                    await interaction.followup.send(embed=embed, ephemeral=True)
                else:
                    await interaction.followup.send(f"❌ Failed: {data.get('error', 'Error')}", ephemeral=True)
    except Exception as exc:
        await interaction.followup.send(f"⚠️ Network error: {exc}", ephemeral=True)
`;

  const jsSnippet = `// Cya Bot Slash Command: /mail (JavaScript / discord.js v14)
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const API_ENDPOINT = "${currentOrigin}/api/mail/send";
const AUTH_TOKEN = "${token || 'cya_admin_token_99482716'}";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mail')
    .setDescription('Send an official email from cyabot@zohomail.com')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('target')
        .setDescription('Recipient email address (e.g. user@gmail.com)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Message to send to the recipient')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('subject')
        .setDescription('Email subject line (Optional)')
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getString('target').trim();
    const message = interaction.options.getString('message').trim();
    const subject = interaction.options.getString('subject')?.trim() || 'Official Message from Cya Bot Team';

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${AUTH_TOKEN}\`,
        },
        body: JSON.stringify({
          to: target,
          subject,
          message,
          senderBotTag: \`\${interaction.user.tag} (\${interaction.user.id})\`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const embed = new EmbedBuilder()
          .setTitle('✉️ Email Sent Successfully!')
          .setDescription(\`**To:** \\\`\${target}\\\`\\n**Subject:** \${subject}\\n**From:** \\\`cyabot@zohomail.com\\\`\`)
          .addFields({ name: 'Message Preview', value: \`\\\`\\\`\\\`\${message.slice(0, 900)}\\\`\\\`\\\`\` })
          .setColor(0x22c55e)
          .setFooter({ text: 'Sent via Zoho Mail SMTP • Cya Bot' });

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({ content: \`❌ Failed: \${data.error || 'Unknown error'}\` });
      }
    } catch (err) {
      await interaction.editReply({ content: \`⚠️ Error: \${err.message}\` });
    }
  },
};
`;

  return (
    <section className="admin-settings-panel">
      {/* Header */}
      <div className="settings-header-flex" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2>Automated Customer Mail &amp; Discord Bot /mail Integration</h2>
          <p className="settings-desc" style={{ marginBottom: 0 }}>
            Automated emails are sent from <strong style={{ color: '#22d3ee' }}>cyabot@zohomail.com</strong> on purchase, approval, and order denial with explanations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              background: smtpStatus?.hasPass ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: smtpStatus?.hasPass ? '#34d399' : '#fbbf24',
              border: smtpStatus?.hasPass ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            {smtpStatus?.hasPass ? '● SMTP Password Active' : '● Simulation Mode (Logs in DB)'}
          </span>
          <button
            type="button"
            className="admin-refresh-btn"
            onClick={onRefreshLogs}
            disabled={loadingMailLogs}
          >
            ↻ {loadingMailLogs ? 'Loading...' : 'Refresh Logs'}
          </button>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '18px 0' }} />

      {/* Zoho Mail vs Gmail Explanation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: Zoho Mail Setup */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✉️ Zoho Mail Setup</span>
              <span style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.2)', padding: '2px 8px', borderRadius: '4px', color: '#c7d2fe' }}>
                Pre-Configured Default
              </span>
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 12px' }}>
            <strong>Can you use Zoho Mail?</strong> Yes! Zoho Mail uses standard secure SMTP out of the box.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.8, marginBottom: '12px' }}>
            <div>&bull; <strong>Server Host:</strong> <code>smtp.zoho.com</code> (Port 465 SSL)</div>
            <div>&bull; <strong>Sender / User:</strong> <code>cyabot@zohomail.com</code></div>
            <div>&bull; <strong>Password:</strong> Generate an <strong>App Password</strong> in Zoho Account &rarr; Security &rarr; App Passwords.</div>
          </div>
          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
            An App Password is required by Zoho when Two-Factor Authentication (2FA) is turned on for your Zoho account.
          </span>
        </div>

        {/* Card 2: Gmail Alternative */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(234, 88, 12, 0.05)',
            border: '1px solid rgba(234, 88, 12, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔴 Or Prefer Gmail?</span>
              <span style={{ fontSize: '11px', background: 'rgba(234, 88, 12, 0.2)', padding: '2px 8px', borderRadius: '4px', color: '#fed7aa' }}>
                Fully Supported
              </span>
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 12px' }}>
            <strong>Or I get Gmail?</strong> You can use your Gmail account! Simply switch the host in the credentials form below.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.8, marginBottom: '12px' }}>
            <div>&bull; <strong>Server Host:</strong> <code>smtp.gmail.com</code> (Port 465 SSL)</div>
            <div>&bull; <strong>Sender / User:</strong> Your Gmail address</div>
            <div>&bull; <strong>Password:</strong> 16-character <strong>App Password</strong> from Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords.</div>
          </div>
          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
            Both Zoho Mail and Gmail use Port 465 SSL with nodemailer.
          </span>
        </div>
      </div>

      {/* SMTP Form & Test Mail Dispatcher Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Credentials Form */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: '#ffffff' }}>⚙️ SMTP Credentials (Saved to .env)</h3>
          <form onSubmit={handleSaveSmtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div className="admin-field">
                <label style={{ fontSize: '12px' }}>SMTP Server Host</label>
                <input
                  type="text"
                  value={editSmtpHost}
                  onChange={(e) => setEditSmtpHost(e.target.value)}
                  placeholder="smtp.zoho.com or smtp.gmail.com"
                  required
                />
              </div>
              <div className="admin-field">
                <label style={{ fontSize: '12px' }}>Port</label>
                <input
                  type="number"
                  value={editSmtpPort}
                  onChange={(e) => setEditSmtpPort(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="admin-field">
              <label style={{ fontSize: '12px' }}>SMTP User / Email</label>
              <input
                type="email"
                value={editSmtpUser}
                onChange={(e) => setEditSmtpUser(e.target.value)}
                placeholder="cyabot@zohomail.com"
                required
              />
            </div>

            <div className="admin-field">
              <label style={{ fontSize: '12px' }}>
                SMTP App Password {smtpStatus?.hasPass ? '(Configured in .env &bull; Leave blank to keep current)' : '(Required for live delivery)'}
              </label>
              <input
                type="password"
                value={editSmtpPass}
                onChange={(e) => setEditSmtpPass(e.target.value)}
                placeholder={smtpStatus?.hasPass ? '••••••••••••••••' : 'Enter Zoho / Gmail App Password'}
              />
            </div>

            {smtpSavedMsg && <div className="admin-save-toast">{smtpSavedMsg}</div>}

            <button
              type="submit"
              className="admin-login-btn"
              style={{ width: '100%', padding: '11px', fontSize: '13px' }}
              disabled={savingSmtp}
            >
              {savingSmtp ? 'Saving to .env...' : '💾 Save SMTP Credentials to .env'}
            </button>
          </form>
        </div>

        {/* Live Test Mail Dispatcher */}
        <div
          style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: '#ffffff' }}>🧪 Send Live Test Email</h3>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px' }}>
              Send an instant verification email to your personal inbox from <code>cyabot@zohomail.com</code> to verify real SMTP delivery.
            </p>
            <form onSubmit={handleSendTestMail}>
              <div className="admin-field" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px' }}>Send Test To (Your Email)</label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={testMailRecipient}
                  onChange={(e) => setTestMailRecipient(e.target.value)}
                  required
                />
              </div>
              {testMailMsg && <div className="admin-save-toast">{testMailMsg}</div>}
              <button
                type="submit"
                className="admin-login-btn"
                style={{
                  width: '100%',
                  padding: '11px',
                  fontSize: '13px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                }}
                disabled={sendingTestMail}
              >
                {sendingTestMail ? 'Dispatching Test Email...' : '⚡ Send Test Verification Email'}
              </button>
            </form>
          </div>

          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <strong style={{ color: '#e2e8f0' }}>Automated Customer Notifications:</strong>
            <div style={{ marginTop: '4px', lineHeight: 1.6 }}>
              &bull; <strong>Order Submitted:</strong> Instant receipt with reference ID and plan details<br />
              &bull; <strong>Verified by Admin:</strong> Activation email unlocking perks on their server<br />
              &bull; <strong>Denied by Admin:</strong> Rejection email with reason and appeal instructions
            </div>
          </div>
        </div>
      </div>

      {/* Discord Bot /mail Slash Command Snippet Card */}
      <div
        style={{
          padding: '24px',
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🤖 Discord Bot Slash Command: <code>/mail</code></span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
              Add this command to your bot so staff can run <code>/mail &lt;target_email&gt; &lt;message&gt;</code> to send emails directly from Discord via <code>cyabot@zohomail.com</code>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="status-filter-pills" style={{ margin: 0 }}>
              <button
                type="button"
                className={`filter-pill ${snippetLanguage === 'python' ? 'active' : ''}`}
                onClick={() => setSnippetLanguage('python')}
              >
                Python (discord.py)
              </button>
              <button
                type="button"
                className={`filter-pill ${snippetLanguage === 'javascript' ? 'active' : ''}`}
                onClick={() => setSnippetLanguage('javascript')}
              >
                JavaScript (discord.js)
              </button>
            </div>
            <button
              type="button"
              className="admin-login-btn"
              style={{ width: 'auto', padding: '6px 16px', fontSize: '12px' }}
              onClick={() => {
                const snippet = snippetLanguage === 'python' ? pythonSnippet : jsSnippet;
                navigator.clipboard.writeText(snippet);
                setCopiedText('bot_snippet');
                setTimeout(() => setCopiedText(null), 2000);
              }}
            >
              {copiedText === 'bot_snippet' ? '✓ Copied Snippet!' : '📋 Copy Snippet'}
            </button>
          </div>
        </div>

        {/* Code display block */}
        <div
          style={{
            background: '#090d16',
            borderRadius: '10px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontFamily: 'monospace',
            fontSize: '12.5px',
            lineHeight: 1.6,
            color: '#93c5fd',
            maxHeight: '260px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {snippetLanguage === 'python' ? pythonSnippet : jsSnippet}
        </div>

        {/* Direct Web Mail Dispatcher */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#e2e8f0' }}>Or Dispatch a Direct Email From Here:</h4>
          <form onSubmit={handleSendCustomMail} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div className="admin-field">
              <label style={{ fontSize: '11px' }}>Recipient Email</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={customMailRecipient}
                onChange={(e) => setCustomMailRecipient(e.target.value)}
                required
              />
            </div>
            <div className="admin-field">
              <label style={{ fontSize: '11px' }}>Subject Line</label>
              <input
                type="text"
                placeholder="e.g. Server Perks Activated"
                value={customMailSubject}
                onChange={(e) => setCustomMailSubject(e.target.value)}
              />
            </div>
            <div className="admin-field" style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '11px' }}>Message Body</label>
              <textarea
                rows={2}
                placeholder="Write your custom message here..."
                value={customMailBody}
                onChange={(e) => setCustomMailBody(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '8px 12px',
                  fontSize: '13px',
                }}
                required
              />
            </div>
            {customMailMsg && <div style={{ gridColumn: '1 / -1' }} className="admin-save-toast">{customMailMsg}</div>}
            <div style={{ gridColumn: '1 / -1' }}>
              <button
                type="submit"
                className="admin-login-btn"
                style={{ width: 'auto', padding: '10px 22px', fontSize: '13px' }}
                disabled={sendingCustomMail}
              >
                {sendingCustomMail ? 'Sending...' : '📨 Dispatch Email to Recipient'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Email Delivery History Logs Table */}
      <div className="admin-table-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>📜 Recent Email Delivery Logs</h3>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total logged: {mailLogs.length} events</span>
        </div>

        {mailLogs.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
            No automated emails logged yet. When transactions are submitted or verified, deliveries will appear here.
          </div>
        ) : (
          <table className="admin-tx-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Type</th>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Details / Note</th>
                <th style={{ textAlign: 'right' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {mailLogs.slice(0, 30).map((log) => (
                <tr key={log.id}>
                  <td>
                    <span
                      className="tx-status-pill"
                      style={{
                        background:
                          log.status === 'sent'
                            ? 'rgba(16, 185, 129, 0.18)'
                            : log.status === 'simulated'
                            ? 'rgba(56, 189, 248, 0.18)'
                            : 'rgba(239, 68, 68, 0.18)',
                        color:
                          log.status === 'sent'
                            ? '#34d399'
                            : log.status === 'simulated'
                            ? '#38bdf8'
                            : '#f87171',
                      }}
                    >
                      {log.status === 'sent' ? '✓ Sent' : log.status === 'simulated' ? '● Simulated' : '✕ Failed'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#e2e8f0', textTransform: 'capitalize' }}>
                      {log.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>{log.to}</strong>
                  </td>
                  <td>
                    <span style={{ color: '#94a3b8', fontSize: '12.5px' }}>{log.subject}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11.5px', color: log.error ? '#f87171' : '#64748b' }}>
                      {log.error || log.details || '—'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
