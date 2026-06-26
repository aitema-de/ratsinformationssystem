import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "aitema|RIS - Ratsinformationssystem",
  description:
    "OParl-First Ratsinformationssystem fuer transparente kommunale Politik",
  openGraph: {
    title: "aitema|RIS",
    description: "Ratsinformationssystem",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        {/* Skip Navigation Link for Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-aitema-accent focus:text-white focus:rounded-br-lg"
        >
          Zum Hauptinhalt springen
        </a>

        {/* Header */}
        <header className="bg-[#0f172a] sticky top-0 z-50 shadow-lg border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <Link
                href="/"
                className="flex items-center space-x-0.5 group"
                aria-label="aitema RIS Startseite"
              >
                <span className="text-xl font-bold text-white tracking-tight group-hover:text-slate-200 transition-colors">
                  aitema
                </span>
                <span className="text-xl font-thin text-blue-400 mx-0.5">|</span>
                <span className="text-xl font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                  RIS
                </span>
              </Link>

              {/* Main Navigation — Desktop */}
              <nav aria-label="Hauptnavigation" className="hidden md:flex items-center space-x-1">
                <a
                  href="/search"
                  className="aitema-nav-link flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Suche
                </a>
                <a
                  href="/default/meetings"
                  className="aitema-nav-link flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Sitzungen
                </a>
                <a
                  href="/default/papers"
                  className="aitema-nav-link flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Vorlagen
                </a>
                <a
                  href="/default/organizations"
                  className="aitema-nav-link flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Gremien
                </a>
              </nav>

              {/* Search Quick-Access — Desktop */}
              <div className="hidden md:flex items-center">
                <form action="/search" method="get" role="search">
                  <label htmlFor="nav-search" className="sr-only">
                    Schnellsuche
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      id="nav-search"
                      type="search"
                      name="q"
                      placeholder="Schnellsuche..."
                      className="w-44 pl-9 pr-3 py-1.5 text-sm bg-white/10 text-white placeholder-slate-400 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all duration-150"
                    />
                  </div>
                </form>
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                className="md:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Navigation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden border-t border-white/10 bg-[#1e3a5f]/90 px-4 py-3 space-y-1 hidden" id="mobile-nav" aria-hidden="true">
            <a href="/search" className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-white/10 hover:text-white">Suche</a>
            <a href="/default/meetings" className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-white/10 hover:text-white">Sitzungen</a>
            <a href="/default/papers" className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-white/10 hover:text-white">Vorlagen</a>
            <a href="/default/organizations" className="block px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-white/10 hover:text-white">Gremien</a>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-[#0f172a] text-slate-400 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

              {/* Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center space-x-0.5 mb-3">
                  <span className="text-lg font-bold text-white">aitema</span>
                  <span className="text-lg font-thin text-blue-400 mx-0.5">|</span>
                  <span className="text-lg font-semibold text-blue-400">RIS</span>
                </div>
                <p className="text-sm leading-relaxed">
                  OParl-konformes Ratsinformationssystem fuer transparente kommunale Politik.
                </p>
              </div>

              {/* Navigation */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Navigation</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="/default/meetings" className="hover:text-white transition-colors">Sitzungen</a></li>
                  <li><a href="/default/papers" className="hover:text-white transition-colors">Vorlagen</a></li>
                  <li><a href="/default/organizations" className="hover:text-white transition-colors">Gremien</a></li>
                  <li><a href="/search" className="hover:text-white transition-colors">Suche</a></li>
                </ul>
              </div>

              {/* Schnittstellen */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Schnittstellen</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/api/v1/oparl/system" className="hover:text-white transition-colors flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      OParl API
                    </a>
                  </li>
                  <li><a href="/docs" className="hover:text-white transition-colors">API-Dokumentation</a></li>
                </ul>
              </div>

              {/* Rechtliches */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Rechtliches</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="/impressum" className="hover:text-white transition-colors">Impressum</a></li>
                  <li><a href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</a></li>
                  <li><a href="/barrierefreiheit" className="hover:text-white transition-colors">Barrierefreiheit</a></li>
                </ul>
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} aitema GmbH &middot; Lizenz: EUPL-1.2
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/60 text-blue-300">
                  OParl 1.1
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-300">
                  Open Source
                </span>
              </div>
            </div>

          </div>
        </footer>

      </body>
    </html>
  );
}
