export default function LoadingScreen({ fadeOut }) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-main transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center gap-8">
        {/* Glow behind logo */}
        <div className="absolute inset-0 w-48 h-48 rounded-full bg-accent/10 blur-3xl -z-10 mx-auto" />

        {/* Logo */}
        <div className="flex items-center gap-3 animate-fade-in">
          <PfauIcon className="w-12 h-12 text-accent" />
          <div>
            <span className="font-mono text-3xl font-bold text-heading tracking-wide">Pfau</span>
            <span className="font-mono text-3xl font-bold text-accent">MC</span>
          </div>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-sky-400 rounded-full loading-bar" />
        </div>

        <p className="text-text-light text-sm font-mono tracking-widest uppercase opacity-60">
          Загрузка...
        </p>
      </div>

      <style>{`
        .loading-bar {
          animation: loadBar 1.8s ease-in-out infinite;
        }
        @keyframes loadBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-bar { animation: none; width: 60%; }
        }
      `}</style>
    </div>
  )
}

export function PfauIcon({ className = '' }) {
  return (
    <img
      src="/assets/logo.png"
      alt="PfauMC logo"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
