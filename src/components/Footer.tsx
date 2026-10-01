import React from 'react';
import { useConfig } from '../hooks/useData';

interface FooterProps {
  onNavigate: (path: string) => void;
  variant?: 'default' | 'commands' | 'premium' | 'status';
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, variant = 'default' }) => {
  const config = useConfig();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('http')) return;
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
          marginBottom: '20px',
          fontSize: '13px',
          color: '#8b8e96',
        }}
      >
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
          href="https://docs.hedwig.site"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          Docs
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
          href={config.supportServerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          Support
        </a>
      </div>
      <p style={{ margin: 0, fontSize: '13px', color: '#555860' }}>
        © 2026 cya.site - Operated by itsfizys
      </p>
    </footer>
  );
};
