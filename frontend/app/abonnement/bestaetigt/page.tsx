import Link from 'next/link';

export default function AbonnementBestaetigt() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 max-w-md w-full text-center">
        <div className="text-6xl mb-6" aria-hidden="true">&#10003;</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Abonnement bestaetigt!
        </h1>
        <p className="text-slate-600 mb-8">
          Sie erhalten ab sofort E-Mail-Benachrichtigungen zu Ihrem gewaehlten Thema oder Gremium.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Zur Startseite
          </Link>
          <Link
            href="/gremien"
            className="inline-block text-slate-600 hover:text-slate-900 text-sm hover:underline"
          >
            Weitere Gremien abonnieren
          </Link>
        </div>
        <p className="text-xs text-slate-400 mt-8">
          aitema|RIS &middot; Ratsinformationssystem
        </p>
      </div>
    </main>
  );
}
