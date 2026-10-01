import React, { useState } from 'react';
import { useConfig, useStatus, useCommands } from '../hooks/useData';
import { Footer } from '../components/Footer';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const config = useConfig();
  const { status, loading: statusLoading } = useStatus();
  const { commands } = useCommands();

  const [activeTab, setActiveTab] = useState<'antinuke' | 'music' | 'automod' | 'voicemaster' | 'tickets'>('antinuke');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num || 0);

  const serverCount = status?.servers || 1178;
  const userCount = status?.users || 244846;
  const commandCount = commands?.length || status?.commands || 420;

  const copyCommandText = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  const interactiveDemos = {
    antinuke: {
      title: 'Real-time Autonomous Defense',
      description: 'Stops server wipes, unauthorized role updates, mass bot joins, and channel deletion in under 20 milliseconds.',
      command: '/antinuke enable action: ban threshold: strict',
      response: {
        title: '🛡️ Cya Shield · Antinuke Activated',
        color: '#06b6d4',
        fields: [
          { name: 'Status', value: '🟢 Active & Guarding', inline: true },
          { name: 'Punishment Action', value: 'Auto-Ban + Role Strip', inline: true },
          { name: 'Channel Safeguard', value: 'Max 2 changes / 10s', inline: true },
          { name: 'Whitelisted Users', value: 'Server Owner + 2 Admins', inline: false },
        ],
        footer: 'Cya Security Core v4.2 · Microsecond Response Time',
      },
    },
    music: {
      title: 'Studio-Grade Lossless Music',
      description: 'Stream music with zero lag, Spotify/SoundCloud integration, custom audio equalizers, 24/7 mode, and autoplay.',
      command: '/play query: synthwave cyberpunk chill vibes',
      response: {
        title: '🎵 Now Playing · Cyber Dreams (Lossless 320kbps)',
        color: '#22d3ee',
        fields: [
          { name: 'Artist', value: 'Neon Cyber Collective', inline: true },
          { name: 'Duration', value: '3:45 / 4:12', inline: true },
          { name: 'Audio Filter', value: 'Bassboost 30% + 8D Spatial', inline: true },
          { name: 'Queue', value: '18 songs next (1h 14m remaining)', inline: false },
        ],
        footer: 'Requested by You · Audio Stream Node #1 (12ms latency)',
      },
    },
    automod: {
      title: 'Smart Moderation & Anti-Phishing',
      description: 'Instant spam filtering, scam link interception, offensive word masks, and automated timeout escalation.',
      command: '/automod rule create type: anti_phishing action: timeout duration: 24h',
      response: {
        title: '⚡ AutoMod Rule Configured',
        color: '#0891b2',
        fields: [
          { name: 'Rule Type', value: 'Malicious Links & Token Stealers', inline: true },
          { name: 'Detection Engine', value: 'Global Threat Database (99.8% precision)', inline: true },
          { name: 'Automated Penalty', value: 'Message Delete + 24h Mute', inline: true },
        ],
        footer: 'Monitored across all public channels',
      },
    },
    voicemaster: {
      title: 'Dynamic Voice Channels on Demand',
      description: 'Clean up voice clutter. Members click once to create their own temporary private voice room with full management.',
      command: '/voicemaster setup category: "🔊 Temporary Voice"',
      response: {
        title: '🎙️ VoiceMaster Hub Ready',
        color: '#06b6d4',
        fields: [
          { name: 'Join-to-Create Channel', value: '➕ Create Channel', inline: true },
          { name: 'Owner Controls', value: 'Lock, Hide, Permit, Bitrate, Name', inline: true },
          { name: 'Auto-Delete', value: 'When empty (0 ghost channels)', inline: true },
        ],
        footer: 'VoiceMaster Engine · Instant channel provisioning',
      },
    },
    tickets: {
      title: 'Organized Multi-Category Support',
      description: 'Professional dropdown ticket panels with private channels, automated transcripts, and role pings.',
      command: '/ticket panel setup channel: #support-desk',
      response: {
        title: '🎫 Cya Helpdesk Panel Deployed',
        color: '#38bdf8',
        fields: [
          { name: 'Categories', value: 'General Support, Billing, Bug Report, Staff', inline: true },
          { name: 'Transcript Mode', value: 'Auto-save HTML to Cloud', inline: true },
          { name: 'Ping Roles', value: '@Support Team, @Moderator', inline: true },
        ],
        footer: 'Ready for community inquiries',
      },
    },
  };

  const currentDemo = interactiveDemos[activeTab];

  return (
    <main id="top" className="cya-home">
      {/* Dynamic Background Atmosphere */}
      <div className="cya-background-glow" aria-hidden="true">
        <div className="cyan-halo cyan-halo-top"></div>
        <div className="cyan-halo cyan-halo-center"></div>
        <div className="cyan-grid-mesh"></div>
      </div>

      {/* Hero Section */}
      <section className="cya-hero content-width" aria-labelledby="cya-hero-heading">
        <div className="cya-hero-badge-wrap">
          <a
            href={config.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cya-live-badge"
          >
            <span className="live-indicator-dot"></span>
            <span>Cya v4.2 is Live</span>
            <span className="badge-divider">/</span>
            <span className="badge-highlight">Protecting {formatNumber(serverCount)} Servers</span>
            <span className="badge-arrow">→</span>
          </a>
        </div>

        <div className="cya-hero-grid">
          <div className="cya-hero-left">
            <div className="cya-brand-mark">
              <img
                src="https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=1024"
                alt="Cya Bot Logo"
                className="cya-hero-avatar"
                referrerPolicy="no-referrer"
              />
              <div className="cya-brand-text">
                <span className="cya-bot-tag">Discord Certified</span>
                <h1 id="cya-hero-heading" className="cya-title">cya</h1>
              </div>
            </div>

            <p className="cya-hero-subtitle">
              The high-performance Discord bot purpose-built to defend, automate, entertain, and scale your server.
            </p>

            <div className="cya-hero-metrics">
              <div className="metric-item">
                <strong>{formatNumber(serverCount)}</strong>
                <span>Servers Guarded</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <strong>{formatNumber(userCount)}</strong>
                <span>Active Users</span>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <strong>{commandCount}+</strong>
                <span>Slash Commands</span>
              </div>
            </div>

            <div className="cya-hero-actions">
              <a
                className="cya-btn-primary"
                href={config.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="discord-svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.075.075 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.394-.405-.875-.618-1.25a.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.935 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.042 2.423 5.993 3.03a.077.077 0 0 0 .084-.028c.461-.63.873-1.295 1.226-1.994a.077.077 0 0 0-.042-.105 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.082.082 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419s.956-2.419 2.157-2.419 2.176 1.096 2.157 2.419c0 1.333-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419s.955-2.419 2.157-2.419 2.176 1.096 2.157 2.419c0 1.333-.946 2.419-2.157 2.419Z"/>
                </svg>
                <span>Add Cya to Discord</span>
              </a>

              <a
                className="cya-btn-secondary"
                href="/commands"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/commands');
                }}
              >
                <span>Browse Commands</span>
                <span className="btn-arrow">›</span>
              </a>
            </div>
          </div>

          {/* Interactive Live Command Terminal */}
          <div className="cya-hero-right">
            <div className="cya-terminal-card">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="terminal-title">Discord Command Simulator</div>
                <div className="terminal-status">
                  <span className="status-ping">14ms</span>
                </div>
              </div>

              {/* Module Selector Tabs */}
              <div className="terminal-tabs" role="tablist">
                {[
                  { id: 'antinuke', label: '🛡️ Antinuke' },
                  { id: 'music', label: '🎵 Music' },
                  { id: 'automod', label: '⚡ AutoMod' },
                  { id: 'voicemaster', label: '🎙️ VoiceMaster' },
                  { id: 'tickets', label: '🎫 Tickets' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`terminal-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Terminal Command Input */}
              <div className="terminal-command-bar">
                <span className="command-prompt">user@server:~$</span>
                <code className="command-text">{currentDemo.command}</code>
                <button
                  type="button"
                  className="copy-chip-btn"
                  onClick={() => copyCommandText(currentDemo.command)}
                  title="Copy command"
                >
                  {copiedCmd === currentDemo.command ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              {/* Simulated Discord Embed Response */}
              <div className="discord-embed-simulator">
                <div className="discord-bot-author">
                  <img
                    src="https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=1024"
                    alt="Cya"
                    className="discord-bot-avatar"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="bot-name">Cya</span>
                    <span className="bot-tag">BOT</span>
                    <span className="bot-time">Just now</span>
                  </div>
                </div>

                <div
                  className="discord-embed"
                  style={{ borderLeftColor: currentDemo.response.color }}
                >
                  <h4 className="embed-title">{currentDemo.response.title}</h4>
                  <p className="embed-description">{currentDemo.description}</p>

                  <div className="embed-fields-grid">
                    {currentDemo.response.fields.map((field, idx) => (
                      <div
                        key={idx}
                        className={`embed-field ${field.inline ? 'inline' : 'full'}`}
                      >
                        <span className="field-name">{field.name}</span>
                        <span className="field-val">{field.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="embed-footer">
                    <span>{currentDemo.response.footer}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="cya-features-section content-width" aria-labelledby="features-heading">
        <div className="cya-section-header">
          <span className="cya-section-eyebrow">Engineered for Excellence</span>
          <h2 id="features-heading" className="cya-section-title">
            Everything your server needs. <br />
            <span>Zero bloat. Pure power.</span>
          </h2>
          <p className="cya-section-subtitle">
            Say goodbye to juggling 10 different bots. Cya consolidates enterprise security, audio, automation, and engagement into one unified system.
          </p>
        </div>

        <div className="cya-features-grid">
          {/* Card 1: Antinuke Engine */}
          <div className="cya-feature-card featured-glow">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span className="feature-badge">Apex Defense</span>
            </div>
            <h3>Microsecond Antinuke</h3>
            <p>
              Autonomous heuristics detect mass channel wipes, unauthorized bot additions, webhook floods, and mass bans instantly. Offending staff roles are stripped and culprits isolated before damage spreads.
            </p>
            <div className="feature-highlights">
              <span>✓ Mass-ban prevention</span>
              <span>✓ Webhook tamper guard</span>
              <span>✓ Role hierarchy freeze</span>
            </div>
          </div>

          {/* Card 2: Studio Audio */}
          <div className="cya-feature-card">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <span className="feature-badge">320kbps Audio</span>
            </div>
            <h3>Studio-Grade Music Engine</h3>
            <p>
              Stream crystal clear music with 0% stutter. Supports playlists, Spotify integration, SoundCloud, 8D audio, bassboost, Nightcore, and 24/7 dedicated voice channel presence.
            </p>
            <div className="feature-highlights">
              <span>✓ Multi-platform streaming</span>
              <span>✓ 15+ real-time audio filters</span>
              <span>✓ 24/7 radio continuous playback</span>
            </div>
          </div>

          {/* Card 3: Deep AutoMod */}
          <div className="cya-feature-card">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span className="feature-badge">Heuristic AI</span>
            </div>
            <h3>Autonomous AutoMod</h3>
            <p>
              Keep chats clean and welcoming. Real-time spam prevention, Discord invite link interception, token grabbing protection, and custom regex pattern filters that enforce your guidelines.
            </p>
            <div className="feature-highlights">
              <span>✓ Phishing & malicious domain block</span>
              <span>✓ Anti-ghost ping detection</span>
              <span>✓ Escalating infraction timeouts</span>
            </div>
          </div>

          {/* Card 4: VoiceMaster Dynamic Channels */}
          <div className="cya-feature-card">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
              <span className="feature-badge">Voice Hub</span>
            </div>
            <h3>VoiceMaster System</h3>
            <p>
              Eliminate empty voice channels cluttering your server list. Members join a single generator channel to spawn their own private temporary voice room with control panels to lock, mute, and name.
            </p>
            <div className="feature-highlights">
              <span>✓ Auto-delete when empty</span>
              <span>✓ In-channel interactive buttons</span>
              <span>✓ Custom bitrate & user limits</span>
            </div>
          </div>

          {/* Card 5: Ticket Desks */}
          <div className="cya-feature-card">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <span className="feature-badge">Helpdesk</span>
            </div>
            <h3>Ticket & Support Panels</h3>
            <p>
              Clean, professional customer service and community inquiries. Custom dropdown select menus, modal intake forms, transcript generation, and private support channels with ping notifications.
            </p>
            <div className="feature-highlights">
              <span>✓ HTML transcripts auto-archived</span>
              <span>✓ Multi-department routing</span>
              <span>✓ One-click claim and close</span>
            </div>
          </div>

          {/* Card 6: Engagement & Social */}
          <div className="cya-feature-card">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <span className="feature-badge">Engagement</span>
            </div>
            <h3>Leveling & Community Utility</h3>
            <p>
              Reward active members with XP rank cards, leaderboard roles, customizable welcome banners, reaction roles, giveaways, and 120+ utility commands for server info, avatars, banners, and stats.
            </p>
            <div className="feature-highlights">
              <span>✓ Custom XP rank cards</span>
              <span>✓ Automated role rewards</span>
              <span>✓ Advanced giveaway system</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Command Search Bar Callout */}
      <section className="cya-commands-callout content-width">
        <div className="commands-callout-inner">
          <div className="callout-content">
            <h3>Looking for specific commands?</h3>
            <p>Explore all {commandCount} documented slash and prefix commands with arguments, examples, and permission breakdowns.</p>
          </div>
          <button
            type="button"
            className="callout-btn"
            onClick={() => onNavigate('/commands')}
          >
            <span>Open Command Directory ({commandCount})</span>
            <span>↗</span>
          </button>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="cya-cta-wrapper content-width">
        <div className="cya-cta-card">
          <div className="cta-glow-disc" aria-hidden="true"></div>
          <div className="cta-content-box">
            <img
              src="https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=1024"
              alt="Cya Logo"
              className="cta-avatar"
              referrerPolicy="no-referrer"
            />
            <h2>Level up your server with Cya.</h2>
            <p>Setup takes less than 60 seconds. Add Cya today and experience a faster, safer, and cleaner Discord server.</p>
            <div className="cta-buttons">
              <a
                className="cya-btn-primary large"
                href={config.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="discord-svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.075.075 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.394-.405-.875-.618-1.25a.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.935 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.042 2.423 5.993 3.03a.077.077 0 0 0 .084-.028c.461-.63.873-1.295 1.226-1.994a.077.077 0 0 0-.042-.105 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.082.082 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419s.956-2.419 2.157-2.419 2.176 1.096 2.157 2.419c0 1.333-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419s.955-2.419 2.157-2.419 2.176 1.096 2.157 2.419c0 1.333-.946 2.419-2.157 2.419Z"/>
                </svg>
                <span>Authorize & Invite Cya</span>
              </a>
              <a
                className="cya-btn-secondary large"
                href={config.supportServerUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Join Support Server</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </main>
  );
};
