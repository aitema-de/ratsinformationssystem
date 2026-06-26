'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { SubscribeButton } from '@/components/SubscribeButton';
import RAGChat from './rag-chat';
import HeroSection from '@/components/ui/HeroSection';
import ExplainerAnimation from '@/components/ui/ExplainerAnimation';

// ============================================================
// Typen
// ============================================================

interface SearchItem {
  id: string;
  type: string;
  name: string;
  reference?: string;
  date?: string;
  paper_type?: string;
  meeting_state?: string;
  organization_name?: string;
  score: number;
  highlight?: Record<string, string[]>;
}

interface FacetBucket {
  key: string;
  count: number;
}

interface SearchResponse {
  data: SearchItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  facets: {
    by_type?: FacetBucket[];
    by_paper_type?: FacetBucket[];
    by_organization?: FacetBucket[];
    by_meeting_state?: FacetBucket[];
    by_year?: FacetBucket[];
  };
  query: string;
}

interface AutocompleteSuggestion {
  id: string;
  type: string;
  name: string;
  reference?: string;
  score: number;
}

// ============================================================
// Hilfskonstanten
// ============================================================


// Semantic search types
interface SemanticResult {
  id: string;
  name?: string;
  paper_type?: string;
  date?: string;
  reference?: string;
  similarity_score: number;
}

interface SemanticSearchResponse {
  results: SemanticResult[];
  mode: string;
  query: string;
  total: number;
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const TYPE_LABELS: Record<string, string> = {
  paper: 'Vorlage',
  meeting: 'Sitzung',
  person: 'Person',
  organization: 'Gremium',
};

const TYPE_COLORS: Record<string, string> = {
  paper: '#3b82f6',
  meeting: '#8b5cf6',
  person: '#f59e0b',
  organization: '#059669',
};

const TYPE_BADGE_CLASS: Record<string, string> = {
  paper: 'badge-blue',
  meeting: 'badge-purple',
  person: 'badge-amber',
  organization: 'badge-green',
};

const MEETING_STATE_LABELS: Record<string, string> = {
  scheduled: 'Geplant',
  invited: 'Eingeladen',
  running: 'Laufend',
  completed: 'Abgeschlossen',
  cancelled: 'Abgesagt',
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

// ============================================================
// Hilfsfunktionen
// ============================================================

function getItemLink(item: SearchItem): string {
  const slug = item.id?.split('/').pop() || item.id;
  switch (item.type) {
    case 'paper':   return `/vorlagen/${slug}`;
    case 'meeting': return `/sitzungen/${slug}`;
    case 'person':  return `/personen/${slug}`;
    default:        return '#';
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function HighlightedText({ html }: { html: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ lineHeight: 1.6 }}
    />
  );
}

// Type-Icon component
function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'paper':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      );
    case 'meeting':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      );
    case 'person':
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      );
  }
}

// ============================================================
// Haupt-Komponente
// ============================================================

function SuchePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State aus URL lesen
  const [query, setQuery]       = useState(searchParams.get('q') || '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  const [gremiumFilter, setGremiumFilter] = useState(searchParams.get('gremium') || '');
  const [yearFilter, setYearFilter] = useState(searchParams.get('year') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Ergebnisse
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  // Mobile-Filter-Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Semantische Suche
  const [searchMode] = useState<'keyword' | 'semantic'>('keyword');
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResponse | null>(null);
  const [semanticLoading, setSemanticLoading] = useState(false);



  const autocompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ----------------------------------------
  // URL-Sync
  // ----------------------------------------

  const updateURL = useCallback((params: {
    q?: string; type?: string; gremium?: string;
    year?: string; status?: string; page?: number;
  }) => {
    const p = new URLSearchParams();
    const q       = params.q       !== undefined ? params.q       : query;
    const type    = params.type    !== undefined ? params.type    : typeFilter;
    const gremium = params.gremium !== undefined ? params.gremium : gremiumFilter;
    const year    = params.year    !== undefined ? params.year    : yearFilter;
    const status  = params.status  !== undefined ? params.status  : statusFilter;
    const pg      = params.page    !== undefined ? params.page    : page;

    if (q)       p.set('q', q);
    if (type)    p.set('type', type);
    if (gremium) p.set('gremium', gremium);
    if (year)    p.set('year', year);
    if (status)  p.set('status', status);
    if (pg > 1)  p.set('page', String(pg));

    router.replace(`/suche?${p.toString()}`, { scroll: false });
  }, [query, typeFilter, gremiumFilter, yearFilter, statusFilter, page, router]);

  // ----------------------------------------
  // Suche ausfuehren
  // ----------------------------------------

  const executeSearch = useCallback(async (
    q: string,
    type: string,
    gremium: string,
    year: string,
    status: string,
    pg: number,
  ) => {
    if (!q || q.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), page: String(pg), per_page: '10' });
      if (type)    params.set('type', type);
      if (gremium) params.set('gremium', gremium);
      if (year)    params.set('year', year);
      if (status)  params.set('status', status);

      const resp = await fetch(`${API_URL}/api/v1/search?${params}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: SearchResponse = await resp.json();
      setResults(data);
    } catch (err) {
      console.error('Suche fehlgeschlagen:', err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);


  // Semantische Suche ausfuehren
  // eslint-disable-next-line no-unused-vars
  const runSemanticSearch = async (q: string) => {
    if (!q || q.trim().length < 2) {
      setSemanticResults(null);
      return;
    }
    setSemanticLoading(true);
    try {
      const params = new URLSearchParams({ query: q.trim(), limit: '10' });
      const resp = await fetch(`${API_URL}/api/v1/search/semantic?${params}`, {
        method: 'POST',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: SemanticSearchResponse = await resp.json();
      setSemanticResults(data);
    } catch (err) {
      console.error('Semantische Suche fehlgeschlagen:', err);
      setSemanticResults(null);
    } finally {
      setSemanticLoading(false);
    }
  };

  // Wenn URL-Parameter sich aendern: Suche
  useEffect(() => {
    if (query.trim().length >= 2) {
      executeSearch(query, typeFilter, gremiumFilter, yearFilter, statusFilter, page);
    }
  }, [query, typeFilter, gremiumFilter, yearFilter, statusFilter, page, executeSearch]);

  // ----------------------------------------
  // Autocomplete (debounced 300ms)
  // ----------------------------------------

  const fetchAutocomplete = useCallback(async (val: string) => {
    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const params = new URLSearchParams({ q: val.trim() });
      if (typeFilter) params.set('type', typeFilter);
      const resp = await fetch(`${API_URL}/api/v1/search/autocomplete?${params}`);
      if (!resp.ok) return;
      const data = await resp.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions((data.suggestions || []).length > 0);
    } catch {
      setSuggestions([]);
    }
  }, [typeFilter]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setActiveSuggestion(-1);
    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    autocompleteTimer.current = setTimeout(() => fetchAutocomplete(val), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') submitSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        selectSuggestion(suggestions[activeSuggestion]);
      } else {
        setShowSuggestions(false);
        submitSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: AutocompleteSuggestion) => {
    setInputValue(s.name);
    setShowSuggestions(false);
    setSuggestions([]);
    const newPage = 1;
    setQuery(s.name);
    setPage(newPage);
    updateURL({ q: s.name, page: newPage });
  };

  const submitSearch = () => {
    setShowSuggestions(false);
    const newPage = 1;
    setQuery(inputValue);
    setPage(newPage);
    updateURL({ q: inputValue, page: newPage });
  };

  // Click-Outside fuer Suggestions
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ----------------------------------------
  // Filter-Aenderungen
  // ----------------------------------------

  const applyFilter = (key: string, value: string) => {
    const newPage = 1;
    setPage(newPage);
    if (key === 'type')    { setTypeFilter(value);    updateURL({ type: value,    page: newPage }); }
    if (key === 'gremium') { setGremiumFilter(value); updateURL({ gremium: value, page: newPage }); }
    if (key === 'year')    { setYearFilter(value);    updateURL({ year: value,    page: newPage }); }
    if (key === 'status')  { setStatusFilter(value);  updateURL({ status: value,  page: newPage }); }
  };

  const clearAllFilters = () => {
    setTypeFilter('');
    setGremiumFilter('');
    setYearFilter('');
    setStatusFilter('');
    setPage(1);
    updateURL({ type: '', gremium: '', year: '', status: '', page: 1 });
  };

  const hasFilters = !!(typeFilter || gremiumFilter || yearFilter || statusFilter);

  const gremienOptions: string[] = results?.facets?.by_organization?.map(f => f.key) || [];

  // ----------------------------------------
  // Filter-Sidebar Inhalt
  // ----------------------------------------

  const FilterContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Typ */}
      <div>
        <p style={filterLabelStyle}>Inhaltstyp</p>
        {results?.facets?.by_type ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <button
              onClick={() => applyFilter('type', '')}
              style={{
                ...facetBtnStyle,
                background: !typeFilter ? '#f1f5f9' : 'transparent',
                fontWeight: !typeFilter ? 600 : 400,
                color: '#0f172a',
              }}
            >
              <span>Alle Typen</span>
              <span style={facetCountStyle}>{results.total}</span>
            </button>
            {query.trim().length >= 2 && results.total > 0 && (
              <div style={{ marginTop: '0.75rem', paddingLeft: '0.5rem' }}>
                <SubscribeButton
                  targetId={query.trim()}
                  targetLabel={`Suche: ${query.trim()}`}
                  type="keyword"
                />
              </div>
            )}
            {results.facets.by_type.map(f => (
              <button
                key={f.key}
                onClick={() => applyFilter('type', typeFilter === f.key ? '' : f.key)}
                style={{
                  ...facetBtnStyle,
                  background: typeFilter === f.key ? TYPE_COLORS[f.key] + '18' : 'transparent',
                  borderColor: typeFilter === f.key ? TYPE_COLORS[f.key] : '#e2e8f0',
                  color: typeFilter === f.key ? TYPE_COLORS[f.key] : '#374151',
                  fontWeight: typeFilter === f.key ? 600 : 400,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: TYPE_COLORS[f.key] || '#64748b' }}>
                    <TypeIcon type={f.key} />
                  </span>
                  {TYPE_LABELS[f.key] || f.key}
                </span>
                <span style={{ ...facetCountStyle, background: typeFilter === f.key ? TYPE_COLORS[f.key] + '20' : 'rgba(0,0,0,0.06)' }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <select
            value={typeFilter}
            onChange={e => applyFilter('type', e.target.value)}
            className="form-select"
            aria-label="Nach Typ filtern"
          >
            <option value="">Alle Typen</option>
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Jahr */}
      <div>
        <p style={filterLabelStyle}>Jahr</p>
        <select
          value={yearFilter}
          onChange={e => applyFilter('year', e.target.value)}
          className="form-select"
          aria-label="Nach Jahr filtern"
        >
          <option value="">Alle Jahre</option>
          {results?.facets?.by_year
            ? results.facets.by_year.map(f => (
                <option key={f.key} value={f.key}>{f.key} ({f.count})</option>
              ))
            : YEARS.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))
          }
        </select>
      </div>

      {/* Gremium */}
      {gremienOptions.length > 0 && (
        <div>
          <p style={filterLabelStyle}>Gremium</p>
          <select
            value={gremiumFilter}
            onChange={e => applyFilter('gremium', e.target.value)}
            className="form-select"
            aria-label="Nach Gremium filtern"
          >
            <option value="">Alle Gremien</option>
            {gremienOptions.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      )}

      {/* Status */}
      {results?.facets?.by_meeting_state && results.facets.by_meeting_state.length > 0 && (
        <div>
          <p style={filterLabelStyle}>Sitzungsstatus</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {results.facets.by_meeting_state.map(f => (
              <button
                key={f.key}
                onClick={() => applyFilter('status', statusFilter === f.key ? '' : f.key)}
                style={{
                  ...facetBtnStyle,
                  background: statusFilter === f.key ? '#1e3a5f' : 'transparent',
                  color: statusFilter === f.key ? '#fff' : '#374151',
                  borderColor: statusFilter === f.key ? '#1e3a5f' : '#e2e8f0',
                  fontWeight: statusFilter === f.key ? 600 : 400,
                }}
              >
                <span>{MEETING_STATE_LABELS[f.key] || f.key}</span>
                <span style={facetCountStyle}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter zuruecksetzen */}
      {hasFilters && (
        <button
          onClick={clearAllFilters}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fca5a5',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Alle Filter loeschen
        </button>
      )}
    </div>
  );

  // ----------------------------------------
  // Render
  // ----------------------------------------

  return (
    <>
      {/* Mobile Filter-Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          aria-hidden="true"
        />
      )}

      {/* Mobile Filter-Drawer */}
      <div
        role="dialog"
        aria-label="Suchfilter"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: drawerOpen ? 0 : '-320px',
          top: 0, bottom: 0, width: '300px',
          background: '#fff', zIndex: 50,
          padding: '1.5rem', overflowY: 'auto',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          transition: 'left 0.25s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Filter</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              background: '#f1f5f9', border: 'none', cursor: 'pointer',
              width: '32px', height: '32px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', fontSize: '1.125rem', lineHeight: 1,
            }}
            aria-label="Filter schliessen"
          >
            &times;
          </button>
        </div>
        <FilterContent />
      </div>

      {/* Hauptinhalt */}
      <div className="space-y-12">
        <HeroSection />
        <div className="container mx-auto px-4">
          <ExplainerAnimation />
        </div>

        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
            <div style={{
              width: '40px', height: '40px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>Volltextsuche</h1>
          </div>
          <p className="page-subtitle">Durchsuche alle Vorlagen, Sitzungen, Personen und Gremien</p>
        </div>

        {/* Suchleiste */}
        <div style={{ marginBottom: '1.25rem' }}>
          <form
            role="search"
            aria-label="Ratsinformationssystem durchsuchen"
            onSubmit={e => { e.preventDefault(); submitSearch(); }}
          >
            <div style={{ position: 'relative', display: 'flex', gap: '0.75rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                {/* Search Icon inside input */}
                <svg
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>

                <label htmlFor="main-search" className="sr-only">Suchbegriff</label>
                <input
                  id="main-search"
                  ref={inputRef}
                  type="search"
                  value={inputValue}
                  onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={e => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                    (e.target as HTMLInputElement).style.borderColor = '#3b82f6';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                  }}
                  onBlur={e => {
                    (e.target as HTMLInputElement).style.borderColor = '#e2e8f0';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                  }}
                  placeholder="Beschluesse, Sitzungen, Vorlagen suchen..."
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls="autocomplete-list"
                  aria-expanded={showSuggestions}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 3rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    minHeight: '52px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    fontFamily: 'inherit',
                    color: '#0f172a',
                    background: '#fff',
                  }}
                />

                {/* Autocomplete-Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    id="autocomplete-list"
                    ref={suggestionsRef}
                    role="listbox"
                    aria-label="Suchvorschlaege"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0, right: 0,
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      zIndex: 30,
                      maxHeight: '320px',
                      overflowY: 'auto',
                      overflow: 'hidden',
                    }}
                  >
                    {suggestions.map((s, i) => (
                      <button
                        key={s.id || i}
                        role="option"
                        aria-selected={i === activeSuggestion}
                        onClick={() => selectSuggestion(s)}
                        onMouseEnter={() => setActiveSuggestion(i)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: i === activeSuggestion ? '#f8fafc' : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          transition: 'background 0.1s',
                        }}
                      >
                        <span style={{ color: TYPE_COLORS[s.type] || '#64748b', flexShrink: 0 }}>
                          <TypeIcon type={s.type} />
                        </span>
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: '#fff',
                          background: TYPE_COLORS[s.type] || '#64748b',
                          whiteSpace: 'nowrap',
                        }}>
                          {TYPE_LABELS[s.type] || s.type}
                        </span>
                        <span style={{ fontSize: '0.875rem', color: '#0f172a', flex: 1 }}>{s.name}</span>
                        {s.reference && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', flexShrink: 0 }}>{s.reference}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Filter-Button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Filter oeffnen"
                style={{
                  padding: '0.875rem 1.125rem',
                  background: hasFilters ? '#1e3a5f' : '#f8fafc',
                  color: hasFilters ? '#fff' : '#475569',
                  border: '2px solid',
                  borderColor: hasFilters ? '#1e3a5f' : '#e2e8f0',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  minHeight: '52px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  display: 'none',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
                className="mobile-filter-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                Filter {hasFilters && `(${[typeFilter, gremiumFilter, yearFilter, statusFilter].filter(Boolean).length})`}
              </button>

              <button
                type="submit"
                disabled={inputValue.trim().length < 2 || loading}
                style={{
                  padding: '0.875rem 2rem',
                  background: inputValue.trim().length < 2 ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: inputValue.trim().length < 2 ? 'not-allowed' : 'pointer',
                  minHeight: '52px',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                  letterSpacing: '-0.01em',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block',
                    }} aria-hidden="true" />
                    Suche...
                  </span>
                ) : 'Suchen'}
              </button>
            </div>
          </form>

          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Mindestens 2 Zeichen eingeben &bull; Autocomplete ab 3 Zeichen
          </p>
        </div>

        {/* Layout: Filter-Sidebar + Ergebnisse */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

          {/* Filter-Sidebar (Desktop) */}
          <aside
            aria-label="Suchfilter"
            className="filter-sidebar"
            style={{
              width: '230px',
              flexShrink: 0,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              position: 'sticky',
              top: '80px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>
                Filter
              </h2>
              {hasFilters && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: 'none', border: 'none', color: '#ef4444',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    padding: '0.125rem', fontFamily: 'inherit',
                  }}
                >
                  Alle loeschen
                </button>
              )}
            </div>
            <FilterContent />
          </aside>

          {/* Ergebnis-Bereich */}
          <div style={{ flex: 1, minWidth: 0 }} aria-live="polite" aria-busy={loading}>

            {/* Loading Skeleton (Stichwortsuche) */}
            {searchMode === 'keyword' && loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div className="skeleton" style={{ height: '1.5rem', width: '60px', borderRadius: '4px' }} />
                      <div className="skeleton" style={{ height: '1.125rem', flex: 1, maxWidth: '60%' }} />
                    </div>
                    <div className="skeleton" style={{ height: '0.875rem', width: '40%' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Ergebnis-Header (Stichwortsuche) */}
            {searchMode === 'keyword' && !loading && results && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }} role="status">
                  <strong style={{ color: '#0f172a' }}>{results.total.toLocaleString('de-DE')}</strong> Ergebnis{results.total !== 1 ? 'se' : ''} fuer &bdquo;{results.query}&ldquo;
                  {hasFilters && <span style={{ color: '#3b82f6' }}> (gefiltert)</span>}
                </p>
                {results.total > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Seite {results.page} von {results.total_pages}
                  </span>
                )}
              </div>
            )}

            {/* Aktive Filter als Tags */}
            {hasFilters && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {typeFilter && (
                  <FilterTag label={`Typ: ${TYPE_LABELS[typeFilter] || typeFilter}`} onRemove={() => applyFilter('type', '')} />
                )}
                {gremiumFilter && (
                  <FilterTag label={`Gremium: ${gremiumFilter}`} onRemove={() => applyFilter('gremium', '')} />
                )}
                {yearFilter && (
                  <FilterTag label={`Jahr: ${yearFilter}`} onRemove={() => applyFilter('year', '')} />
                )}
                {statusFilter && (
                  <FilterTag label={`Status: ${MEETING_STATE_LABELS[statusFilter] || statusFilter}`} onRemove={() => applyFilter('status', '')} />
                )}
              </div>
            )}

            {/* Empty State */}
            {searchMode === 'keyword' && !loading && results && results.total === 0 && (
              <div style={{
                textAlign: 'center', padding: '5rem 2rem',
                background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
              }}>
                <div style={{
                  width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
                  Keine Ergebnisse
                </h2>
                <p style={{ maxWidth: '400px', margin: '0 auto 1rem', color: '#64748b', fontSize: '0.9375rem' }}>
                  Fuer &bdquo;{results.query}&ldquo; wurden keine Dokumente gefunden.
                  Versuche andere Begriffe oder entferne Filter.
                </p>
                {hasFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="btn-primary"
                    style={{ display: 'inline-flex' }}
                  >
                    Filter zuruecksetzen
                  </button>
                )}
              </div>
            )}


            {/* Semantische Suchergebnisse */}
            {searchMode === 'semantic' && !semanticLoading && semanticResults && (
              <>
                {semanticResults.message && (
                  <div style={{
                    padding: '1rem 1.25rem',
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '0.75rem',
                    marginBottom: '1rem',
                    fontSize: '0.875rem',
                    color: '#92400e',
                  }}>
                    {semanticResults.message}
                  </div>
                )}
                {semanticResults.results.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }} role="status">
                        <strong style={{ color: '#0f172a' }}>{semanticResults.total}</strong> semantische Treffer fuer &bdquo;{semanticResults.query}&ldquo;
                      </p>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        padding: '0.25rem 0.625rem',
                        background: '#ede9fe',
                        color: '#6d28d9',
                        borderRadius: '9999px',
                      }}>
                        KI-Suche
                      </span>
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {semanticResults.results.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`/vorlagen/${item.id.split('/').pop() || item.id}`}
                            style={{
                              display: 'block',
                              padding: '1.125rem 1.25rem',
                              background: '#fff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.75rem',
                              textDecoration: 'none',
                              transition: 'box-shadow 0.15s, border-color 0.15s',
                            }}
                            onMouseOver={e => {
                              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#a5b4fc';
                            }}
                            onMouseOut={e => {
                              (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                {item.paper_type && (
                                  <span style={{
                                    display: 'inline-block',
                                    fontSize: '0.6875rem', fontWeight: 700,
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    padding: '0.1875rem 0.5rem',
                                    background: '#dbeafe', color: '#1e40af',
                                    borderRadius: '4px',
                                    marginBottom: '0.375rem',
                                  }}>
                                    {item.paper_type}
                                  </span>
                                )}
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: '#0f172a', lineHeight: 1.4 }}>
                                  {item.name || 'Ohne Titel'}
                                </p>
                                {(item.reference || item.date) && (
                                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                                    {item.reference && <span>{item.reference}</span>}
                                    {item.reference && item.date && <span style={{ margin: '0 0.5rem' }}>·</span>}
                                    {item.date && <span>{new Date(item.date).toLocaleDateString('de-DE')}</span>}
                                  </p>
                                )}
                              </div>
                              <span style={{
                                flexShrink: 0,
                                fontSize: '0.75rem', fontWeight: 700,
                                padding: '0.3125rem 0.625rem',
                                borderRadius: '9999px',
                                background: item.similarity_score >= 80 ? '#dcfce7' : item.similarity_score >= 65 ? '#fef9c3' : '#f1f5f9',
                                color: item.similarity_score >= 80 ? '#15803d' : item.similarity_score >= 65 ? '#a16207' : '#64748b',
                              }}>
                                {item.similarity_score}%
                              </span>
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {semanticResults.results.length === 0 && !semanticResults.message && (
                  <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
                      Keine semantisch aehnlichen Dokumente fuer &bdquo;{semanticResults.query}&ldquo; gefunden.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Semantic Loading */}
            {searchMode === 'semantic' && semanticLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div className="skeleton" style={{ height: '1.5rem', width: '60px', borderRadius: '4px' }} />
                      <div className="skeleton" style={{ height: '1.125rem', flex: 1, maxWidth: '60%' }} />
                    </div>
                    <div className="skeleton" style={{ height: '0.875rem', width: '40%' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Noch keine Suche */}
            {searchMode === 'keyword' && !loading && !results && !query && (
              <div style={{
                textAlign: 'center', padding: '5rem 2rem',
                background: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0',
              }}>
                <div style={{
                  width: '80px', height: '80px',
                  background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                  Volltextsuche
                </h2>
                <p style={{ fontSize: '0.9375rem', color: '#64748b', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                  Gib einen Suchbegriff ein, um Vorlagen, Sitzungen, Personen und Gremien zu durchsuchen.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <span key={key} className={'badge ' + (TYPE_BADGE_CLASS[key] || 'badge-slate')} style={{ padding: '0.5rem 1rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                      <TypeIcon type={key} />
                      &nbsp;{label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ergebnis-Liste */}
            {searchMode === 'keyword' && !loading && results && results.data.length > 0 && (
              <>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {results.data.map((item, i) => (
                    <li key={item.id || i}>
                      <Link
                        href={getItemLink(item)}
                        style={{
                          display: 'block',
                          padding: '1rem 1.25rem',
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.75rem',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                          outline: 'none',
                          borderLeft: `3px solid ${TYPE_COLORS[item.type] || '#e2e8f0'}`,
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = TYPE_COLORS[item.type] || '#3b82f6';
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLElement).style.borderLeftColor = TYPE_COLORS[item.type] || '#e2e8f0';
                        }}
                        onFocus={e => {
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
                        }}
                        onBlur={e => {
                          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}
                      >
                        {/* Header-Zeile */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.375rem' }}>
                          {/* Type Badge */}
                          <span style={{ flexShrink: 0, marginTop: '2px', color: TYPE_COLORS[item.type] || '#64748b' }}>
                            <TypeIcon type={item.type} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                              <span className={'badge ' + (TYPE_BADGE_CLASS[item.type] || 'badge-slate')} style={{ fontSize: '0.6875rem' }}>
                                {TYPE_LABELS[item.type] || item.type}
                              </span>
                              {item.meeting_state && (
                                <span className="badge badge-slate" style={{ fontSize: '0.6875rem' }}>
                                  {MEETING_STATE_LABELS[item.meeting_state] || item.meeting_state}
                                </span>
                              )}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#0f172a', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
                              {item.highlight?.name ? (
                                <HighlightedText html={item.highlight.name[0]} />
                              ) : (
                                item.name
                              )}
                            </div>
                            {/* Meta-Zeile */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: '#64748b', alignItems: 'center' }}>
                              {item.reference && (
                                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
                                  {item.highlight?.reference ? (
                                    <HighlightedText html={item.highlight.reference[0]} />
                                  ) : item.reference}
                                </span>
                              )}
                              {item.date && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                  </svg>
                                  {formatDate(item.date)}
                                </span>
                              )}
                              {item.paper_type && <span>{item.paper_type}</span>}
                              {item.organization_name && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                                  </svg>
                                  {item.organization_name}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Arrow */}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '4px' }} aria-hidden="true">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </div>

                        {/* Highlight-Snippets */}
                        {item.highlight?.content && (
                          <div style={{
                            marginTop: '0.625rem',
                            paddingTop: '0.625rem',
                            borderTop: '1px solid #f1f5f9',
                            fontSize: '0.8125rem',
                            color: '#475569',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            lineHeight: 1.6,
                          }}>
                            {item.highlight.content.slice(0, 2).map((snippet, si) => (
                              <p key={si} style={{ margin: 0 }}>
                                &hellip;<HighlightedText html={snippet} />&hellip;
                              </p>
                            ))}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Pagination */}
                {results.total_pages > 1 && (
                  <Pagination
                    currentPage={results.page}
                    totalPages={results.total_pages}
                    onPageChange={newPage => {
                      setPage(newPage);
                      updateURL({ page: newPage });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <RAGChat />
      {/* Responsive Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .filter-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}

// ============================================================
// Teilkomponenten
// ============================================================

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.25rem 0.625rem',
      background: '#dbeafe',
      color: '#1e40af',
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      border: '1px solid #bfdbfe',
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#3b82f6', lineHeight: 1, padding: 0, fontSize: '1rem',
          display: 'flex', alignItems: 'center',
          fontFamily: 'inherit',
        }}
        aria-label={`${label} entfernen`}
      >
        &times;
      </button>
    </span>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (_page: number) => void;
}) {
  const pages: (number | '...')[] = [];
  const delta = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav aria-label="Seitennavigation" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={paginationBtnStyle(false, currentPage === 1)}
        aria-label="Vorherige Seite"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ padding: '0.5rem 0.375rem', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            style={paginationBtnStyle(p === currentPage, false)}
            aria-label={`Seite ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={paginationBtnStyle(false, currentPage === totalPages)}
        aria-label="Naechste Seite"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </nav>
  );
}

// ============================================================
// Styles
// ============================================================

const filterLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#64748b',
  marginBottom: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const facetBtnStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  padding: '0.5rem 0.625rem',
  border: '1px solid #e2e8f0',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  fontSize: '0.8125rem',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
  textAlign: 'left',
};

const facetCountStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  background: 'rgba(0,0,0,0.06)',
  padding: '0.1rem 0.4rem',
  borderRadius: '9999px',
  flexShrink: 0,
};

function paginationBtnStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    minWidth: '36px',
    height: '36px',
    padding: '0 0.5rem',
    border: '1px solid',
    borderColor: active ? '#2563eb' : '#e2e8f0',
    borderRadius: '0.375rem',
    background: active ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : disabled ? '#f8fafc' : '#fff',
    color: active ? '#fff' : disabled ? '#cbd5e1' : '#374151',
    fontWeight: active ? 700 : 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  };
}


export default function SuchePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          margin: '0 auto 1rem',
        }} aria-hidden="true" />
        <p>Laden...</p>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    }>
      <SuchePageInner />
    </Suspense>
  );
}
