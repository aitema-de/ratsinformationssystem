'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// VotingSection dynamisch laden (kein SSR, da Chart.js Canvas braucht)
const VotingSection = dynamic(
  () => import('../../../components/VotingSection'),
  { ssr: false, loading: () => (
    <div className="space-y-3" aria-busy="true">
      <div className="bg-slate-100 rounded-lg h-32 animate-pulse" />
    </div>
  )}
);

interface MeetingDetail {
  id: string;
  name: string;
  start: string;
  end?: string;
  meeting_state: string;
  cancelled: boolean;
  organization?: {
    id: string;
    name: string;
  };
  location?: {
    description?: string;
    streetAddress?: string;
    postalCode?: string;
    locality?: string;
    room?: string;
  };
  invitation?: {
    id: string;
    accessUrl?: string;
    name?: string;
  };
  resultsProtocol?: {
    id: string;
    accessUrl?: string;
    name?: string;
  };
  verbatimProtocol?: {
    id: string;
    accessUrl?: string;
    name?: string;
  };
}

interface AgendaItem {
  id: string;
  number?: string;
  order?: number;
  name: string;
  public: boolean;
  result?: string;
  resolutionText?: string;
  consultation?: {
    paper?: {
      id: string;
      name: string;
      reference: string;
    };
  };
}

interface Attendee {
  id: string;
  personName: string;
  personId: string;
  status: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function SitzungDetailPage() {
  const params = useParams();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meetingId) return;

    Promise.all([
      fetch(API_BASE + '/api/meetings/' + meetingId).then(r => r.json()),
      fetch(API_BASE + '/api/meetings/' + meetingId + '/agenda')
        .then(r => r.json())
        .catch(() => ({ data: [] })),
      fetch(API_BASE + '/api/meetings/' + meetingId + '/attendees')
        .then(r => r.json())
        .catch(() => ({ data: [] })),
    ])
      .then(([meetingData, agendaData, attendeesData]) => {
        setMeeting(meetingData);
        const items = agendaData.data || [];
        items.sort((a: AgendaItem, b: AgendaItem) => (a.order || 0) - (b.order || 0));
        setAgendaItems(items);
        setAttendees(attendeesData.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [meetingId]);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));

  const formatTime = (iso: string) =>
    new Intl.DateTimeFormat('de-DE', {
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

  const attendeeStatusLabels: Record<string, string> = {
    present: 'Anwesend',
    absent: 'Abwesend',
    excused: 'Entschuldigt',
  };

  const attendeeStatusColors: Record<string, string> = {
    present: '#16a34a',
    absent: '#dc2626',
    excused: '#d97706',
  };

  if (loading) {
    return (
      <p role="status" style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>
        Laden...
      </p>
    );
  }

  if (!meeting) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sitzung nicht gefunden</h1>
        <Link href="/sitzungen" style={{ color: '#1d4ed8' }}>
          Zurueck zur Uebersicht
        </Link>
      </div>
    );
  }

  const locationParts: string[] = [];
  if (meeting.location?.room) locationParts.push(meeting.location.room);
  if (meeting.location?.description) locationParts.push(meeting.location.description);
  if (meeting.location?.streetAddress) locationParts.push(meeting.location.streetAddress);
  if (meeting.location?.postalCode || meeting.location?.locality) {
    locationParts.push(
      [meeting.location.postalCode, meeting.location.locality].filter(Boolean).join(' ')
    );
  }
  const locationStr = locationParts.join(', ');

