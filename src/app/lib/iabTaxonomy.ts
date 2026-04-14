import type { IabTaxonomyItem } from "./types";

type IabCandidate = Partial<IabTaxonomyItem> & {
  tier1?: string;
  tier2?: string;
  code?: string;
  confidence?: number;
};

export type AllowedIabRow = {
  tier1: string;
  tier2: string;
  code: string;
  /** Extra phrases the model might output; snapped to this row */
  aliases?: string[];
};

/**
 * Closed set the model must choose from (prompt + post-validation).
 * Codes follow common IAB Content Taxonomy 2.0-style IDs used in ad tech demos.
 */
export const IAB_ALLOWED_ROWS: readonly AllowedIabRow[] = [
  {
    tier1: "Food & Beverage",
    tier2: "Alcoholic Beverages",
    code: "IAB8-5",
    aliases: ["alcohol", "liquor", "beverage alcohol", "bar drinks", "mixed drinks"],
  },
  {
    tier1: "Food & Beverage",
    tier2: "Wine",
    code: "IAB8-5",
    aliases: ["wine", "winery", "vino", "sommelier", "champagne", "sparkling wine"],
  },
  {
    tier1: "Food & Beverage",
    tier2: "Beer",
    code: "IAB8-5",
    aliases: ["beer", "brewery", "lager", "ale"],
  },
  {
    tier1: "Food & Beverage",
    tier2: "Distilled Spirits",
    code: "IAB8-5",
    aliases: ["whiskey", "whisky", "bourbon", "scotch", "vodka", "gin", "rum", "tequila", "cocktail", "mixology"],
  },
  {
    tier1: "Food & Beverage",
    tier2: "Snack Foods",
    code: "IAB8-9",
    aliases: ["snack", "snacks", "chips", "crisps", "packaged snacks"],
  },
  {
    tier1: "Food & Beverage",
    tier2: "Packaged Foods",
    code: "IAB8-0",
    aliases: ["cpg", "grocery", "packaged food", "pantry"],
  },
  {
    tier1: "Automotive",
    tier2: "Cars",
    code: "IAB2-1",
    aliases: ["car", "sedan", "coupe", "luxury auto", "sports car", "performance car"],
  },
  {
    tier1: "Automotive",
    tier2: "Trucks & SUVs",
    code: "IAB2-2",
    aliases: ["truck", "pickup", "suv", "off road", "4x4", "f 150", "f-150", "ram"],
  },
  {
    tier1: "Business",
    tier2: "Finance",
    code: "IAB3-13",
    aliases: ["financial services", "investing", "investment", "banking", "retirement", "wealth", "brokerage"],
  },
];

export type IabPolicyResult = {
  normalizedItems: IabTaxonomyItem[];
  effectiveTier1: string[];
  effectiveTier2: string[];
  effectiveCodes: string[];
  averageConfidence: number;
  fallbackApplied: boolean;
  fallbackReason: string | null;
};

const IAB_HIGH_CONFIDENCE = 0.75;
const IAB_MEDIUM_CONFIDENCE = 0.5;

const FALLBACK_BY_CATEGORY_KEY: Record<string, IabTaxonomyItem[]> = {
  alcohol_premium: [{ tier1: "Food & Beverage", tier2: "Distilled Spirits", code: "IAB8-5", confidence: 0.4 }],
  alcohol_beer: [{ tier1: "Food & Beverage", tier2: "Beer", code: "IAB8-5", confidence: 0.4 }],
  automotive_truck: [{ tier1: "Automotive", tier2: "Trucks & SUVs", code: "IAB2-2", confidence: 0.4 }],
  automotive_luxury: [{ tier1: "Automotive", tier2: "Cars", code: "IAB2-1", confidence: 0.4 }],
  cpg_snacks: [{ tier1: "Food & Beverage", tier2: "Snack Foods", code: "IAB8-9", confidence: 0.4 }],
  financial_services: [{ tier1: "Business", tier2: "Finance", code: "IAB3-13", confidence: 0.4 }],
};

function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** JSON block injected into the analyze prompt */
export function formatIabTableForPrompt(categoryKey: string, categoryLabel: string): string {
  const rowsJson = JSON.stringify(
    IAB_ALLOWED_ROWS.map(({ tier1, tier2, code }) => ({ tier1, tier2, code })),
    null,
    2
  );

  const verticalGuide: Record<string, string> = {
    alcohol_premium:
      "Premium spirits / wine / cocktails: prefer rows under Food & Beverage with tier2 Wine, Distilled Spirits, Beer, or Alcoholic Beverages when the creative shows alcohol.",
    alcohol_beer:
      "Beer and malt beverages: prefer tier2 Beer or Alcoholic Beverages when the creative clearly shows beer.",
    automotive_truck:
      "Truck and utility messaging: prefer Automotive / Trucks & SUVs when the creative shows pickups, towing, off-road, or work sites.",
    automotive_luxury:
      "Luxury or performance cars: prefer Automotive / Cars when the creative shows sedans, coupes, or performance driving.",
    cpg_snacks:
      "Packaged snacks and CPG: prefer Food & Beverage / Snack Foods or Packaged Foods when the creative shows chips, cookies, party snacks, or grocery CPG.",
    financial_services:
      "Banking, investing, retirement: prefer Business / Finance when the creative shows planning, portfolios, advisors, or wealth messaging.",
  };

  const guide =
    verticalGuide[categoryKey] ||
    "Pick the rows that honestly match the video creative; every iab object must still be copied exactly from the allowed list.";

  return `ALLOWED IAB TAXONOMY (closed set — each object in "iab" MUST be copied exactly from this list: same tier1, tier2, and code strings character-for-character. Do not invent codes, tiers, or rows outside this list.)
${rowsJson}

CURRENT AD INVENTORY VERTICAL: "${categoryLabel}" (internal key: ${categoryKey}).
${guide}
At least one of your highest-confidence "iab" entries should align with this vertical when the video clearly matches it; remaining entries can cover other true signals from the allowed list only.`;
}

