import React, { useState, useEffect } from 'react';
import { useConfig, useStatus, useCommands } from '../hooks/useData';
import type { FeaturedServerItem } from '../types';
import fallbackFeatured from '../data/featured_servers.json';
import { Footer } from '../components/Footer';
import { ActivityMonitor } from '../components/ActivityMonitor';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const config = useConfig();
  const { status, refresh } = useStatus(5000);
  const { commands } = useCommands();

  const [activeTab, setActiveTab] = useState<'antinuke' | 'music' | 'automod' | 'voicemaster' | 'tickets'>('tickets');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [featuredServers, setFeaturedServers] = useState<FeaturedServerItem[]>(fallbackFeatured as FeaturedServerItem[]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/featured-servers');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.servers) && data.servers.length > 0) {
            setFeaturedServers(data.servers);
          }
        }
      } catch {}
    };
    fetchFeatured();
    const interval = setInterval(fetchFeatured, 25000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num || 0);
  const formatCompactMembers = (num: number) => {
    if (!num) return '0';
    if (num >= 1000) {
      const k = num / 1000;
      return `${k >= 10 ? Math.round(k) : Number(k.toFixed(1))}k`;
    }
    return formatNumber(num);
  };

  const featuredTotalMembers = featuredServers.reduce((acc, s) => acc + (Number(s.memberCount) || 0), 0);
  const serverCount = Math.max(status?.servers ?? 0, featuredServers.length);
  const userCount = Math.max(status?.users ?? 0, featuredTotalMembers);
  const commandCount = status?.commands ?? commands?.length ?? 45;

  const copyCommandText = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  const handleActionClick = (label: string) => {
    let msg = `Executed: ${label}`;
    if (label.includes('Ticket')) msg = 'Created private channel: #ticket-0412';
    else if (label.includes('Lock')) msg = 'Room locked: @everyone cannot join';
    else if (label.includes('Pause')) msg = 'Music playback paused';
    else if (label.includes('Skip')) msg = 'Track skipped to next in queue';
    else if (label.includes('Whitelist')) msg = 'Admin added to safe whitelist';
    else if (label.includes('Scan')) msg = 'Server security scan complete: 0 vulnerabilities';
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
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
      actionButtons: [
        { id: 'wl', label: '🛡️ Whitelist Admin', style: 'primary' },
        { id: 'cfg', label: '⚙️ Configure Thresholds', style: 'secondary' },
      ],
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
      actionButtons: [
        { id: 'p', label: '⏸️ Pause', style: 'secondary' },
        { id: 's', label: '⏭️ Skip', style: 'secondary' },
        { id: 'l', label: '🔁 Loop Queue', style: 'secondary' },
        { id: 'st', label: '⏹️ Stop', style: 'secondary' },
      ],
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
      actionButtons: [
        { id: 'scan', label: '⚡ Run Security Scan', style: 'primary' },
        { id: 'filt', label: '🚫 Phishing Shield', style: 'secondary' },
      ],
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
      actionButtons: [
        { id: 'lock', label: '🔒 Lock Room', style: 'secondary' },
        { id: 'lim', label: '👥 User Limit: 4', style: 'secondary' },
        { id: 'ren', label: '✏️ Rename Room', style: 'secondary' },
      ],
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
        footer: 'Ready for community inquiries · Click below to open a ticket',
      },
      actionButtons: [
        { id: 'create', label: '📩 Create Ticket', style: 'primary' },
        { id: 'cats', label: '📋 Select Category', style: 'secondary' },
      ],
    },
  };

  const currentDemo = interactiveDemos[activeTab];
  const marqueeItems = [...featuredServers, ...featuredServers, ...featuredServers];

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
              <div className="metric-divider"></div>
              <div className="metric-item">
                <strong style={{ color: '#22d3ee' }}>{status?.latency ?? 14}ms</strong>
                <span>Live WS Ping</span>
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
            <div className="cya-terminal-window">
              <div className="terminal-topbar">
                <div className="terminal-dots">
                  <span className="dot-red"></span>
                  <span className="dot-yellow"></span>
                  <span className="dot-green"></span>
                </div>
                <span className="terminal-title">cya-core — discord-gateway</span>
                <span className="terminal-status">● Connected</span>
              </div>

              {/* Interactive Module Tabs */}
              <div className="terminal-tabs" role="tablist">
                {(['antinuke', 'music', 'automod', 'voicemaster', 'tickets'] as const).map((tabKey) => (
                  <button
                    key={tabKey}
                    role="tab"
                    aria-selected={activeTab === tabKey}
                    className={`terminal-tab ${activeTab === tabKey ? 'active' : ''}`}
                    onClick={() => setActiveTab(tabKey)}
                  >
                    {tabKey === 'antinuke' && '🛡️ Antinuke'}
                    {tabKey === 'music' && '🎵 Music'}
                    {tabKey === 'automod' && '⚡ AutoMod'}
                    {tabKey === 'voicemaster' && '🎙️ VoiceMaster'}
                    {tabKey === 'tickets' && '🎫 Tickets'}
                  </button>
                ))}
              </div>

              <div className="terminal-body">
                {/* Simulated Slash Command Input */}
                <div className="terminal-command-bar">
                  <span className="slash-prompt">/</span>
                  <code className="command-string">{currentDemo.command.replace(/^\//, '')}</code>
                  <button
                    type="button"
                    className="copy-cmd-btn"
                    onClick={() => copyCommandText(currentDemo.command)}
                    title="Copy command"
                  >
                    {copiedCmd === currentDemo.command ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                {/* Simulated Bot Embed Response */}
                <div className="bot-response-card">
                  <div className="bot-response-header">
                    <img
                      src="https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=1024"
                      alt="cya"
                      className="bot-mini-avatar"
                      referrerPolicy="no-referrer"
                    />
                    <div className="bot-author-info">
                      <span className="bot-name">Cya</span>
                      <span className="bot-tag">BOT</span>
                      <span className="bot-time">Just now</span>
                    </div>
                  </div>

                  <div
                    className="discord-embed"
                    style={{ borderLeftColor: currentDemo.response.color }}
                  >
                    <h2 className="embed-title">{currentDemo.response.title}</h2>
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

                  {/* Simulated Discord Interactive Action Buttons */}
                  {currentDemo.actionButtons && currentDemo.actionButtons.length > 0 && (
                    <div className="discord-components-row">
                      {currentDemo.actionButtons.map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          className={`discord-btn ${btn.style === 'primary' ? 'discord-btn-primary' : 'discord-btn-secondary'}`}
                          onClick={() => handleActionClick(btn.label)}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {actionFeedback && (
                    <div className="discord-btn-feedback">
                      ✓ {actionFeedback}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Moving Community Server Showcase (Slug-Style Marquee + Live Discord Widgets) */}
      <section className="cya-communities-showcase" aria-label="Featured Communities Powered by Cya">
        <div className="cya-communities-header">
          <p className="cya-communities-powering">
            Powering <strong>{formatNumber(userCount)}</strong> users across <strong>{formatNumber(serverCount)}</strong> communities
          </p>
        </div>

        <div className="cya-marquee-viewport">
          <div className="cya-marquee-track">
            {marqueeItems.map((srv, idx) => {
              const badgeColorHex = srv.badgeColor === 'blue' ? '#3b82f6' : '#10b981';
              return (
                <div
                  key={`${srv.id}-${idx}`}
                  className="cya-community-pill"
                >
                  <div className="cya-community-avatar-wrap">
                    <img
                      src={srv.iconUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt={srv.name}
                      className="cya-community-avatar"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=256';
                      }}
                    />
                  </div>

                  <div className="cya-community-meta">
                    <div className="cya-community-title-row">
                      <span className="cya-community-name">{srv.name}</span>
                      <span className="cya-verified-badge" title="Verified Cya Community">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill={badgeColorHex}>
                          <path d="M12 2L14.8 4.5L18.5 4.2L19.5 7.8L22.5 10L21.2 13.5L22.5 17L19.5 19.2L18.5 22.8L14.8 22.5L12 25L9.2 22.5L5.5 22.8L4.5 19.2L1.5 17L2.8 13.5L1.5 10L4.5 7.8L5.5 4.2L9.2 4.5L12 2Z" />
                          <path
                            d="M9.5 13.2L11.2 14.9L15.2 10.9"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>

                    <div className="cya-community-members">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>{formatCompactMembers(srv.memberCount)} members</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Neo-Brutalist Direct Upgrade Slab + Live Activity Monitor */}
      <section className="content-width" style={{ marginTop: '24px', marginBottom: '48px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <article className="bento-cell brutalist-cell" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ maxWidth: '520px' }}>
              <span className="bento-paradigm-label">Direct Server Upgrade</span>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '24px' }}>No-Prefix Mode, Custom Embeds &amp; Custom Bot Branding</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
                Unlock No-Prefix access, unlimited embeds &amp; buttons on Starter, or customize Cya's branding on Premium. Regional prices in INR (₹99), PKR (160 Rs), and USD ($1.99) with UPI, EasyPaisa, &amp; Crypto.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div className="brutalist-price-row tabular-nums" style={{ margin: 0, minWidth: '270px' }}>
                <div>
                  <small>STARTER</small>
                  <strong>₹99 / $1.99<span>/mo</span></strong>
                </div>
                <div>
                  <small>PREMIUM</small>
                  <strong>₹199 / $3.99<span>/mo</span></strong>
                </div>
              </div>
              <button
                type="button"
                className="brutalist-action-btn"
                style={{ width: 'auto', padding: '14px 22px' }}
                onClick={() => onNavigate('/billing')}
              >
                Upgrade Now →
              </button>
            </div>
          </div>
        </article>

        <ActivityMonitor status={status} onRefresh={refresh} compact />
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
              <span>✓ Mass-ban &amp; kick prevention</span>
              <span>✓ Instant role &amp; channel recovery</span>
              <span>✓ Granular staff whitelisting</span>
            </div>
          </div>

          {/* Card 2: Lossless Music */}
          <div className="cya-feature-card">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
              <span className="feature-badge">24/7 Audio</span>
            </div>
            <h3>Lossless Music Player</h3>
            <p>
              Crystal-clear 320kbps audio streaming with instant playback. Apply live bassboost, nightcore, or 8D spatial filters without interrupting the queue.
            </p>
            <div className="feature-highlights">
              <span>✓ Multi-source streaming</span>
              <span>✓ Real-time audio filters</span>
              <span>✓ 24/7 non-stop radio mode</span>
            </div>
          </div>

          {/* Card 3: Smart AutoMod */}
          <div className="cya-feature-card">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span className="feature-badge">Smart Filter</span>
            </div>
            <h3>Intelligent AutoMod</h3>
            <p>
              Automatically intercept phishing links, token grabbers, invite spam, and mass-mention raids. Configurable punishment ladders keep chat clean around the clock.
            </p>
            <div className="feature-highlights">
              <span>✓ Anti-scam &amp; phishing shield</span>
              <span>✓ Anti-spam &amp; raid mode lockdown</span>
              <span>✓ Automated warn &amp; mute ladders</span>
            </div>
          </div>

          {/* Card 4: VoiceMaster */}
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
              <span className="feature-badge">Dynamic Rooms</span>
            </div>
            <h3>VoiceMaster Channels</h3>
            <p>
              Let members spawn their own temporary voice channels by joining a hub. Includes an interactive control panel to lock, hide, rename, or adjust user limits.
            </p>
            <div className="feature-highlights">
              <span>✓ Join-to-create voice hubs</span>
              <span>✓ In-chat voice control dashboard</span>
              <span>✓ Zero empty channel clutter</span>
            </div>
          </div>

          {/* Card 5: Ticketing System */}
          <div className="cya-feature-card">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="feature-badge">Support Desk</span>
            </div>
            <h3>Multi-Panel Tickets</h3>
            <p>
              Streamline staff support with sleek button and select-menu ticket panels. Automatically generates full HTML transcripts and logs resolution metrics.
            </p>
            <div className="feature-highlights">
              <span>✓ Custom dropdown select menus</span>
              <span>✓ Cloud HTML ticket transcripts</span>
              <span>✓ Staff claim &amp; priority tags</span>
            </div>
          </div>

          {/* Card 6: Leveling, Giveaways & Utility */}
          <div className="cya-feature-card">
            <div className="feature-card-top">
              <div className="feature-icon-circle">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span className="feature-badge">Engagement</span>
            </div>
            <h3>Leveling, Giveaways &amp; Welcomer</h3>
            <p>
              Reward active members with customizable XP rank cards, role rewards, automated reaction giveaways, and personalized welcome banners.
            </p>
            <div className="feature-highlights">
              <span>✓ Custom XP rank cards</span>
              <span>✓ Automated role rewards</span>
              <span>✓ Smart giveaway host</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="cya-cta-section content-width" aria-labelledby="cta-heading">
        <div className="cya-cta-banner">
          <div className="cta-glow-orb" aria-hidden="true"></div>
          <div className="cta-content">
            <span className="cta-tag">Ready in 10 Seconds</span>
            <h2 id="cta-heading">Upgrade your Discord server with Cya today.</h2>
            <p>
              Join {formatNumber(serverCount)} communities already using Cya for antinuke defense, music, and moderation.
            </p>
            <div className="cta-buttons">
              <a
                className="cya-btn-primary"
                href={config.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Add Cya to Discord</span>
              </a>
              <button
                type="button"
                className="cya-btn-secondary"
                onClick={() => onNavigate('/billing')}
              >
                <span>View Pricing Plans</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </main>
  );
};
