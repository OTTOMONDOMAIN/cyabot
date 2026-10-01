import React from 'react';
import legalData from '../data/legal.json';
import { Footer } from '../components/Footer';

interface LegalPageProps {
  type: 'tos' | 'privacy' | 'refund';
  onNavigate: (path: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onNavigate }) => {
  const page = (legalData as any)[type] || (legalData as any)['tos'];

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="legal-main" style={{ flex: 1, padding: '48px 24px' }}>
        <article className="legal-shell" style={{ maxWidth: '780px', margin: '0 auto' }}>
          <p className="legal-eyebrow" style={{ color: '#7a97c3', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            {page.eyebrow}
          </p>
          <h1 style={{ fontSize: '38px', fontWeight: 700, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            {page.title}
          </h1>
          <p className="legal-meta" style={{ color: '#71717a', fontSize: '14px', marginBottom: '36px' }}>
            {page.meta}
          </p>

          <div className="legal-content" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {page.sections.map((sec: any, idx: number) => (
              <section key={idx} style={{ borderBottom: idx < page.sections.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f0f1f4', margin: '0 0 12px 0' }}>
                  {sec.heading}
                </h2>
                {sec.paragraphs.map((para: string, pIdx: number) => (
                  <p
                    key={pIdx}
                    style={{ fontSize: '14px', color: '#949ba4', lineHeight: 1.65, margin: '0 0 10px 0' }}
                    dangerouslySetInnerHTML={{ __html: para }}
                  />
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
