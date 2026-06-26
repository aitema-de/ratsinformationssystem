'use client';

import { useState } from 'react';

interface SimpleLanguageToggleProps {
  paperId: string;
  preloaded?: string | null;
  originalText: string;
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    plausible?: (_event: string, _opts?: { props?: Record<string, string> }) => void;
  }
}

export default function SimpleLanguageToggle({
  paperId,
  preloaded = null,
  originalText,
}: SimpleLanguageToggleProps) {
  const [simpleMode, setSimpleMode] = useState(false);
  const [simpleText, setSimpleText] = useState<string | null>(preloaded);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (simpleMode) {
      setSimpleMode(false);
      return;
    }
    if (simpleText) {
      setSimpleMode(true);
      return;
    }
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(
        `${apiBase}/api/export/paper/${paperId}/simple-language`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
      );
      const data = await res.json();
      setSimpleText(data.simple_language_text || null);
      setSimpleMode(true);
      if (typeof window !== 'undefined' && window.plausible) {
        window.plausible('simple_language_generated', {
          props: { paper_id: paperId },
        });
      }
    } catch (e) {
      console.error('SimpleLanguage fetch error', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.8125rem',
            border: '1px solid #e2e8f0',
            borderRadius: '9999px',
            background: simpleMode ? '#f0fdf4' : '#fff',
            color: simpleMode ? '#166534' : '#64748b',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'all 0.15s',
          }}
          aria-pressed={simpleMode}
          aria-label={
            simpleMode ? 'Originaltext anzeigen' : 'Einfache Sprache generieren'
          }
        >
          {loading
            ? 'Wird generiert...'
            : simpleMode
            ? 'Originaltext'
            : 'Einfache Sprache'}
        </button>
        {simpleMode && (
          <span
            style={{
              fontSize: '0.6875rem',
              background: '#f0fdf4',
              color: '#15803d',
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              border: '1px solid #bbf7d0',
            }}
          >
            BFSG - KI-generiert
          </span>
        )}
      </div>
      {simpleMode && simpleText ? (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.5rem',
            padding: '1rem',
          }}
        >
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#15803d',
              marginBottom: '0.5rem',
            }}
          >
            Einfache Sprache (A2-Niveau)
          </p>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#14532d',
              lineHeight: '1.6',
            }}
          >
            {simpleText}
          </p>
        </div>
      ) : (
        <p
          style={{
            fontSize: '0.875rem',
            color: '#64748b',
            lineHeight: '1.5',
          }}
        >
          {originalText}
        </p>
      )}
    </div>
  );
}
