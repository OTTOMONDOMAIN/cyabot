import React, { useState, useMemo } from 'react';
import faqGroups from '../data/faqs.json';
import { Footer } from '../components/Footer';

interface FaqPageProps {
  onNavigate: (path: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return faqGroups;
    const q = searchQuery.toLowerCase().trim();

    return faqGroups
      .map((group) => {
        const filteredItems = group.items.filter(
          (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        );
        return { ...group, items: filteredItems };
      })
      .filter((group) => group.items.length > 0);
  }, [searchQuery]);

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="faq-main" style={{ flex: 1 }}>
        <div className="faq-shell">
          <header className="faq-heading">
            <p className="faq-eyebrow">Help center</p>
            <h1>Frequently asked questions</h1>
            <p className="faq-intro">
              Answers to the things server owners usually want to know before adding Hedwig.
            </p>

            <div style={{ maxWidth: '520px', margin: '24px auto 0' }}>
              <input
                type="search"
                placeholder="Search questions or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#111212',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </header>

          <div className="faq-groups">
            {filteredGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#71717a' }}>
                <p>No questions matched "{searchQuery}".</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    marginTop: '12px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <section key={group.kicker} className="faq-group">
                  <div className="faq-group-heading">
                    <span className="faq-group-kicker">{group.kicker}</span>
                    <h2>{group.title}</h2>
                  </div>

                  <div className="faq-list">
                    {group.items.map((item, idx) => (
                      <details key={idx} className="faq-item" open={searchQuery ? true : idx === 0}>
                        <summary>{item.q}</summary>
                        <div
                          className="faq-answer"
                          dangerouslySetInnerHTML={{ __html: item.a }}
                        />
                      </details>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
