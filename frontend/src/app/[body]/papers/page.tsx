/**
 * aitema|RIS - Vorlagensuche Page
 * Search and browse papers (Vorlagen/Drucksachen) for a body.
 */
"use client";

import { useState, useEffect } from "react";
import { apiClient, type OParlPaper } from "@/lib/api";

interface PapersPageProps {
  params: { body: string };
}

const PAPER_TYPES = [
  "Beschlussvorlage",
  "Antrag",
  "Anfrage",
  "Mitteilung",
  "Bericht",
  "Stellungnahme",
];

const TYPE_STYLES: Record<string, { badge: string; dot: string }> = {
  Beschlussvorlage: { badge: "bg-blue-50 text-blue-700 border-blue-100",   dot: "bg-blue-500" },
  Antrag:           { badge: "bg-violet-50 text-violet-700 border-violet-100", dot: "bg-violet-500" },
  Anfrage:          { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  Mitteilung:       { badge: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  Bericht:          { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  Stellungnahme:    { badge: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-500" },
};

const STATUS_STYLES: Record<string, string> = {
  offen:        "bg-amber-50 text-amber-700 border-amber-100",
  beschlossen:  "bg-emerald-50 text-emerald-700 border-emerald-100",
  abgelehnt:    "bg-red-50 text-red-700 border-red-100",
  zurueckgezogen: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function PapersPage({ params }: PapersPageProps) {
  const [papers, setPapers] = useState<OParlPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadPapers() {
      setLoading(true);
      try {
        const data = await apiClient.getPapers(params.body, {
          page,
          paperType: selectedType || undefined,
          q: searchQuery || undefined,
        });
        setPapers(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Failed to load papers:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPapers();
  }, [params.body, page, selectedType, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Page Header */}
      <div className="bg-[#0f172a] text-white px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Vorlagensuche
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Vorlagen</h1>
          <p className="mt-1 text-slate-400 text-sm">
            Beschlussvorlagen, Antraege, Anfragen und weitere Dokumente
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-card p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <label htmlFor="paper-search" className="sr-only">Vorlagen durchsuchen</label>
              <input
                id="paper-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titel oder Vorlagennummer eingeben..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Type Filter Pills */}
            <div className="flex flex-wrap gap-2 sm:gap-1.5">
              <button
                type="button"
                onClick={() => { setSelectedType(""); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors duration-150 ${
                  selectedType === ""
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                Alle Typen
              </button>
              {PAPER_TYPES.map((type) => {
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setSelectedType(type); setPage(1); }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors duration-150 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 flex items-center gap-2 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Suchen
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div role="status" aria-label="Vorlagen werden geladen" className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-slate-100 rounded animate-pulse w-1/4" />
                </div>
                <div className="w-24 h-6 bg-slate-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>

        ) : papers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-card p-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 font-medium">Keine Vorlagen gefunden.</p>
            <p className="text-slate-400 text-sm mt-1">Bitte passen Sie Ihre Suche oder den Filter an.</p>
          </div>

        ) : (
          <div className="space-y-3">
            {papers.map((paper) => {
              const typeStyle = paper.paperType ? TYPE_STYLES[paper.paperType] : null;
              const paperStatus = (paper as any).status as string | undefined;
              const statusStyle = paperStatus ? STATUS_STYLES[paperStatus.toLowerCase()] : null;
              return (
                <article
                  key={paper.id}
                  className="bg-white rounded-xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-200"
                >
                  <a
                    href={`/${params.body}/papers/${encodeURIComponent(paper.id)}`}
                    className="flex items-start gap-4 p-5 group"
                  >
                    {/* Doc Icon */}
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mt-0.5 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-slate-800 group-hover:text-blue-700 transition-colors leading-snug">
                        {paper.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                        {paper.reference && (
                          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {paper.reference}
                          </span>
                        )}
                        {paper.date && (
                          <time
                            dateTime={paper.date}
                            className="text-xs text-slate-400 flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(paper.date).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </time>
                        )}
                      </div>
                    </div>

                    {/* Badges + Arrow */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {paper.paperType && typeStyle && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeStyle.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${typeStyle.dot}`} />
                          {paper.paperType}
                        </span>
                      )}
                      {paperStatus && statusStyle && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle}`}>
                          {paperStatus}
                        </span>
                      )}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-300 group-hover:text-blue-400 transition-colors mt-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                </article>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-between pt-4"
                aria-label="Seitennavigation"
              >
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Zurueck
                </button>
                <span className="text-sm text-slate-500 font-medium">
                  Seite {page} von {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Weiter
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
