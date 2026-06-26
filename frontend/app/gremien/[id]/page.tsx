'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface OrganizationDetail {
  id: string;
  name: string;
  shortName?: string;
  organizationType?: string;
  classification?: string;
  startDate?: string;
  endDate?: string;
  website?: string;
  location?: {
    description?: string;
    streetAddress?: string;
    postalCode?: string;
    locality?: string;
  };
  legislativeTerm?: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
  };
}

interface MemberEntry {
  id: string;
  personId: string;
  personName: string;
  role?: string;
  votingRight?: boolean;
  startDate?: string;
  endDate?: string;
}

interface Meeting {
  id: string;
  name: string;
  start: string;
  meeting_state: string;
  cancelled: boolean;
}

interface Paper {
  id: string;
  name: string;
  reference: string;
  date: string;
  paper_type: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function GremiumDetailPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    Promise.all([
      fetch(API_BASE + '/api/organizations/' + orgId).then(r => r.json()),
      fetch(API_BASE + '/api/organizations/' + orgId + '/members')
        .then(r => r.json())
        .catch(() => ({ data: [] })),
      fetch(API_BASE + '/api/organizations/' + orgId + '/meetings?limit=10&view=upcoming')
        .then(r => r.json())
        .catch(() => ({ data: [] })),
      fetch(API_BASE + '/api/organizations/' + orgId + '/papers?limit=10')
        .then(r => r.json())
        .catch(() => ({ data: [] })),
    ])
      .then(([orgData, membersData, meetingsData, papersData]) => {
        setOrg(orgData);
        setMembers(membersData.data || []);
        setMeetings(meetingsData.data || []);
        setPapers(papersData.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orgId]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));

