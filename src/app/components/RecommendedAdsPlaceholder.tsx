import React, { useState } from "react";

const AFFINITY_OPTIONS = [
  "All affinities",
  "Health & Wellness",
  "Luxury / Premium",
  "Sports Enthusiasts",
  "Gaming / Gen-Z",
  "Family-friendly",
];

interface RecommendedAdsPlaceholderProps {
  segmentCount: number;
}

export function RecommendedAdsPlaceholder({
  segmentCount,
}: RecommendedAdsPlaceholderProps) {
  const [selectedAffinity, setSelectedAffinity] = useState("All affinities");

  return (
    <section className="max-w-4xl space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[1.5px] text-text-tertiary">
          Recommended ads (placeholder)
        </h2>
        <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
          <span className="hidden sm:inline">Filter by affinity</span>
          <select
            value={selectedAffinity}
            onChange={(e) => setSelectedAffinity(e.target.value)}
            className="border border-border-light rounded-lg px-2 py-1.5 bg-white text-[11px] text-text-primary focus:outline-none"
          >
            {AFFINITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border-light bg-gray-50/80 px-4 py-3 text-[11px] text-text-secondary">
        <p className="mb-1">
          This panel will eventually show concrete ad matches for each segment
          based on affinity, brand safety, and context.
        </p>
        <p>
          For now, you can use the affinity dropdown above to explore how
          different audience cohorts might be matched across the{" "}
          <strong>{segmentCount}</strong> segments in the timeline.
        </p>
      </div>
    </section>
  );
}

