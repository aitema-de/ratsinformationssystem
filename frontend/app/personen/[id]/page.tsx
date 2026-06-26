'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PersonDetail {
  id: string;
  name: string;
  familyName: string;
  givenName: string;
  formOfAddress?: string;
  title?: string[];
  email?: string[];
  phone?: string[];
  status?: string[];
  life?: string;
  lifeSource?: string;
  membership?: Membership[];
}

interface Membership {
  id: string;
  organization: string;
  organizationName?: string;
  organizationType?: string;
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
}

interface Paper {
  id: string;
  name: string;
  reference: string;
  date: string;
  paper_type: string;
}

export default function PersonDetailPage() {
  const params = useParams();
  const personId = params.id as string;

  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personId) return;

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/persons/${personId}`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/persons/${personId}/meetings`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/persons/${personId}/papers`).then(r => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([personData, meetingsData, papersData]) => {
        setPerson(personData);
        setMeetings(meetingsData.data || []);
        setPapers(papersData.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [personId]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));

  const formatDateTime = (iso: string) =>
    new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
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
    return <p role="status" style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>Laden...</p>;
  }

  if (!person) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Person nicht gefunden</h1>
        <Link href="/personen" style={{ color: '#1d4ed8' }}>Zurueck zur Uebersicht</Link>
      </div>
    );
  }

  const activeMemberships = (person.membership || []).filter(m => !m.endDate);
  const pastMemberships = (person.membership || []).filter(m => !!m.endDate);

  const fraktion = activeMemberships.find(m => m.organizationType === 'Fraktion');

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ol style={{ listStyle: 'none', display: 'flex', gap: '0.5rem', color: '#6b7280' }}>
          <li><Link href="/" style={{ color: '#1d4ed8', textDecoration: 'none' }}>Startseite</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/personen" style={{ color: '#1d4ed8', textDecoration: 'none' }}>Personen</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" style={{ color: '#374151' }}>{person.name}</li>
        </ol>
      </nav>

      {/* Profil-Header */}
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}>
        {/* Avatar */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#1e3a5f',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 700,
          flexShrink: 0,
        }} aria-hidden="true">
          {(person.givenName?.[0] || '').toUpperCase()}
          {(person.familyName?.[0] || '').toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
            {person.formOfAddress ? `${person.formOfAddress} ` : ''}
            {person.title?.length ? person.title.join(' ') + ' ' : ''}
            {person.name}
          </h1>

          {fraktion && (
            <p style={{ color: '#4b5563', fontSize: '0.9375rem', margin: '0 0 0.5rem' }}>
              <a href={`/gremien/${fraktion.organization}`} style={{ color: '#1d4ed8', textDecoration: 'none' }}>
                {fraktion.organizationName || 'Fraktion'}
              </a>
              {fraktion.role ? ` - ${fraktion.role}` : ''}
            </p>
          )}

          {person.status?.length ? (
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>
              {person.status.join(', ')}
            </p>
          ) : null}

          {/* Kontakt */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            {person.email?.map((email, i) => (
              <a key={i} href={`mailto:${email}`} style={{ color: '#1d4ed8', textDecoration: 'none' }}>
                {email}
              </a>
            ))}
            {person.phone?.map((tel, i) => (
              <a key={i} href={`tel:${tel}`} style={{ color: '#1d4ed8', textDecoration: 'none' }}>
                {tel}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Gremien-Mitgliedschaften */}
      <section aria-labelledby="memberships-heading" style={{ marginBottom: '1.5rem' }}>
        <h2 id="memberships-heading" style={sectionHeading}>Gremien-Mitgliedschaften</h2>
        {activeMemberships.length === 0 && pastMemberships.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem' }}>Keine Mitgliedschaften vorhanden.</p>
        ) : (
          <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            overflow: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }} aria-label="Gremien-Mitgliedschaften">
              <thead>
                <tr>
                  <th scope="col" style={thStyle}>Gremium</th>
                  <th scope="col" style={thStyle}>Rolle</th>
                  <th scope="col" style={thStyle}>Stimmrecht</th>
                  <th scope="col" style={thStyle}>Seit</th>
                  <th scope="col" style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeMemberships.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>
                      <a href={`/gremien/${m.organization}`} style={{ color: '#1d4ed8', textDecoration: 'none' }}>
                        {m.organizationName || m.organization}
                      </a>
                    </td>
                    <td style={tdStyle}>{m.role || 'Mitglied'}</td>
                    <td style={tdStyle}>{m.votingRight !== false ? 'Ja' : 'Nein'}</td>
                    <td style={tdStyle}>{m.startDate ? formatDate(m.startDate) : '-'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: '#166534',
                        background: '#dcfce7',
                      }}>aktiv</span>
                    </td>
                  </tr>
                ))}
                {pastMemberships.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: 0.7 }}>
                    <td style={tdStyle}>
                      <a href={`/gremien/${m.organization}`} style={{ color: '#1d4ed8', textDecoration: 'none' }}>
                        {m.organizationName || m.organization}
                      </a>
                    </td>
                    <td style={tdStyle}>{m.role || 'Mitglied'}</td>
                    <td style={tdStyle}>{m.votingRight !== false ? 'Ja' : 'Nein'}</td>
                    <td style={tdStyle}>{m.startDate ? formatDate(m.startDate) : '-'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        color: '#6b7280',
                        background: '#f3f4f6',
                      }}>bis {m.endDate ? formatDate(m.endDate) : ''}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Letzte Sitzungsteilnahmen */}
      <section aria-labelledby="meetings-heading" style={{ marginBottom: '1.5rem' }}>
        <h2 id="meetings-heading" style={sectionHeading}>Letzte Sitzungsteilnahmen</h2>
        {meetings.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem' }}>Keine Sitzungsteilnahmen vorhanden.</p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {meetings.map(m => (
              <li key={m.id}>
                <a
                  href={`/sitzungen/${m.id}`}
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
                    borderLeft: `3px solid ${stateColors[m.meeting_state] || '#6b7280'}`,
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{m.name}</span>
                  <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                    {formatDateTime(m.start)} &ndash; {stateLabels[m.meeting_state] || m.meeting_state}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Eingereichte Vorlagen */}
      <section aria-labelledby="papers-heading">
        <h2 id="papers-heading" style={sectionHeading}>Eingereichte Vorlagen &amp; Antraege</h2>
        {papers.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem' }}>Keine Vorlagen vorhanden.</p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {papers.map(p => (
              <li key={p.id}>
                <a
                  href={`/vorlagen/${p.id}`}
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
                    <span style={{ color: '#6b7280', marginLeft: '0.75rem', fontSize: '0.8125rem' }}>
                      {p.reference}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>
                      {formatDate(p.date)}
                    </span>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.6875rem',
                      background: '#f3f4f6',
                      color: '#374151',
                    }}>
                      {p.paper_type}
                    </span>
                  </div>
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
