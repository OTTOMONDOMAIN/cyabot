import React, { useState } from 'react';
import type { Command } from '../types';

interface CommandModalProps {
  command: Command | null;
  onClose: () => void;
}

export const CommandModal: React.FC<CommandModalProps> = ({ command, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!command) return null;

  const copyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const slashSyntax = `/${command.name}${
    command.arguments && command.arguments.length > 0
      ? ' ' + command.arguments.map((a) => (a.required ? `<${a.name}>` : `[${a.name}]`)).join(' ')
      : ''
  }`;

  const prefixSyntax = `,${command.name}${
    command.arguments && command.arguments.length > 0
      ? ' ' + command.arguments.map((a) => (a.required ? `<${a.name}>` : `[${a.name}]`)).join(' ')
      : ''
  }`;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0c1014',
          border: '1px solid rgba(34, 211, 238, 0.25)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.15)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            color: '#949ba4',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              color: '#22d3ee',
              border: '1px solid rgba(34, 211, 238, 0.3)',
            }}
          >
            {command.category}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#949ba4',
            }}
          >
            {command.type || 'both'}
          </span>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: '0 0 10px 0' }}>
          {command.name}
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: '15px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
          {command.description}
        </p>

        {/* Syntax Copy Box */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
            Syntax & Usage
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#070a0d',
              border: '1px solid rgba(34, 211, 238, 0.18)',
              borderRadius: '10px',
              padding: '10px 14px',
              gap: '12px',
            }}
          >
            <code style={{ color: '#22d3ee', fontSize: '14px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {slashSyntax}
            </code>
            <button
              onClick={() => copyText(slashSyntax, 'slash')}
              style={{
                backgroundColor: 'rgba(6, 182, 212, 0.18)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              {copiedType === 'slash' ? '✓ Copied' : 'Copy Slash'}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#070a0d',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '10px 14px',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            <code style={{ color: '#949ba4', fontSize: '14px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {prefixSyntax}
            </code>
            <button
              onClick={() => copyText(prefixSyntax, 'prefix')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              {copiedType === 'prefix' ? '✓ Copied' : 'Copy Prefix'}
            </button>
          </div>
        </div>

        {/* Arguments list */}
        {command.arguments && command.arguments.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              Arguments ({command.arguments.length})
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {command.arguments.map((arg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ color: '#f0f1f4', fontSize: '13px', fontWeight: 600 }}>{arg.name}</code>
                    {arg.description && (
                      <span style={{ color: '#71717a', fontSize: '13px' }}>— {arg.description}</span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: arg.required ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.06)',
                      color: arg.required ? '#fca5a5' : '#a1a1aa',
                      fontWeight: 500,
                    }}
                  >
                    {arg.required ? 'Required' : 'Optional'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aliases */}
        {command.aliases && command.aliases.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              Aliases
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {command.aliases.map((alias, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    padding: '3px 9px',
                    fontSize: '12px',
                    color: '#d4d4d8',
                    fontFamily: 'monospace',
                  }}
                >
                  ,{alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Permissions */}
        {command.permissions && command.permissions.length > 0 && (
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              Required Permissions
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {command.permissions.map((perm, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    borderRadius: '6px',
                    padding: '3px 9px',
                    fontSize: '12px',
                    color: '#22d3ee',
                  }}
                >
                  🔒 {perm}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
