'use client';

import { useEffect, useState } from 'react';

interface Paper {
  id: string;
  name: string;
  reference: string;
  date: string;
  paper_type: string;
  ai_summary?: string;
  ai_summary_generated_at?: string;
}

const paperTypes = [
  'Vorlage', 'Antrag', 'Anfrage', 'Beschlussvorlage',
  'Mitteilung', 'Stellungnahme', 'Bericht',
];

const typeColors: Record<string, string> = {
  'Vorlage':          'badge-blue',
  'Antrag':           'badge-purple',
  'Anfrage':          'badge-purple',
  'Beschlussvorlage': 'badge-amber',
  'Mitteilung':       'badge-slate',
  'Stellungnahme':    'badge-green',
  'Bericht':          'badge-slate',
};

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '0.875rem 1rem' }}>
        <div className="skeleton" style={{ height: '0.875rem', width: '80px' }} />
      </td>
      <td style={{ padding: '0.875rem 1rem' }}>
        <div className="skeleton" style={{ height: '0.875rem', width: '70%' }} />
      </td>
      <td style={{ padding: '0.875rem 1rem' }}>
        <div className="skeleton" style={{ height: '1.25rem', width: '80px', borderRadius: '9999px' }} />
      </td>
      <td style={{ padding: '0.875rem 1rem' }}>
        <div className="skeleton" style={{ height: '0.875rem', width: '70px' }} />
      </td>
    </tr>
  );
}

export default function VorlagenPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paperType, setPaperType] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null);

  const handleGenerateSummary = async (paperId: string) => {
    setGeneratingSummary(paperId);
    try {
      const res = await fetch(`/api/papers/${paperId}/summarize`, { method: 'POST' });
      const data = await res.json();
      if (data.summary) {
        setPapers(prev => prev.map(p =>
          p.id === paperId
            ? { ...p, ai_summary: data.summary, ai_summary_generated_at: data.generated_at }
            : p
        ));
      }
    } catch (e) {
      console.error('Zusammenfassung fehlgeschlagen:', e);
    } finally {
      setGeneratingSummary(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: '1' });
    if (search) params.set('q', search);
    if (paperType) params.set('paper_type', paperType);

    fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/papers?' + params.toString())
      .then(r => r.json())
      .then(data => {
        setPapers(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, paperType]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Vorlagen &amp; Drucksachen</h1>
        </div>
        <p className="page-subtitle">Alle Beschlussvorlagen, Antraege und Drucksachen des Stadtrats</p>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.625rem',
        padding: '1.125rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.875rem',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}>
        <div style={{ flex: '1 1 260px' }}>
          <label htmlFor="search-papers" className="form-label">Suche</label>
          <div style={{ position: 'relative' }}>
            <svg
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              id="search-papers"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Vorlagen durchsuchen..."
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
        </div>
        <div style={{ flex: '0 1 220px' }}>
          <label htmlFor="filter-type" className="form-label">Dokumenttyp</label>
          <select
            id="filter-type"
            value={paperType}
            onChange={(e) => setPaperType(e.target.value)}
            className="form-select"
          >
            <option value="">Alle Typen</option>
            {paperTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {(search || paperType) && (
          <button
            onClick={() => { setSearch(''); setPaperType(''); }}
            className="btn-secondary"
            style={{ flexShrink: 0, fontSize: '0.875rem', padding: '0.5rem 1rem', minHeight: '44px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Zuruecksetzen
          </button>
        )}
      </div>

      {/* Live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {!loading && (papers.length + ' Vorlagen gefunden')}
      </div>

      {/* Table */}
      <div style={{
        background: '#fff',
        borderRadius: '0.625rem',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Vorlagen und Drucksachen">
          <thead>
            <tr style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
              <th scope="col" style={thStyle}>Drucksachen-Nr.</th>
              <th scope="col" style={{ ...thStyle, width: '50%' }}>Titel</th>
              <th scope="col" style={thStyle}>Typ</th>
              <th scope="col" style={thStyle}>Datum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : papers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '4rem', textAlign: 'center' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                    color: '#94a3b8',
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#64748b' }}>Keine Vorlagen gefunden</p>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Versuche andere Suchbegriffe oder Filteroptionen.</p>
                  </div>
                </td>
              </tr>
            ) : (
              papers.map((p, idx) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? '#fff' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#f8fafc')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? '#fff' : 'transparent')}
                >
                  <td style={tdStyle}>
                    <a
                      href={'/vorlagen/' + (p.id.split('/').pop() || p.id)}
                      onClick={() => {
                        const w = window as unknown as { plausible?: (_e: string, _o: object) => void };
                        if (w.plausible) w.plausible('vorlage_angesehen', { props: { type: p.paper_type } });
                      }}
                      style={{
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {p.reference}
                    </a>
                  </td>
                  <td style={{ ...tdStyle, color: '#0f172a', fontWeight: 500, lineHeight: 1.5 }}>
                    {p.name}
                    {p.ai_summary && (
                      <div style={{ marginTop: '0.375rem', display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, color: '#2563eb',
                          background: '#eff6ff', border: '1px solid #bfdbfe',
                          borderRadius: '0.25rem', padding: '0.1rem 0.35rem',
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          KI
                        </span>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>
                          {p.ai_summary}
                        </p>
                      </div>
                    )}
                    {!p.ai_summary && (
                      <button
                        onClick={() => handleGenerateSummary(p.id)}
                        disabled={generatingSummary === p.id}
                        style={{
                          marginTop: '0.25rem',
                          fontSize: '0.75rem', color: '#6b7280',
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '0.125rem 0', textDecoration: 'underline',
                          opacity: generatingSummary === p.id ? 0.5 : 1,
                        }}
                      >
                        {generatingSummary === p.id ? 'KI generiert...' : 'KI-Zusammenfassung erstellen'}
                      </button>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span className={'badge ' + (typeColors[p.paper_type] || 'badge-slate')}>
                      {p.paper_type}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Intl.DateTimeFormat('de-DE').format(new Date(p.date))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '0.75rem',
  color: '#64748b',
  borderBottom: '2px solid #e2e8f0',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '0.875rem 1rem',
  fontSize: '0.875rem',
  verticalAlign: 'middle',
};
