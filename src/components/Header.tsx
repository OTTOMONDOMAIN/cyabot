import React, { useState } from 'react';
import { useConfig } from '../hooks/useData';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = useConfig();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('http')) return;
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/' && (currentPath === '/' || currentPath === '')) return true;
    return currentPath === path || currentPath === `${path}.html`;
  };

  const avatarUrl = "https://cdn.discordapp.com/avatars/1552270485520384112/8e9ac6083bb92a8e4691af95e8f737b7.png?size=1024";

  return (
    <header className="site-header cya-header">
      {/* Desktop Navigation */}
      <nav className="desktop-nav" aria-label="Primary navigation">
        <a
          className="brand"
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          aria-label="cya home"
        >
          <img
            src={avatarUrl}
            alt="cya logo"
            className="brand-avatar"
            referrerPolicy="no-referrer"
          />
          <div className="brand-text-block">
            <span className="brand-title">cya</span>
            <span className="brand-tagline">Discord Bot</span>
          </div>
        </a>
        <div className="nav-links">
          <a
            href="/commands"
            onClick={(e) => handleLinkClick(e, '/commands')}
            className={isActive('/commands') ? 'active' : ''}
          >
            Commands
          </a>
          <a
            href="/billing"
            onClick={(e) => handleLinkClick(e, '/billing')}
            className={isActive('/billing') || isActive('/premium') ? 'active' : ''}
          >
            Billing
          </a>
          <a
            href="https://docs.hedwig.site"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
          <a
            href="/status"
            onClick={(e) => handleLinkClick(e, '/status')}
            className={isActive('/status') ? 'active' : ''}
          >
            Status
          </a>
        </div>
        <div className="header-actions">
          <a
            className="cya-nav-btn"
            href={config.inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="discord-icon" viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="currentColor">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.075.075 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.164-.394-.405-.875-.618-1.25a.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.935 9.046-.319 13.58.099 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.042 2.423 5.993 3.03a.077.077 0 0 0 .084-.028c.461-.63.873-1.295 1.226-1.994a.077.077 0 0 0-.042-.105 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.082.082 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419s.956-2.419 2.157-2.419 2.176 1.096 2.157 2.419c0 1.333-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419s.955-2.419 2.157-2.419 2.176 1.096 2.157 2.419c0 1.333-.946 2.419-2.157 2.419Z"/>
            </svg>
            <span>Invite Cya</span>
          </a>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <a
          className="brand"
          href="/"
          onClick={(e) => handleLinkClick(e, '/')}
          aria-label="cya home"
        >
          <img
            src={avatarUrl}
            alt="cya logo"
            className="brand-avatar"
            referrerPolicy="no-referrer"
          />
          <span className="brand-title">cya</span>
        </a>
        <a
          className="cya-nav-btn mobile-invite"
          href={config.inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Invite
        </a>
        <button
          className="menu-button"
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i style={mobileMenuOpen ? { transform: 'rotate(45deg) translate(3px, 5px)' } : undefined}></i>
          <i style={mobileMenuOpen ? { opacity: 0 } : undefined}></i>
          <i style={mobileMenuOpen ? { transform: 'rotate(-45deg) translate(3px, -5px)' } : undefined}></i>
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a
          href="/commands"
          onClick={(e) => handleLinkClick(e, '/commands')}
          style={isActive('/commands') ? { color: '#22d3ee' } : undefined}
        >
          Commands
        </a>
        <a
          href="/billing"
          onClick={(e) => handleLinkClick(e, '/billing')}
          style={isActive('/billing') || isActive('/premium') ? { color: '#22d3ee' } : undefined}
        >
          Billing
        </a>
        <a
          href="https://docs.hedwig.site"
          target="_blank"
          rel="noopener noreferrer"
        >
          Documentation
        </a>
        <a
          href="/status"
          onClick={(e) => handleLinkClick(e, '/status')}
          style={isActive('/status') ? { color: '#22d3ee' } : undefined}
        >
          Status
        </a>
        <a
          className="cya-btn-primary"
          href={config.inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ justifyContent: 'center' }}
        >
          Add to Discord
        </a>
      </div>
    </header>
  );
};