function clampConfidence(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function collectAliasTargets(row: AllowedIabRow): string[] {
  const set = new Set<string>();
  set.add(norm(row.tier1));
  set.add(norm(row.tier2));
  for (const a of row.aliases || []) set.add(norm(a));
  return [...set];
}

function snapCandidateToAllowedRow(candidate: IabCandidate): IabTaxonomyItem | null {
  const tier1 = typeof candidate.tier1 === "string" ? candidate.tier1.trim() : "";
  const tier2 = typeof candidate.tier2 === "string" ? candidate.tier2.trim() : "";
  const code = typeof candidate.code === "string" ? candidate.code.trim().toUpperCase() : "";
  const confidence = clampConfidence(candidate.confidence);

  const n1 = norm(tier1);
  const n2 = norm(tier2);

  if (!tier1 && !tier2 && !code) return null;

  const exact = IAB_ALLOWED_ROWS.find((r) => norm(r.tier1) === n1 && norm(r.tier2) === n2);
  if (exact) {
    return { tier1: exact.tier1, tier2: exact.tier2, code: exact.code, confidence };
  }

  const byT2 = IAB_ALLOWED_ROWS.filter((r) => norm(r.tier2) === n2);
  if (byT2.length === 1) {
    const r = byT2[0];
    return { tier1: r.tier1, tier2: r.tier2, code: r.code, confidence };
  }

  if (code) {
    const byCode = IAB_ALLOWED_ROWS.filter((r) => r.code.toUpperCase() === code);
    if (byCode.length === 1) {
      const r = byCode[0];
      return { tier1: r.tier1, tier2: r.tier2, code: r.code, confidence };
    }
    if (byCode.length > 1 && n2) {
      const hit = byCode.find((r) => norm(r.tier2) === n2);
      if (hit) return { tier1: hit.tier1, tier2: hit.tier2, code: hit.code, confidence };
    }
  }

  const probe = n2 || n1;
  if (probe) {
    const matchedRows: AllowedIabRow[] = [];
    for (const row of IAB_ALLOWED_ROWS) {
      if (collectAliasTargets(row).includes(probe)) matchedRows.push(row);
    }
    if (matchedRows.length === 1) {
      const r = matchedRows[0];
      return { tier1: r.tier1, tier2: r.tier2, code: r.code, confidence };
    }
    if (matchedRows.length > 1) {
      const prefer = matchedRows.find((r) => norm(r.tier2) === n2) || matchedRows[0];
      return { tier1: prefer.tier1, tier2: prefer.tier2, code: prefer.code, confidence };
    }
  }

  return null;
}

function dedupeAndSort(items: IabTaxonomyItem[]): IabTaxonomyItem[] {
  const deduped = new Map<string, IabTaxonomyItem>();
  for (const item of items) {
    const key = `${item.code}|${item.tier1}|${item.tier2}`;
    const prior = deduped.get(key);
    if (!prior || item.confidence > prior.confidence) deduped.set(key, item);
  }
  return [...deduped.values()].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    const byTier1 = a.tier1.localeCompare(b.tier1);
    return byTier1 !== 0 ? byTier1 : a.tier2.localeCompare(b.tier2);
  });
}

export function normalizeIabWithPolicy(
  rawInput: unknown,
  categoryKey?: string
): IabPolicyResult {
  const rawItems = Array.isArray(rawInput) ? rawInput : [];
  const normalizedItems = dedupeAndSort(
    rawItems
      .map((item) => (item && typeof item === "object" ? snapCandidateToAllowedRow(item as IabCandidate) : null))
      .filter((item): item is IabTaxonomyItem => Boolean(item))
  );

  const high = normalizedItems.filter((item) => item.confidence >= IAB_HIGH_CONFIDENCE);
  const medium = normalizedItems.filter((item) => item.confidence >= IAB_MEDIUM_CONFIDENCE);

  let effectiveItems: IabTaxonomyItem[] = [];
  let fallbackApplied = false;
  let fallbackReason: string | null = null;

  if (high.length > 0) {
    effectiveItems = high;
  } else if (medium.length > 0) {
    effectiveItems = medium;
    fallbackReason = "No high-confidence Tier-2 classes; using Tier-1-only confidence band.";
  } else {
    const fallback = (categoryKey && FALLBACK_BY_CATEGORY_KEY[categoryKey]) || [];
    effectiveItems = fallback;
    fallbackApplied = true;
    fallbackReason = fallback.length
      ? "No medium-confidence model classes; applied deterministic category fallback."
      : "No medium-confidence model classes and no category fallback mapping found.";
  }

  const effectiveTier1 = [...new Set(effectiveItems.map((item) => item.tier1))];
  const effectiveTier2 = high.length > 0
    ? [...new Set(effectiveItems.map((item) => item.tier2))]
    : [];
  const effectiveCodes = high.length > 0
    ? [...new Set(effectiveItems.map((item) => item.code).filter(Boolean))]
    : [];

  const averageConfidence = normalizedItems.length > 0
    ? normalizedItems.reduce((sum, item) => sum + item.confidence, 0) / normalizedItems.length
    : 0;

  return {
    normalizedItems,
    effectiveTier1,
    effectiveTier2,
    effectiveCodes,
    averageConfidence,
    fallbackApplied,
    fallbackReason,
  };
}
