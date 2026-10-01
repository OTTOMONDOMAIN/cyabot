import React, { useState, useMemo } from 'react';
import { useCommands } from '../hooks/useData';
import { Footer } from '../components/Footer';
import { CommandModal } from '../components/CommandModal';
import type { Command } from '../types';

interface CommandsPageProps {
  onNavigate: (path: string) => void;
}

const ITEMS_PER_PAGE = 24;

export const CommandsPage: React.FC<CommandsPageProps> = ({ onNavigate }) => {
  const { categories, commands, loading } = useCommands();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeModalCommand, setActiveModalCommand] = useState<Command | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Filter commands
  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      // Category check
      if (selectedCategory !== 'all') {
        const catMatch = cmd.category.toLowerCase().replace(/[^a-z0-9]/g, '') === selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!catMatch) return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = cmd.name.toLowerCase().includes(query);
        const descMatch = cmd.description.toLowerCase().includes(query);
        const aliasMatch = cmd.aliases?.some((a) => a.toLowerCase().includes(query));
        const argMatch = cmd.arguments?.some((arg) => arg.name.toLowerCase().includes(query) || arg.description?.toLowerCase().includes(query));
        if (!nameMatch && !descMatch && !aliasMatch && !argMatch) return false;
      }

      return true;
    });
  }, [commands, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCommands.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedCommands = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredCommands.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCommands, safePage]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setCategoryMenuOpen(false);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  const currentCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return 'All categories';
    const found = categories.find((c) => c.id === selectedCategory || c.label.toLowerCase() === selectedCategory.toLowerCase());
    return found ? found.label : selectedCategory;
  }, [selectedCategory, categories]);

  const copyCommand = (cmd: Command, e: React.MouseEvent) => {
    e.stopPropagation();
    const syntax = `/${cmd.name}`;
    navigator.clipboard.writeText(syntax);
    setCopiedCmd(cmd.name);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="commands-main" style={{ flex: 1 }}>
        <div className="commands-shell">
          <div className="commands-heading">
            <h1>Commands</h1>
          </div>

          {/* Controls Bar */}
          <section className="command-controls" aria-label="Command filters">
            <label className="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-4-4"></path>
              </svg>
              <span className="sr-only">Search commands</span>
              <input
                id="command-search"
                type="search"
                placeholder="Search commands, descriptions, or arguments..."
                autoComplete="off"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </label>

            <div className="category-field" style={{ position: 'relative' }}>
              <button
                id="category-trigger"
                className="category-trigger"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={categoryMenuOpen}
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              >
                <span className="category-trigger-content">
                  <svg id="category-trigger-icon" viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h10M4 18h14"></path>
                  </svg>
                  <span id="category-value">{currentCategoryLabel}</span>
                </span>
                <svg className="chevron" viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>

              {/* Category Dropdown Menu */}
              {categoryMenuOpen && (
                <div
                  id="category-menu"
                  className="category-menu"
                  role="listbox"
                  style={{
                    display: 'block',
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 40,
                    width: '260px',
                    maxHeight: '360px',
                    overflowY: 'auto',
                    backgroundColor: '#111212',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                    padding: '6px',
                    marginTop: '6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('all')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: selectedCategory === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: selectedCategory === 'all' ? '#fff' : '#949ba4',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    <span>All categories</span>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>{commands.length}</span>
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: selectedCategory === cat.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: selectedCategory === cat.id ? '#fff' : '#949ba4',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <span>{cat.label}</span>
                      <span style={{ fontSize: '11px', opacity: 0.6 }}>{cat.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Results Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 4px', fontSize: '13px', color: '#71717a' }}>
            <span>
              Showing {filteredCommands.length} command{filteredCommands.length === 1 ? '' : 's'}
              {selectedCategory !== 'all' ? ` in ${currentCategoryLabel}` : ''}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </span>
            {(selectedCategory !== 'all' || searchQuery) && (
              <button
                onClick={resetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7a97c3',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {loading && (
            <div id="data-status" className="data-status" role="status">
              Loading commands…
            </div>
          )}

          {/* Commands Grid */}
          {!loading && filteredCommands.length > 0 && (
            <section id="command-grid" className="command-grid">
              {paginatedCommands.map((cmd) => (
                <article
                  key={cmd.name}
                  className="command-card"
                  onClick={() => setActiveModalCommand(cmd)}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(6, 182, 212, 0.15)',
                          color: '#22d3ee',
                          letterSpacing: '0.04em',
                          border: '1px solid rgba(34, 211, 238, 0.2)',
                        }}
                      >
                        {cmd.category}
                      </span>
                      {cmd.aliases && cmd.aliases.length > 0 && (
                        <span style={{ fontSize: '11px', color: '#6a6f71', fontFamily: 'monospace' }}>
                          ,{cmd.aliases[0]}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => copyCommand(cmd, e)}
                      title="Copy slash command"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: copiedCmd === cmd.name ? '#4ade80' : '#8b8e96',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      {copiedCmd === cmd.name ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                    {cmd.name}
                  </h3>

                  <p style={{ margin: 0, fontSize: '13px', color: '#71717a', lineHeight: 1.45 }}>
                    {cmd.description}
                  </p>

                  {/* Arguments Preview */}
                  {cmd.arguments && cmd.arguments.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
                      {cmd.arguments.map((arg, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            color: arg.required ? '#d4d4d8' : '#71717a',
                            border: arg.required ? '1px solid rgba(255,255,255,0.08)' : 'none',
                          }}
                        >
                          {arg.required ? `<${arg.name}>` : `[${arg.name}]`}
                        </span>
                      ))}
                    </div>
                  )}

                  <b aria-hidden="true">/{cmd.name.split(' ')[0]}</b>
                </article>
              ))}
            </section>
          )}

          {/* Empty State */}
          {!loading && filteredCommands.length === 0 && (
            <div id="empty-state" className="empty-state" style={{ display: 'block', padding: '64px 20px', textAlign: 'center' }}>
              <span className="empty-icon" style={{ fontSize: '36px', display: 'block', marginBottom: '12px', color: '#71717a' }}>⌕</span>
              <h2 style={{ fontSize: '20px', color: '#fff', margin: '0 0 8px 0' }}>No commands found</h2>
              <p style={{ color: '#71717a', margin: '0 0 20px 0' }}>Try a different search query or select another category.</p>
              <button
                id="reset-filters"
                type="button"
                onClick={resetFilters}
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  backgroundColor: '#5865f2',
                  color: '#fff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Command pages" style={{ marginTop: '40px' }}>
              <button
                id="previous-page"
                type="button"
                aria-label="Previous page"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ opacity: safePage <= 1 ? 0.3 : 1, cursor: safePage <= 1 ? 'not-allowed' : 'pointer' }}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m10 3-5 5 5 5"></path>
                </svg>
              </button>

              <div id="page-numbers" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // Show current page, edges, and nearby pages
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= safePage - 2 && pageNum <= safePage + 2)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          border: pageNum === safePage ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.06)',
                          backgroundColor: pageNum === safePage ? '#06b6d4' : 'rgba(255,255,255,0.03)',
                          color: '#fff',
                          boxShadow: pageNum === safePage ? '0 0 12px rgba(6, 182, 212, 0.4)' : 'none',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === safePage - 3 ||
                    pageNum === safePage + 3
                  ) {
                    return <span key={pageNum} style={{ color: '#555' }}>…</span>;
                  }
                  return null;
                })}
              </div>

              <button
                id="next-page"
                type="button"
                aria-label="Next page"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ opacity: safePage >= totalPages ? 0.3 : 1, cursor: safePage >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 3 5 5-5 5"></path>
                </svg>
              </button>
            </nav>
          )}
        </div>
      </main>

      <Footer onNavigate={onNavigate} variant="commands" />

      {/* Details modal */}
      <CommandModal command={activeModalCommand} onClose={() => setActiveModalCommand(null)} />
    </div>
  );
};