  return (
    <div>
      {/* Chart.js via CDN einbinden */}
      <script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"
        async
      />

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
            <Link href="/sitzungen" style={{ color: '#1d4ed8', textDecoration: 'none' }}>
              Sitzungen
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" style={{ color: '#374151' }}>
            {meeting.name}
          </li>
        </ol>
      </nav>

      {/* Sitzungs-Header */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          borderLeft: '5px solid ' + (stateColors[meeting.meeting_state] || '#6b7280'),
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              {meeting.name}
            </h1>
            {meeting.organization && (
              <p style={{ margin: '0 0 0.5rem' }}>
                <a
                  href={'/gremien/' + meeting.organization.id}
                  style={{ color: '#1d4ed8', textDecoration: 'none', fontSize: '0.9375rem' }}
                >
                  {meeting.organization.name}
                </a>
              </p>
            )}
            <div style={{ fontSize: '0.875rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <time>
                {formatDate(meeting.start)}, {formatTime(meeting.start)} Uhr
                {meeting.end ? ' \u2013 ' + formatTime(meeting.end) + ' Uhr' : ''}
              </time>
              {locationStr && <span>{locationStr}</span>}
            </div>
          </div>
          <span
            style={{
              padding: '0.375rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#fff',
              background: stateColors[meeting.meeting_state] || '#6b7280',
            }}
            aria-label={'Status: ' + (stateLabels[meeting.meeting_state] || meeting.meeting_state)}
          >
            {stateLabels[meeting.meeting_state] || meeting.meeting_state}
          </span>
        </div>

        {/* Dokumente & Links */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {meeting.invitation?.accessUrl && (
            <a
              href={meeting.invitation.accessUrl}
              style={docLinkStyle}
              target="_blank"
              rel="noopener noreferrer"
            >
              Einladung herunterladen
            </a>
          )}
          {meeting.resultsProtocol?.accessUrl && (
            <a
              href={meeting.resultsProtocol.accessUrl}
              style={docLinkStyle}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ergebnisprotokoll
            </a>
          )}
          {meeting.verbatimProtocol?.accessUrl && (
            <a
              href={meeting.verbatimProtocol.accessUrl}
              style={docLinkStyle}
              target="_blank"
              rel="noopener noreferrer"
            >
              Wortprotokoll
            </a>
          )}
          {/* R2: iCal Export */}
          <a
            href={`${API_BASE}/export/meeting/${meetingId}/sitzung.ics`}
            style={{
              ...docLinkStyle,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
            }}
            download={`sitzung-${meetingId}.ics`}
          >
            In Kalender exportieren (.ics)
          </a>
        </div>

        {/* Livestream Placeholder */}
        {meeting.meeting_state === 'running' && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#fef3c7',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: '#92400e',
              border: '1px solid #fcd34d',
            }}
            role="status"
          >
            Diese Sitzung findet gerade statt. Livestream-Funktion wird in einer
            zukuenftigen Version verfuegbar sein.
          </div>
        )}
      </div>

      {/* Tagesordnung */}
      <section aria-labelledby="agenda-heading" style={{ marginBottom: '1.5rem' }}>
        <h2 id="agenda-heading" style={sectionHeading}>
          Tagesordnung
        </h2>
        {agendaItems.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem' }}>
            Keine Tagesordnungspunkte vorhanden.
          </p>
        ) : (
          <ol
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              counterReset: 'agenda',
            }}
          >
            {agendaItems.map(item => (
              <li
                key={item.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '1rem 1.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  {/* TOP-Nummer */}
                  <span
                    style={{
                      flexShrink: 0,
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#1e3a5f',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                    }}
                    aria-label={'TOP ' + (item.number || String(item.order || ''))}
                  >
                    {item.number || item.order || ''}
                  </span>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
                      {item.name}
                    </h3>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                      {!item.public && (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>
                          Nichtoeffentlich
                        </span>
                      )}

                      {item.consultation?.paper && (
                        <a
                          href={'/vorlagen/' + item.consultation.paper.id}
                          style={{ color: '#1d4ed8', textDecoration: 'none' }}
                        >
                          {item.consultation.paper.reference}: {item.consultation.paper.name}
                        </a>
                      )}
                    </div>

                    {item.result && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f0fdf4',
                          borderRadius: '0.25rem',
                          fontSize: '0.8125rem',
                          color: '#166534',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        <strong>Ergebnis:</strong> {item.result}
                      </div>
                    )}

                    {item.resolutionText && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: '#f9fafb',
                          borderRadius: '0.25rem',
                          fontSize: '0.8125rem',
                          color: '#374151',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <strong>Beschluss:</strong> {item.resolutionText}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ── C2: Abstimmungsergebnisse ──────────────────────────────────── */}
      <section aria-labelledby="voting-heading" style={{ marginBottom: '1.5rem' }}>
        <h2 id="voting-heading" style={sectionHeading}>
          Abstimmungsergebnisse
        </h2>
        <VotingSection meetingId={meetingId} />
      </section>

      {/* Anwesenheitsliste */}
      <section aria-labelledby="attendees-heading" style={{ marginBottom: '1.5rem' }}>
        <h2 id="attendees-heading" style={sectionHeading}>
          Anwesenheit
        </h2>
        {attendees.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem' }}>
            Keine Anwesenheitsdaten vorhanden.
          </p>
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
              aria-label="Anwesenheitsliste"
            >
              <thead>
                <tr>
                  <th scope="col" style={thStyle}>Name</th>
                  <th scope="col" style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>
                      <a
                        href={'/personen/' + a.personId}
                        style={{ color: '#1d4ed8', textDecoration: 'none' }}
                      >
                        {a.personName}
                      </a>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: attendeeStatusColors[a.status] || '#6b7280',
                        }}
                      >
                        {attendeeStatusLabels[a.status] || a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

const docLinkStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '0.375rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#1e3a5f',
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  textDecoration: 'none',
  minHeight: '44px',
  display: 'inline-flex',
  alignItems: 'center',
};
