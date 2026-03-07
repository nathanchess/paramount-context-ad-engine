export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <header className="border-b border-border-light px-8 py-6">
        <h1 className="text-[32px] font-bold tracking-[-1.5px] text-text-primary">
          Overview
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Welcome to the Contextual Ad Engine dashboard.
        </p>
      </header>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="px-8 py-8 max-w-[1200px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat Card — Videos Indexed */}
          <div className="p-6 rounded-2xl bg-gray-50 hover-lift cursor-default">
            <p className="text-sm text-text-secondary mb-1">Videos Indexed</p>
            <p className="text-[28px] font-bold tracking-[-1px] text-text-primary">
              0
            </p>
          </div>

          {/* Stat Card — Ads Matched */}
          <div className="p-6 rounded-2xl bg-gray-50 hover-lift cursor-default">
            <p className="text-sm text-text-secondary mb-1">Ads Matched</p>
            <p className="text-[28px] font-bold tracking-[-1px] text-text-primary">
              0
            </p>
          </div>

          {/* Stat Card — API Calls */}
          <div className="p-6 rounded-2xl bg-gray-50 hover-lift cursor-default">
            <p className="text-sm text-text-secondary mb-1">API Calls Today</p>
            <p className="text-[28px] font-bold tracking-[-1px] text-text-primary">
              0
            </p>
          </div>
        </div>

        {/* ── Empty State ────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col items-center justify-center py-20 rounded-2xl border border-border-light">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <svg
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-text-tertiary"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.55217 4.79058V7.20942L7.26522 6L5.55217 4.79058ZM4.5 4.315C4.5 3.65679 5.23462 3.27103 5.76926 3.64849L8.15593 5.33348C8.61469 5.65737 8.61469 6.34263 8.15593 6.66652L5.76926 8.35151C5.23462 8.72897 4.5 8.34321 4.5 7.685V4.315Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.40039 0C10.3883 0.000211285 11.9998 1.61169 12 3.59961V8.40039C11.9998 10.3883 10.3883 11.9998 8.40039 12H3.59961C1.61169 11.9998 0.000211285 10.3883 0 8.40039V3.59961C0.000211156 1.61169 1.61169 0.000211157 3.59961 0H8.40039ZM3.59961 1C2.16398 1.00021 1.00021 2.16398 1 3.59961V8.40039C1.00021 9.83602 2.16398 10.9998 3.59961 11H8.40039C9.83602 10.9998 10.9998 9.83602 11 8.40039V3.59961C10.9998 2.16398 9.83602 1.00021 8.40039 1H3.59961Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-primary mb-1">
            No videos yet
          </p>
          <p className="text-sm text-text-tertiary">
            Upload videos in the Video Inventory tab to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
