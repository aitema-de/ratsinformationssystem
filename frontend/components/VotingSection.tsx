'use client';

import { useEffect, useRef, useState } from 'react';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
export interface IndividualVote {
  member_name: string;
  vote: 'yes' | 'no' | 'abstain';
  faction?: string;
}

export interface VotingResult {
  agenda_item_id: string;
  agenda_item_title: string;
  yes_votes: number;
  no_votes: number;
  abstentions: number;
  result: 'approved' | 'rejected' | 'deferred';
  is_public: boolean;
  individual_votes?: IndividualVote[];
}

export interface VotingData {
  meeting_id: string;
  voting_results: VotingResult[];
}

// -----------------------------------------------------------------------
// Status-Badge
// -----------------------------------------------------------------------
function StatusBadge({ result }: { result: VotingResult['result'] }) {
  const config = {
    approved: {
      label: 'Angenommen',
      className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      icon: '✓',
    },
    rejected: {
      label: 'Abgelehnt',
      className: 'bg-red-100 text-red-800 border border-red-200',
      icon: '✗',
    },
    deferred: {
      label: 'Zurückgestellt',
      className: 'bg-amber-100 text-amber-800 border border-amber-200',
      icon: '⏸',
    },
  }[result] ?? { label: result, className: 'bg-slate-100 text-slate-700 border border-slate-200', icon: '?' };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}
      aria-label={`Abstimmungsergebnis: ${config.label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}

// -----------------------------------------------------------------------
// Doughnut-Chart (Chart.js via CDN – kein npm)
// -----------------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    Chart: any;
  }
}

function VotingDonutChart({
  yes,
  no,
  abstentions,
  label,
}: {
  yes: number;
  no: number;
  abstentions: number;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const total = yes + no + abstentions;
    if (total === 0) return;

    const buildChart = () => {
      if (!window.Chart) return false;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return false;

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Ja', 'Nein', 'Enthaltung'],
          datasets: [
            {
              data: [yes, no, abstentions],
              backgroundColor: ['#059669', '#dc2626', '#d97706'],
              borderColor: ['#ffffff', '#ffffff', '#ffffff'],
              borderWidth: 3,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: { label: string; raw: number }) =>
                  ` ${ctx.label}: ${ctx.raw} (${Math.round((ctx.raw / total) * 100)} %)`,
              },
            },
          },
          animation: { animateRotate: true, duration: 700 },
        },
      });
      return true;
    };

    if (buildChart()) return;

    // Chart.js noch nicht geladen → warten
    const interval = setInterval(() => {
      if (buildChart()) clearInterval(interval);
    }, 100);

    return () => {
      clearInterval(interval);
      chartRef.current?.destroy();
    };
  }, [yes, no, abstentions]);

  const total = yes + no + abstentions;

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: 130, height: 130 }}
      role="img"
      aria-label={`Abstimmungsdiagramm für ${label}: ${yes} Ja, ${no} Nein, ${abstentions} Enthaltungen`}
    >
      <canvas ref={canvasRef} width={130} height={130} />
      {/* Zentrierte Gesamtzahl */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-xl font-bold text-slate-800">{total}</span>
        <span className="text-xs text-slate-500">Stimmen</span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Stimmen-Legende
// -----------------------------------------------------------------------
function VoteLegend({ yes, no, abstentions }: { yes: number; no: number; abstentions: number }) {
  const total = yes + no + abstentions;

  const items = [
    { label: 'Ja', count: yes, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
    { label: 'Nein', count: no, color: 'bg-red-500', textColor: 'text-red-700' },
    { label: 'Enthaltung', count: abstentions, color: 'bg-amber-500', textColor: 'text-amber-700' },
  ];

  return (
    <dl className="flex flex-col gap-2 min-w-[140px]">
      {items.map(({ label, count, color, textColor }) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} aria-hidden="true" />
          <dt className="text-sm text-slate-600 w-20">{label}</dt>
          <dd className={`text-sm font-bold ${textColor}`}>
            {count}
            {total > 0 && (
              <span className="text-xs font-normal text-slate-400 ml-1">
                ({Math.round((count / total) * 100)} %)
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// -----------------------------------------------------------------------
// Avatar-Initialen
// -----------------------------------------------------------------------
function MemberAvatar({ name, vote }: { name: string; vote: IndividualVote['vote'] }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');

  const bg = vote === 'yes'
    ? 'bg-emerald-100 text-emerald-700 ring-emerald-300'
    : vote === 'no'
    ? 'bg-red-100 text-red-700 ring-red-300'
    : 'bg-amber-100 text-amber-700 ring-amber-300';

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold ring-1 ${bg}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

// -----------------------------------------------------------------------
// Namentliche Abstimmungs-Tabelle
// -----------------------------------------------------------------------
function IndividualVoteTable({ votes }: { votes: IndividualVote[] }) {
  const voteLabels: Record<IndividualVote['vote'], string> = {
    yes: 'Ja',
    no: 'Nein',
    abstain: 'Enthaltung',
  };

  const voteClasses: Record<IndividualVote['vote'], string> = {
    yes: 'text-emerald-700 font-semibold',
    no: 'text-red-700 font-semibold',
    abstain: 'text-amber-700 font-semibold',
  };

  // Sortierung: ja → nein → enthaltung
  const order: Record<IndividualVote['vote'], number> = { yes: 0, no: 1, abstain: 2 };
  const sorted = [...votes].sort((a, b) => order[a.vote] - order[b.vote]);

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm border-collapse" aria-label="Namentliche Abstimmung">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Ratsmitglied
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Fraktion
            </th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Votum
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((v, i) => (
            <tr
              key={`${v.member_name}-${i}`}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
            >
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <MemberAvatar name={v.member_name} vote={v.vote} />
                  <span className="text-slate-800">{v.member_name}</span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-slate-500 text-xs">{v.faction ?? '—'}</td>
              <td className="px-4 py-2.5">
                <span className={voteClasses[v.vote]}>{voteLabels[v.vote]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// -----------------------------------------------------------------------
// Einzelner Tagesordnungspunkt mit Abstimmung
// -----------------------------------------------------------------------
function VotingCard({ item }: { item: VotingResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasIndividualVotes = item.is_public && item.individual_votes && item.individual_votes.length > 0;

  return (
    <article
      className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
      aria-label={`Abstimmung: ${item.agenda_item_title}`}
    >
      {/* Card-Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-800 leading-snug flex-1">
          {item.agenda_item_title}
        </h3>
        <StatusBadge result={item.result} />
      </div>

      {/* Chart + Legende */}
      <div className="px-5 py-5 flex items-center gap-6 flex-wrap">
        {(item.yes_votes + item.no_votes + item.abstentions) > 0 ? (
          <>
            <VotingDonutChart
              yes={item.yes_votes}
              no={item.no_votes}
              abstentions={item.abstentions}
              label={item.agenda_item_title}
            />
            <VoteLegend
              yes={item.yes_votes}
              no={item.no_votes}
              abstentions={item.abstentions}
            />
          </>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Keine Stimmzählung verfügbar (z. B. einstimmig oder nicht protokolliert).
          </p>
        )}

        {/* Nicht-öffentlich Hinweis */}
        {!item.is_public && (
          <div
            className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5"
            role="note"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Namentliche Abstimmung nicht öffentlich
          </div>
        )}
      </div>

      {/* Namentliche Abstimmung Toggle */}
      {hasIndividualVotes && (
        <div className="px-5 pb-4">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
            aria-expanded={expanded}
            aria-controls={`individual-votes-${item.agenda_item_id}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            {expanded
              ? 'Namentliche Abstimmung ausblenden'
              : `Namentliche Abstimmung anzeigen (${item.individual_votes!.length} Mitglieder)`}
          </button>

          {expanded && (
            <div id={`individual-votes-${item.agenda_item_id}`}>
              <IndividualVoteTable votes={item.individual_votes!} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// -----------------------------------------------------------------------
// Haupt-Komponente: VotingSection
// -----------------------------------------------------------------------
export default function VotingSection({ meetingId }: { meetingId: string }) {
  const [data, setData] = useState<VotingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId) return;

    fetch(`/api/meetings/${meetingId}/voting`)
      .then(r => {
        if (!r.ok) throw new Error('Abstimmungsdaten konnten nicht geladen werden.');
        return r.json();
      })
      .then((d: VotingData) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [meetingId]);

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Abstimmungsergebnisse werden geladen">
        {[1, 2].map(i => (
          <div key={i} className="bg-slate-100 rounded-lg h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700" role="alert">
        {error}
      </div>
    );
  }

  if (!data || data.voting_results.length === 0) {
    return (
      <p className="text-slate-400 text-sm italic px-1">
        Keine Abstimmungsergebnisse für diese Sitzung vorhanden.
      </p>
    );
  }

  const approved = data.voting_results.filter(r => r.result === 'approved').length;
  const rejected = data.voting_results.filter(r => r.result === 'rejected').length;
  const deferred = data.voting_results.filter(r => r.result === 'deferred').length;

  return (
    <div>
      {/* Zusammenfassung-Zeile */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span className="text-xs font-medium text-emerald-700">
            {approved} Angenommen
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-md px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-xs font-medium text-red-700">
            {rejected} Abgelehnt
          </span>
        </div>
        {deferred > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
            <span className="text-xs font-medium text-amber-700">
              {deferred} Zurückgestellt
            </span>
          </div>
        )}
      </div>

      {/* Abstimmungskarten */}
      <div className="flex flex-col gap-4">
        {data.voting_results.map(item => (
          <VotingCard key={item.agenda_item_id} item={item} />
        ))}
      </div>
    </div>
  );
}
