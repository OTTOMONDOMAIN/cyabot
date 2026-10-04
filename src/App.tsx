/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { CommandsPage } from './pages/CommandsPage';
import { BillingPage } from './pages/BillingPage';
import { AdminPage } from './pages/AdminPage';
import { StatusPage } from './pages/StatusPage';
import { FaqPage } from './pages/FaqPage';
import { LegalPage } from './pages/LegalPage';

export default function App() {
  const getInitialRoute = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash === 'admin') return '/admin';
      const p = window.location.pathname.toLowerCase();
      return p === '' ? '/' : p;
    }
    return '/';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash === 'admin') {
        setCurrentPath('/admin');
        return;
      }
      const p = window.location.pathname.toLowerCase();
      setCurrentPath(p === '' ? '/' : p);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
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

  const normalized = currentPath.replace(/\/+$/, '') || '/';
  const isAdminRoute = normalized === '/admin' || normalized === '/admin.html';

  const renderContent = () => {
    if (isAdminRoute) {
      return <AdminPage onNavigate={navigate} />;
    }

    if (normalized === '/' || normalized === '/index.html' || normalized === '') {
      return <HomePage onNavigate={navigate} />;
    }

    if (normalized === '/commands' || normalized === '/commands.html') {
      return <CommandsPage onNavigate={navigate} />;
    }

    if (
      normalized === '/billing' ||
      normalized === '/billing.html' ||
      normalized === '/premium' ||
      normalized === '/premium.html'
    ) {
      return <BillingPage onNavigate={navigate} />;
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

    return <HomePage onNavigate={navigate} />;
  };

  return (
    <div className="hedwig-app" style={{ minHeight: '100vh', backgroundColor: '#05070a', color: '#f0f1f4' }}>
      {!isAdminRoute && <Header currentPath={currentPath} onNavigate={navigate} />}
      {renderContent()}
    </div>
  );
}
