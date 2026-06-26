'use client';

import { useEffect, useState, useMemo } from 'react';
import { SubscribeButton } from '@/components/SubscribeButton';

interface Organization {
  id: string;
  name: string;
  shortName?: string;
  organizationType?: string;
  classification?: string;
  startDate?: string;
  endDate?: string;
  memberCount?: number;
  nextMeeting?: {
    id: string;
    name: string;
    start: string;
  };
  subOrganizationOf?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const GREMIEN_TYPES = [
  'Rat',
  'Ausschuss',
  'Fraktion',
  'Beirat',
  'Kommission',
  'Arbeitsgruppe',
  'Sonstige',
];

const TYPE_COLORS: Record<string, string> = {
  Rat: '#1e3a5f',
  Ausschuss: '#1d4ed8',
  Fraktion: '#7c3aed',
  Beirat: '#059669',
  Kommission: '#d97706',
  Arbeitsgruppe: '#6b7280',
  Sonstige: '#9ca3af',
};

export default function GremienPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ page: '1' });
    if (filterType) params.set('type', filterType);

    fetch(API_BASE + '/api/organizations?' + params.toString())
      .then(r => r.json())
      .then(data => {
        setOrganizations(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterType]);

  const grouped = useMemo(() => {
    const groups: Record<string, Organization[]> = {};
    GREMIEN_TYPES.forEach(t => {
      groups[t] = [];
    });

    organizations.forEach(org => {
      const type = org.organizationType || 'Sonstige';
      if (!groups[type]) groups[type] = [];
      groups[type].push(org);
    });

    return groups;
  }, [organizations]);

  const filteredGroups = useMemo(() => {
    if (!filterType) return grouped;
    const result: Record<string, Organization[]> = {};
    result[filterType] = grouped[filterType] || [];
    return result;
  }, [grouped, filterType]);

  const formatNextMeeting = (iso: string) =>
    new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Gremien</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Uebersicht aller kommunalen Gremien, Ausschuesse und Fraktionen.
      </p>

      {/* Filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="filter-gremientyp"
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.25rem',
          }}
        >
          Gremientyp filtern
        </label>
        <select
          id="filter-gremientyp"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            minHeight: '44px',
            background: '#fff',
            minWidth: '200px',
          }}
        >
          <option value="">Alle Typen</option>
          {GREMIEN_TYPES.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Screenreader live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {!loading && (organizations.length + ' Gremien gefunden')}
      </div>

      {loading ? (
        <p role="status" style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>
          Laden...
        </p>
      ) : organizations.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>
          Keine Gremien gefunden.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(filteredGroups)
            .filter(([, orgs]) => orgs.length > 0)
            .map(([type, orgs]) => {
              const color = TYPE_COLORS[type] || '#6b7280';
              return (
                <section key={type} aria-labelledby={'type-' + type}>
                  <h2
                    id={'type-' + type}
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      marginBottom: '0.75rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '3px solid ' + color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {type}
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 400,
                        color: '#6b7280',
                        marginLeft: '0.25rem',
                      }}
                    >
                      ({orgs.length})
                    </span>
                  </h2>

                  <ul
                    style={{
                      listStyle: 'none',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    {orgs.map(org => (
                      <li key={org.id}>
                        <a
                          href={'/gremien/' + org.id}
                          style={{
                            display: 'block',
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            padding: '1rem 1.25rem',
                            textDecoration: 'none',
                            color: 'inherit',
                            borderLeft: '4px solid ' + color,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: '0.9375rem',
                              fontWeight: 600,
                              margin: '0 0 0.5rem',
                            }}
                          >
                            {org.name}
                          </h3>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.8125rem',
                              color: '#6b7280',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                            }}
                          >
                            {org.memberCount !== null && org.memberCount !== undefined && (
                              <span>{org.memberCount} Mitglieder</span>
                            )}
                            {org.nextMeeting && (
                              <span>
                                Naechste Sitzung: {formatNextMeeting(org.nextMeeting.start)}
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: '0.75rem' }}>
                            <SubscribeButton
                              targetId={org.id}
                              targetLabel={org.name}
                              type="organization"
                            />
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}
