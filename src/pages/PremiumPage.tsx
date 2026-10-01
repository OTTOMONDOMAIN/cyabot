import React, { useState } from 'react';
import { useConfig } from '../hooks/useData';
import { Footer } from '../components/Footer';
import { CheckoutModal } from '../components/CheckoutModal';

interface PremiumPageProps {
  onNavigate: (path: string) => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({ onNavigate }) => {
  const config = useConfig();
  const [selectedTier, setSelectedTier] = useState<{ name: string; duration: string; price: string } | null>(null);

  const ticketUrl = config.supportServerUrl || 'https://dsc.gg/cya';

  const plans = [
    { name: 'Nova', duration: '1 month', price: '$1.75', popular: false },
    { name: 'Comet', duration: '3 months', price: '$4.75', popular: false },
    { name: 'Orbit', duration: '6 months', price: '$8.25', popular: true },
    { name: 'Stellar', duration: '12 months', price: '$13.99', popular: false },
    { name: 'Cosmic', duration: 'Lifetime', price: 'Lifetime', popular: false, isLifetime: true },
  ];

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1 }}>
        {/* Premium Hero */}
        <section className="premium-hero">
          <div className="hero-glow hero-glow-left" aria-hidden="true"></div>
          <div className="hero-glow hero-glow-right" aria-hidden="true"></div>
          <div className="hero-grid" aria-hidden="true"></div>

          <div className="hero-content">
            <p className="eyebrow" style={{ color: '#22d3ee' }}>Cya Premium</p>
            <h1>
              More room to use<br />
              <span style={{ color: '#22d3ee' }}>Cya.</span>
            </h1>
            <p className="hero-intro">
              Shorter waits, more AI, and the vote gates out of your way. Pick a plan and keep your community moving.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#plans" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#fff' }}>
                View plans
              </a>
              <a
                className="secondary-button"
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Create a ticket to buy
              </a>
            </div>
            <p className="hero-note">All plans include the same benefits. Only the duration changes.</p>
          </div>
        </section>

        {/* Limits Section */}
        <section className="premium-section limits-section" aria-labelledby="limits-title">
          <div className="section-intro">
            <p className="eyebrow" style={{ color: '#22d3ee' }}>The difference</p>
            <h2 id="limits-title">Premium, in plain numbers</h2>
            <p>
              Premium makes the limits you already know less intrusive. It works for an individual user across servers, or for an entire guild.
            </p>
          </div>

          <div className="limits-card" style={{ borderColor: 'rgba(34, 211, 238, 0.2)' }}>
            <div className="limits-card-heading">
              <strong>What changes</strong>
              <span>
                Free <i></i> Premium
              </span>
            </div>

            <div className="limit-row">
              <div>
                <strong>Command cooldowns</strong>
                <small>Every global command cooldown</small>
              </div>
              <span className="limit-value" style={{ color: '#22d3ee' }}>
                10s <b>→</b> 5s
              </span>
            </div>

            <div className="limit-row">
              <div>
                <strong><code>/ai ask</code></strong>
                <small>Questions per user, per hour</small>
              </div>
              <span className="limit-value" style={{ color: '#22d3ee' }}>
                20 <b>→</b> 45
              </span>
            </div>

            <div className="limit-row">
              <div>
                <strong>Top.gg vote checks</strong>
                <small>20 active commands where Premium removes the vote requirement</small>
              </div>
              <span className="limit-value" style={{ color: '#22d3ee' }}>
                Required <b>→</b> Skipped
              </span>
            </div>

            <div className="limit-row">
              <div>
                <strong>Premium coverage</strong>
                <small>Where Premium can apply</small>
              </div>
              <span className="limit-value" style={{ color: '#22d3ee' }}>
                User <b>+</b> Guild
              </span>
            </div>
          </div>
        </section>

        {/* What You Unlock */}
        <section className="premium-section included-section" id="included" aria-labelledby="included-title">
          <div className="section-intro">
            <p className="eyebrow" style={{ color: '#22d3ee' }}>What you unlock</p>
            <h2 id="included-title">The useful parts. Nothing padded.</h2>
          </div>

          <div className="included-grid">
            <article className="included-item">
              <span className="item-number" style={{ color: '#22d3ee' }}>01</span>
              <div>
                <h3>Half the waiting</h3>
                <p>
                  Premium halves every global command cooldown. A command set to 10 seconds becomes 5 seconds; the default 3 seconds becomes 1.5.
                </p>
              </div>
            </article>

            <article className="included-item">
              <span className="item-number" style={{ color: '#22d3ee' }}>02</span>
              <div>
                <h3>More room for <code>/ai ask</code></h3>
                <p>
                  Ask 45 questions per hour instead of 20. The normal Premium cooldown reduction applies too.
                </p>
              </div>
            </article>

            <article className="included-item">
              <span className="item-number" style={{ color: '#22d3ee' }}>03</span>
              <div>
                <h3>Skip the vote gate</h3>
                <p>
                  Use the 20 active vote-gated commands without needing a recent Top.gg vote, including AI, moderation, utility, and music commands.
                </p>
              </div>
            </article>

            <article className="included-item">
              <span className="item-number" style={{ color: '#22d3ee' }}>04</span>
              <div>
                <h3>User or guild Premium</h3>
                <p>
                  Individual Premium follows your Discord account across servers. Guild Premium covers users while they use Cya in that server.
                </p>
              </div>
            </article>
          </div>

          <div className="command-strip">
            <span>Includes bypasses for</span>
            <code>/ai reason</code>
            <code>/antinuke</code>
            <code>/container</code>
            <code>/embed</code>
            <code>/quote</code>
            <code>/music autoplay</code>
            <span>and 14 more</span>
          </div>
        </section>

        {/* Plans Section */}
        <section className="premium-section plans-section" id="plans" aria-labelledby="plans-title">
          <div className="section-intro">
            <p className="eyebrow" style={{ color: '#22d3ee' }}>Pick a length</p>
            <h2 id="plans-title">Same Premium. Your timing.</h2>
            <p>
              Available through UPI, Crypto, and Binance. PayPal is available for purchases above $5.00.
            </p>
          </div>

          <div className="plans-list">
            {plans.map((plan) => (
              <article key={plan.name} className={`plan-row ${plan.popular ? 'highlighted' : ''}`} style={plan.popular ? { borderColor: 'rgba(34, 211, 238, 0.4)' } : undefined}>
                <div>
                  <span className="plan-name">{plan.name}</span>
                  <span className="plan-duration">{plan.duration}</span>
                  {plan.popular && <em style={{ backgroundColor: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee' }}>Popular</em>}
                </div>
                <strong style={{ color: '#fff' }}>{plan.price}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedTier(plan)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: '#22d3ee',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {plan.isLifetime ? 'Ask in ticket' : 'Buy via ticket'} <span>↗</span>
                </button>
              </article>
            ))}
          </div>

          <p className="purchase-note">
            Purchases above $3.00 may be eligible for a refund within 6 hours, subject to the{' '}
            <a
              href="/refund"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/refund');
              }}
              style={{ color: '#22d3ee' }}
            >
              refund policy
            </a>
            . PayPal purchases are non-refundable.
          </p>
        </section>

        {/* FAQ Section */}
        <section className="premium-section faq-section" aria-labelledby="faq-title">
          <div className="section-intro">
            <p className="eyebrow" style={{ color: '#22d3ee' }}>Before you buy</p>
            <h2 id="faq-title">Questions, answered.</h2>
          </div>

          <div className="faq-list">
            <details className="faq-card">
              <summary>What does “vote-gated commands” mean?</summary>
              <div className="faq-answer">
                <p>
                  Some Cya commands normally ask you to vote on Top.gg before they can run. Premium skips that vote requirement for 20 active commands, including <code>/ai reason</code>, <code>/antinuke</code>, <code>/container</code>, <code>/quote</code>, and selected music commands.
                </p>
              </div>
            </details>

            <details className="faq-card">
              <summary>Does Premium bypass Discord permissions?</summary>
              <div className="faq-answer">
                <p>
                  No. Discord permissions, owner-only checks, guild-only checks, voice-channel requirements, and moderation requirements still apply.
                </p>
              </div>
            </details>

            <details className="faq-card">
              <summary>Does Premium reduce every cooldown?</summary>
              <div className="faq-answer">
                <p>
                  It halves global command cooldowns, including the default 3-second cooldown. Button interaction cooldowns and custom cooldowns implemented inside individual commands are separate and are not changed.
                </p>
              </div>
            </details>

            <details className="faq-card">
              <summary>What is the difference between user and guild Premium?</summary>
              <div className="faq-answer">
                <p>
                  Individual Premium follows your Discord account across servers. Guild Premium applies Premium checks to users while they use Cya in the covered server.
                </p>
              </div>
            </details>

            <details className="faq-card">
              <summary>Do all Premium tiers have the same benefits?</summary>
              <div className="faq-answer">
                <p>
                  Yes. Nova, Comet, Orbit, Stellar, and Cosmic all provide the same benefits. The tier only changes how long Premium lasts.
                </p>
              </div>
            </details>

            <details className="faq-card">
              <summary>Can I get a refund?</summary>
              <div className="faq-answer">
                <p>
                  Payments above $3.00 may be eligible for a refund if requested within 6 hours, subject to review. PayPal payments are non-refundable. Read the full{' '}
                  <a
                    href="/refund"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/refund');
                    }}
                    style={{ color: '#22d3ee' }}
                  >
                    refund policy
                  </a>{' '}
                  before purchasing.
                </p>
              </div>
            </details>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} variant="premium" />

      {/* Checkout Modal */}
      <CheckoutModal selectedTier={selectedTier} onClose={() => setSelectedTier(null)} />
    </div>
  );
};
