import React from 'react';
import { useConfig } from '../hooks/useData';

interface FooterProps {
  onNavigate: (path: string) => void;
  variant?: 'default' | 'commands' | 'premium' | 'status';
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, variant = 'default' }) => {
  const config = useConfig();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('http') || path.startsWith('mailto:')) return;
    e.preventDefault();
    onNavigate(path);
  };

  const footerClassName =
    variant === 'commands'
      ? 'commands-footer'
      : variant === 'premium'
      ? 'premium-footer'
      : variant === 'status'
      ? 'status-footer'
      : 'site-footer';

  return (
    <footer className={footerClassName} style={{ padding: '48px 24px 64px', textAlign: 'center' }}>
      <div
        className="footer-links"
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '12px 20px',
          marginBottom: '16px',
          fontSize: '13px',
          color: '#8b8e96',
        }}
      >
        <a
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            sessionStorage.removeItem('cya_oauth_auto_triggered');
            const savedUser = sessionStorage.getItem('cya_dashboard_user');
            if (!savedUser) {
              const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
              const oauthUrl = `https://discord.com/oauth2/authorize?client_id=1552270485520384112&response_type=token&redirect_uri=${redirectUri}&scope=identify%20guilds&prompt=consent`;
              window.open(oauthUrl, 'discord_oauth', 'width=520,height=680');
            }
            onNavigate('/dashboard');
          }}
          className="hover:text-white transition-colors"
          style={{ color: '#818cf8', fontWeight: 600 }}
        >
          Dashboard
        </a>
        <a href="/tos" onClick={(e) => handleLinkClick(e, '/tos')} className="hover:text-white transition-colors">
          Terms
        </a>
        <a href="/privacy" onClick={(e) => handleLinkClick(e, '/privacy')} className="hover:text-white transition-colors">
          Privacy
        </a>
        <a href="/premium" onClick={(e) => handleLinkClick(e, '/premium')} className="hover:text-white transition-colors">
          Premium
        </a>
        <a href="/refund" onClick={(e) => handleLinkClick(e, '/refund')} className="hover:text-white transition-colors">
          Refund policy
        </a>
        <a href="/faq" onClick={(e) => handleLinkClick(e, '/faq')} className="hover:text-white transition-colors">
          FAQ
        </a>
        <a
          href={config.inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          Invite
        </a>
        <a
          href={config.supportServerUrl || 'https://dsc.gg/cyaa'}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          Support
        </a>
        <a
          href="/admin"
          onClick={(e) => handleLinkClick(e, '/admin')}
          className="hover:text-white transition-colors"
          style={{ color: '#10b981', fontWeight: 600 }}
        >
          Admin Portal
        </a>
        <a
          href="mailto:cyabot@zohomail.com"
          className="hover:text-white transition-colors"
          style={{ color: '#22d3ee', fontWeight: 600 }}
        >
          cyabot@zohomail.com
        </a>
      </div>
      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#94a3b8' }}>
        Official Mail:{' '}
        <a
          href="mailto:cyabot@zohomail.com"
          style={{ color: '#22d3ee', textDecoration: 'none', fontWeight: 600 }}
        >
          cyabot@zohomail.com
        </a>
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: '#555860' }}>
        © 2026 cya.lat - Operated by for.av
      </p>
    </footer>
  );
};