  const formatDateTime = (iso: string) =>
    new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));

  const stateLabels: Record<string, string> = {
    scheduled: 'Geplant',
    invited: 'Eingeladen',
    running: 'Laufend',
    completed: 'Abgeschlossen',
    cancelled: 'Abgesagt',
  };

  const stateColors: Record<string, string> = {
    scheduled: '#3b82f6',
    invited: '#8b5cf6',
    running: '#f59e0b',
    completed: '#16a34a',
    cancelled: '#dc2626',
  };

  if (loading) {
    return (
      <p role="status" style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>
        Laden...
      </p>
    );
  }

  if (!org) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Gremium nicht gefunden</h1>
        <Link href="/gremien" style={{ color: '#1d4ed8' }}>
          Zurueck zur Uebersicht
        </Link>
      </div>
    );
  }

  const activeMembers = members.filter(m => !m.endDate);
  const pastMembers = members.filter(m => !!m.endDate);

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ol style={{ listStyle: 'none', display: 'flex', gap: '0.5rem', color: '#6b7280' }}>
          <li>
            <Link href="/" style={{ color: '#1d4ed8', textDecoration: 'none' }}>
              Startseite
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/gremien" style={{ color: '#1d4ed8', textDecoration: 'none' }}>
              Gremien
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" style={{ color: '#374151' }}>
            {org.name}
          </li>
        </ol>
      </nav>

      {/* Gremien-Info Header */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              {org.name}
            </h1>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
              {org.organizationType && (
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: '#eff6ff',
                    color: '#1e3a5f',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {org.organizationType}
                </span>
              )}
              {org.classification && (
                <span style={{ color: '#6b7280' }}>{org.classification}</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#6b7280' }}>
            {org.legislativeTerm && (
              <p style={{ margin: '0 0 0.25rem' }}>
                Legislaturperiode: {org.legislativeTerm.name}
              </p>
            )}
            {org.startDate && (
              <p style={{ margin: 0 }}>
                Seit {formatDate(org.startDate)}
                {org.endDate ? ' bis ' + formatDate(org.endDate) : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mitglieder */}
      <section aria-labelledby="members-heading" style={{ marginBottom: '1.5rem' }}>
        <h2 id="members-heading" style={sectionHeading}>
          Mitglieder ({activeMembers.length} aktiv)
        </h2>
        {activeMembers.length === 0 && pastMembers.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem' }}>Keine Mitglieder vorhanden.</p>
        ) : (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              overflow: 'hidden',
            }}
          >
            <table
              style={{ width: '100%', borderCollapse: 'collapse' }}
              aria-label="Mitglieder des Gremiums"
            >
              <thead>
                <tr>
                  <th scope="col" style={thStyle}>Name</th>
                  <th scope="col" style={thStyle}>Rolle</th>
                  <th scope="col" style={thStyle}>Stimmrecht</th>
                  <th scope="col" style={thStyle}>Seit</th>
                </tr>
              </thead>
              <tbody>
                {activeMembers.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>
                      <a
                        href={'/personen/' + m.personId}
                        style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {m.personName}
                      </a>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background:
                            m.role === 'Vorsitz'
                              ? '#fef3c7'
                              : m.role === 'Stellvertretung'
                                ? '#e0e7ff'
                                : '#f3f4f6',
                          color:
                            m.role === 'Vorsitz'
                              ? '#92400e'
                              : m.role === 'Stellvertretung'
                                ? '#3730a3'
                                : '#374151',
                        }}
                      >
                        {m.role || 'Mitglied'}
                      </span>
                    </td>
                    <td style={tdStyle}>{m.votingRight !== false ? 'Ja' : 'Nein'}</td>
                    <td style={tdStyle}>{m.startDate ? formatDate(m.startDate) : '\u2013'}</td>
                  </tr>
                ))}
                {pastMembers.length > 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#6b7280',
                        background: '#f9fafb',
                      }}
                    >
                      Ehemalige Mitglieder
                    </td>
                  </tr>
                )}
                {pastMembers.map(m => (
                  <tr
                    key={m.id}
                    style={{ borderBottom: '1px solid #f3f4f6', opacity: 0.6 }}
                  >
                    <td style={tdStyle}>
                      <a
                        href={'/personen/' + m.personId}
                        style={{ color: '#1d4ed8', textDecoration: 'none' }}
                      >
                        {m.personName}
                      </a>
                    </td>
                    <td style={tdStyle}>{m.role || 'Mitglied'}</td>
                    <td style={tdStyle}>{m.votingRight !== false ? 'Ja' : 'Nein'}</td>
                    <td style={tdStyle}>
                      {m.startDate ? formatDate(m.startDate) : ''}
                      {' \u2013 '}
                      {m.endDate ? formatDate(m.endDate) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Kommende Sitzungen */}
      <section aria-labelledby="meetings-heading" style={{ marginBottom: '1.5rem' }}>
        <h2 id="meetings-heading" style={sectionHeading}>
          Kommende Sitzungen
        </h2>
        {meetings.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem' }}>
            Keine kommenden Sitzungen geplant.
          </p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {meetings.map(m => (
              <li key={m.id}>
                <a
                  href={'/sitzungen/' + m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    fontSize: '0.875rem',
                    borderLeft: '4px solid ' + (stateColors[m.meeting_state] || '#6b7280'),
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    <br />
                    <time style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                      {formatDateTime(m.start)}
                    </time>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: stateColors[m.meeting_state] || '#6b7280',
                    }}
                    aria-label={'Status: ' + (stateLabels[m.meeting_state] || m.meeting_state)}
                  >
                    {stateLabels[m.meeting_state] || m.meeting_state}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Zugeordnete Vorlagen */}
      <section aria-labelledby="papers-heading">
        <h2 id="papers-heading" style={sectionHeading}>
          Zugeordnete Vorlagen
        </h2>
        {papers.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem' }}>Keine Vorlagen vorhanden.</p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {papers.map(p => (
              <li key={p.id}>
                <a
                  href={'/vorlagen/' + p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    padding: '0.75rem 1rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    fontSize: '0.875rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span
                      style={{
                        color: '#6b7280',
                        marginLeft: '0.75rem',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {p.reference}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.6875rem',
                      background: '#f3f4f6',
                      color: '#374151',
                    }}
                  >
                    {p.paper_type}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: '0.75rem',
  paddingBottom: '0.5rem',
  borderBottom: '2px solid #e5e7eb',
};

const thStyle: React.CSSProperties = {
  background: '#f9fafb',
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: '#374151',
  borderBottom: '2px solid #e5e7eb',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
};
