/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { CommandsPage } from './pages/CommandsPage';
import { PremiumPage } from './pages/PremiumPage';
import { StatusPage } from './pages/StatusPage';
import { FaqPage } from './pages/FaqPage';
import { LegalPage } from './pages/LegalPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      return p === '' ? '/' : p;
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase();
      setCurrentPath(p === '' ? '/' : p);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    // If it's a hash on the current page, scroll to element
    if (path.startsWith('#')) {
      const elem = document.querySelector(path);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    if (path.includes('#')) {
      const [pathname, hash] = path.split('#');
      window.history.pushState({}, '', path);
      setCurrentPath(pathname === '' ? '/' : pathname);
      setTimeout(() => {
        const elem = document.getElementById(hash);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    const normalized = currentPath.replace(/\/+$/, '') || '/';

    if (normalized === '/' || normalized === '/index.html' || normalized === '') {
      return <HomePage onNavigate={navigate} />;
    }

    if (normalized === '/commands' || normalized === '/commands.html') {
      return <CommandsPage onNavigate={navigate} />;
    }

    if (normalized === '/premium') {
      return <PremiumPage onNavigate={navigate} />;
    }

    if (normalized === '/status') {
      return <StatusPage onNavigate={navigate} />;
    }

    if (normalized === '/faq') {
      return <FaqPage onNavigate={navigate} />;
    }

    if (normalized === '/tos') {
      return <LegalPage type="tos" onNavigate={navigate} />;
    }

    if (normalized === '/privacy') {
      return <LegalPage type="privacy" onNavigate={navigate} />;
    }

    if (normalized === '/refund') {
      return <LegalPage type="refund" onNavigate={navigate} />;
    }

    // Default fallback to home
    return <HomePage onNavigate={navigate} />;
  };

  return (
    <div className="hedwig-app" style={{ minHeight: '100vh', backgroundColor: '#090a0c', color: '#f0f1f4' }}>
      <Header currentPath={currentPath} onNavigate={navigate} />
      {renderContent()}
    </div>
  );
}
