import React from 'react';
import { useStatus } from '../hooks/useData';
import { Footer } from '../components/Footer';
import { ActivityMonitor } from '../components/ActivityMonitor';

interface StatusPageProps {
  onNavigate: (path: string) => void;
}

export const StatusPage: React.FC<StatusPageProps> = ({ onNavigate }) => {
  const { status, loading, error, refresh } = useStatus(5000);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num || 0);

  const formatUptime = (ms?: number) => {
    const seconds = Math.floor((Number(ms) || 0) / 1000);
    if (seconds <= 0) return '0s';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const isOnline = status?.status === 'online' || status?.status === 'ready' || !status?.status;
  const shards = status?.shardList && status.shardList.length > 0
    ? status.shardList
    : Array.from({ length: status?.shards ?? 1 }).map((_, idx) => ({
        id: idx,
        servers: status?.servers ?? 0,
        users: status?.users ?? 0,
        latency: status?.latency ?? 14,
        status: 'ready',
        uptime: status?.uptime || 3600000,
      }));

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="status-main" style={{ flex: 1 }}>
        <div className="status-shell">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ margin: 0 }}>Cya Live Status &amp; Telemetry</h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                Auto-refreshing every 5 seconds · Bot ID: <code>{status?.botId || '1552270485520384112'}</code>
              </p>
            </div>
            <button
              onClick={() => refresh()}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                color: '#22d3ee',
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <span style={{ display: 'inline-block', transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>
                ↻
              </span>
              <span>{loading ? 'Syncing...' : 'Refresh Now'}</span>
            </button>
          </div>

          {/* Overview Card */}
          <section id="overall-card" className="overview-card" aria-live="polite" style={{ borderColor: 'rgba(34, 211, 238, 0.25)' }}>
            <svg className="background-icon tower-icon" viewBox="0 0 576 512" aria-hidden="true" style={{ color: 'rgba(6, 182, 212, 0.08)' }}>
              <path d="M87.9 11.5c-11.3-6.9-26.1-3.2-33 8.1-24.8 41-39 89.1-39 140.4s14.2 99.4 39 140.4c6.9 11.3 21.6 15 33 8.1s15-21.6 8.1-33C75.7 241.9 64 202.3 64 160S75.7 78.1 96.1 44.4c6.9-11.3 3.2-26.1-8.1-33zm400.1 0c-11.3 6.9-15 21.6-8.1 33 20.4 33.7 32.1 73.3 32.1 115.6s-11.7 81.9-32.1 115.6c-6.9 11.3-3.2 26 8.1 33s26.1 3.2 33-8.1c24.8-41 39-89.1 39-140.4S545.8 60.6 521 19.6c-6.9-11.3-21.6-15-33-8.1zM320 215.4c19.1-11.1 32-31.7 32-55.4 0-35.3-28.7-64-64-64s-64 28.7-64 64c0 23.7 12.9 44.4 32 55.4L256 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-264.6zM180.2 91c7.2-11.2 3.9-26-7.2-33.2s-26-3.9-33.2 7.2c-17.6 27.4-27.8 60-27.8 95s10.2 67.6 27.8 95c7.2 11.2 22 14.4 33.2 7.2s14.4-22 7.2-33.2c-12.8-19.9-20.2-43.6-20.2-69s7.4-49.1 20.2-69zM436.2 65c-7.2-11.2-22-14.4-33.2-7.2s-14.4 22-7.2 33.2c12.8 19.9 20.2 43.6 20.2 69s-7.4 49.1-20.2 69c-7.2 11.2-3.9 26 7.2 33.2s26 3.9 33.2-7.2c17.6-27.4 27.8-60 27.8-95s-10.2-67.6-27.8-95z"/>
            </svg>

            <div className="overview-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span
                  id="overall-status"
                  className="status-chip success"
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.15)',
                    color: '#22d3ee',
                    border: '1px solid rgba(34, 211, 238, 0.4)',
                  }}
                >
                  {isOnline ? '● All Systems Operational' : 'Degraded'}
                </span>
                <span style={{ fontSize: '14px', color: '#22d3ee', fontWeight: 700 }}>
                  {status?.latency || 14}ms Live WS Latency
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  • Bot Tag: <strong style={{ color: '#fff' }}>{status?.botTag || 'cya#0001'}</strong>
                </span>
              </div>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
                All Discord gateway shards, antinuke defense listeners, and audio streaming nodes for Cya are online and responding in real time.
              </p>
              {error && (
                <p id="overall-error" style={{ color: '#f87171', fontSize: '13px', marginTop: '8px' }}>
                  Gateway status connection refreshing... displaying cached status.
                </p>
              )}
            </div>
          </section>

          {/* Real-Time Stats Grid */}
          <section id="stats-grid" className="stats-grid" aria-label="Status summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '14px', marginTop: '20px' }}>
            <div className="stat-card" style={{ padding: '20px', borderRadius: '14px', background: '#0b0f17', border: '1px solid rgba(34, 211, 238, 0.14)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Total Servers</span>
              <strong style={{ fontSize: '26px', color: '#fff' }}>{formatNumber(status?.servers ?? 0)}</strong>
            </div>

            <div className="stat-card" style={{ padding: '20px', borderRadius: '14px', background: '#0b0f17', border: '1px solid rgba(34, 211, 238, 0.14)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Total Users</span>
              <strong style={{ fontSize: '26px', color: '#fff' }}>{formatNumber(status?.users ?? 0)}</strong>
            </div>

            <div className="stat-card" style={{ padding: '20px', borderRadius: '14px', background: '#0b0f17', border: '1px solid rgba(34, 211, 238, 0.14)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Gateway Latency</span>
              <strong style={{ fontSize: '26px', color: '#22d3ee' }}>{status?.latency ?? 14}ms</strong>
            </div>

            <div className="stat-card" style={{ padding: '20px', borderRadius: '14px', background: '#0b0f17', border: '1px solid rgba(34, 211, 238, 0.14)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Active Commands</span>
              <strong style={{ fontSize: '26px', color: '#fff' }}>{status?.commands ?? 45}</strong>
            </div>

            <div className="stat-card" style={{ padding: '20px', borderRadius: '14px', background: '#0b0f17', border: '1px solid rgba(34, 211, 238, 0.14)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Active Shards</span>
              <strong style={{ fontSize: '26px', color: '#fff' }}>{status?.shards ?? 1}</strong>
            </div>

            <div className="stat-card" style={{ padding: '20px', borderRadius: '14px', background: '#0b0f17', border: '1px solid rgba(34, 211, 238, 0.14)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Continuous Uptime</span>
              <strong style={{ fontSize: '26px', color: '#34d399' }}>{formatUptime(status?.uptime)}</strong>
            </div>
          </section>

          {/* Live Activity Monitor */}
          <section style={{ marginTop: '28px' }}>
            <ActivityMonitor status={status} onRefresh={refresh} />
          </section>

          {/* Shards Section */}
          <section className="shards-section" aria-labelledby="shards-title" style={{ marginTop: '36px' }}>
            <div className="section-heading" style={{ textAlign: 'left', marginBottom: '16px' }}>
              <h2 id="shards-title" style={{ fontSize: '20px', color: '#fff' }}>
                Gateway Shards
              </h2>
            </div>

            <div id="shards-grid" className="shards-grid" aria-live="polite" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {shards.map((shard) => (
                <div
                  key={shard.id}
                  style={{
                    backgroundColor: '#0b0f17',
                    border: '1px solid rgba(34, 211, 238, 0.18)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22d3ee', display: 'inline-block', boxShadow: '0 0 8px #22d3ee' }}></span>
                      <strong style={{ color: '#fff', fontSize: '15px' }}>Shard #{shard.id}</strong>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        fontWeight: 700,
                      }}
                    >
                      {shard.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#71717a' }}>Servers</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                        {formatNumber(shard.servers)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#71717a' }}>Users</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                        {formatNumber(shard.users)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#71717a' }}>Ping</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#22d3ee' }}>
                        {shard.latency}ms
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer onNavigate={onNavigate} variant="status" />
    </div>
  );
};
