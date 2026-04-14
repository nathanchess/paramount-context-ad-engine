import type { IabTaxonomyItem } from "./types";

type IabCandidate = Partial<IabTaxonomyItem> & {
  tier1?: string;
  tier2?: string;
  tier3?: string;
  code?: string;
  confidence?: number;
};

export type AllowedIabRow = {
  tier1: string;
  tier2: string;
  tier3?: string;
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
    tier1: "Alcohol",
    tier2: "Bars",
    code: "1002",
    aliases: ["alcohol", "liquor", "bar", "bar drinks", "mixed drinks"],
  },
  {
    tier1: "Alcohol",
    tier2: "Beer",
    code: "1003",
    aliases: ["beer", "brewery", "lager", "ale", "malt beverage"],
  },
  {
    tier1: "Alcohol",
    tier2: "Hard Sodas, Seltzers, Alco Pops",
    code: "1004",
    aliases: ["hard seltzer", "hard soda", "alco pop", "alcopop", "seltzer"],
  },
  {
    tier1: "Alcohol",
    tier2: "Spirits",
    code: "1005",
    aliases: ["spirits", "whiskey", "whisky", "bourbon", "scotch", "vodka", "gin", "rum", "tequila", "cocktail"],
  },
  {
    tier1: "Alcohol",
    tier2: "Wine",
    code: "1006",
    aliases: ["wine", "winery", "vino", "sommelier", "champagne", "sparkling wine"],
  },
  {
    tier1: "Consumer Packaged Goods",
    tier2: "General Food",
    tier3: "Snacks",
    code: "1169",
    aliases: ["snack", "snacks", "chips", "crisps", "packaged snacks"],
  },
  {
    tier1: "Consumer Packaged Goods",
    tier2: "General Food",
    tier3: "Cookies & Crackers",
    code: "1166",
    aliases: ["cookies", "crackers", "biscuits"],
  },
  {
    tier1: "Consumer Packaged Goods",
    tier2: "Frozen",
    tier3: "Frozen Snacks",
    code: "1157",
    aliases: ["frozen snack", "frozen snacks", "frozen appetizers"],
  },
  {
    tier1: "Finance and Insurance",
    tier2: "Banking",
    code: "1324",
    aliases: ["banking", "bank", "checking", "savings"],
  },
  {
    tier1: "Finance and Insurance",
    tier2: "Credit Cards",
    code: "1326",
    aliases: ["credit card", "credit cards", "card rewards"],
  },
  {
    tier1: "Finance and Insurance",
    tier2: "Insurance",
    tier3: "Auto Insurance",
    code: "1328",
    aliases: ["auto insurance", "car insurance"],
  },
  {
    tier1: "Finance and Insurance",
    tier2: "Insurance",
    tier3: "Home Insurance",
    code: "1329",
    aliases: ["home insurance", "homeowners insurance"],
  },
  {
    tier1: "Finance and Insurance",
    tier2: "Insurance",
    tier3: "Life Insurance",
    code: "1330",
    aliases: ["life insurance", "term life"],
  },
  {
    tier1: "Finance and Insurance",
    tier2: "Retirement Planning",
    code: "1337",
    aliases: ["retirement", "retirement planning", "401k"],
  },
  {
    tier1: "Finance and Insurance",
    tier2: "Stocks and Investments",
    code: "1338",
    aliases: ["investing", "investment", "stocks", "portfolio", "brokerage", "wealth management"],
  },
  {
    tier1: "Vehicles",
    tier2: "Automotive Ownership",
    tier3: "New Vehicle Ownership",
    code: "1536",
    aliases: ["new car", "new vehicle", "new truck"],
  },
  {
    tier1: "Vehicles",
    tier2: "Automotive Ownership",
    tier3: "Pre-owned Automotive Ownership",
    code: "1537",
    aliases: ["used car", "pre owned", "pre-owned", "certified pre owned"],
  },
  {
    tier1: "Vehicles",
    tier2: "Vehicle Type",
    tier3: "Electric Vehicles",
    code: "1553",
    aliases: ["electric vehicle", "ev", "electric car"],
  },
  {
    tier1: "Vehicles",
    tier2: "Vehicle Type",
    tier3: "Hybrid Vehicles",
    code: "1555",
    aliases: ["hybrid", "hybrid vehicle", "hybrid car"],
  },
  {
    tier1: "Vehicles",
    tier2: "Automotive Services",
    tier3: "Auto Repair",
    code: "1544",
    aliases: ["auto repair", "car repair", "mechanic"],
  },
  {
    tier1: "Vehicles",
    tier2: "Automotive Services",
    tier3: "Car Wash",
    code: "1545",
    aliases: ["car wash", "detailing", "auto detailing"],
  },
  {
    tier1: "Vehicles",
    tier2: "Vehicle Type",
    tier3: "Gas Vehicles",
    code: "1554",
    aliases: ["gas vehicle", "gas car", "petrol car"],
  },
  {
    tier1: "Vehicles",
    tier2: "Vehicle Type",
    tier3: "Diesel Vehicles",
    code: "1552",
    aliases: ["diesel", "diesel vehicle", "diesel truck"],
  },
];

export type IabPolicyResult = {
  normalizedItems: IabTaxonomyItem[];
  effectiveTier1: string[];
  effectiveTier2: string[];
  effectiveTier3: string[];
  effectiveCodes: string[];
  averageConfidence: number;
  fallbackApplied: boolean;
  fallbackReason: string | null;
};

const IAB_HIGH_CONFIDENCE = 0.75;
const IAB_MEDIUM_CONFIDENCE = 0.5;

const FALLBACK_BY_CATEGORY_KEY: Record<string, IabTaxonomyItem[]> = {
  alcohol_premium: [{ tier1: "Alcohol", tier2: "Spirits", code: "1005", confidence: 0.4 }],
  alcohol_beer: [{ tier1: "Alcohol", tier2: "Beer", code: "1003", confidence: 0.4 }],
  automotive_truck: [{ tier1: "Vehicles", tier2: "Vehicle Type", tier3: "Diesel Vehicles", code: "1552", confidence: 0.4 }],
  automotive_luxury: [{ tier1: "Vehicles", tier2: "Automotive Ownership", tier3: "New Vehicle Ownership", code: "1536", confidence: 0.4 }],
  cpg_snacks: [{ tier1: "Consumer Packaged Goods", tier2: "General Food", tier3: "Snacks", code: "1169", confidence: 0.4 }],
  financial_services: [{ tier1: "Finance and Insurance", tier2: "Stocks and Investments", code: "1338", confidence: 0.4 }],
};

function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** JSON block injected into the analyze prompt */
export function formatIabTableForPrompt(categoryKey: string, categoryLabel: string): string {
  const rowsJson = JSON.stringify(
    IAB_ALLOWED_ROWS.map(({ tier1, tier2, tier3, code }) => ({ tier1, tier2, tier3: tier3 || "", code })),
    null,
    2
  );

  const verticalGuide: Record<string, string> = {
    alcohol_premium:
      "Premium spirits / wine / cocktails: prefer Alcohol rows like Spirits or Wine when the creative shows alcohol.",
    alcohol_beer:
      "Beer and malt beverages: prefer Alcohol / Beer when the creative clearly shows beer.",
    automotive_truck:
      "Truck and utility messaging: prefer Vehicles rows such as Vehicle Type (Diesel/Gas) or Automotive Ownership when the creative shows pickups, towing, off-road, or work sites.",
    automotive_luxury:
      "Luxury or performance cars: prefer Vehicles / Automotive Ownership with a specific tier3 when possible.",
    cpg_snacks:
      "Packaged snacks and CPG: prefer Consumer Packaged Goods / General Food with tier3 Snacks or Cookies & Crackers when the creative shows chips, cookies, party snacks, or grocery CPG.",
    financial_services:
      "Banking, investing, retirement: prefer Finance and Insurance rows such as Banking, Stocks and Investments, Retirement Planning, or Insurance tier3 classes.",
  };

  const guide =
    verticalGuide[categoryKey] ||
    "Pick the rows that honestly match the video creative; every iab object must still be copied exactly from the allowed list.";

  return `ALLOWED IAB TAXONOMY (closed set — each object in "iab" MUST be copied exactly from this list: same tier1, tier2, tier3 (when present), and code strings character-for-character. Do not invent codes, tiers, or rows outside this list.)
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
  if (row.tier3) set.add(norm(row.tier3));
  for (const a of row.aliases || []) set.add(norm(a));
  return [...set];
}

function snapCandidateToAllowedRow(candidate: IabCandidate): IabTaxonomyItem | null {
  const tier1 = typeof candidate.tier1 === "string" ? candidate.tier1.trim() : "";
  const tier2 = typeof candidate.tier2 === "string" ? candidate.tier2.trim() : "";
  const tier3 = typeof candidate.tier3 === "string" ? candidate.tier3.trim() : "";
  const code = typeof candidate.code === "string" ? candidate.code.trim().toUpperCase() : "";
  const confidence = clampConfidence(candidate.confidence);

  const n1 = norm(tier1);
  const n2 = norm(tier2);
  const n3 = norm(tier3);

  if (!tier1 && !tier2 && !tier3 && !code) return null;

  const exact = IAB_ALLOWED_ROWS.find(
    (r) => norm(r.tier1) === n1 && norm(r.tier2) === n2 && norm(r.tier3 || "") === n3
  );
  if (exact) {
    return { tier1: exact.tier1, tier2: exact.tier2, tier3: exact.tier3, code: exact.code, confidence };
  }

  const byT2 = IAB_ALLOWED_ROWS.filter((r) => norm(r.tier2) === n2);
  if (byT2.length === 1) {
    const r = byT2[0];
    return { tier1: r.tier1, tier2: r.tier2, tier3: r.tier3, code: r.code, confidence };
  }

  if (code) {
    const byCode = IAB_ALLOWED_ROWS.filter((r) => r.code.toUpperCase() === code);
    if (byCode.length === 1) {
      const r = byCode[0];
      return { tier1: r.tier1, tier2: r.tier2, tier3: r.tier3, code: r.code, confidence };
    }
    if (byCode.length > 1 && (n2 || n3)) {
      const hit = byCode.find((r) => norm(r.tier2) === n2 && norm(r.tier3 || "") === n3);
      if (hit) return { tier1: hit.tier1, tier2: hit.tier2, tier3: hit.tier3, code: hit.code, confidence };
    }
  }

  const probe = n3 || n2 || n1;
  if (probe) {
    const matchedRows: AllowedIabRow[] = [];
    for (const row of IAB_ALLOWED_ROWS) {
      if (collectAliasTargets(row).includes(probe)) matchedRows.push(row);
    }
    if (matchedRows.length === 1) {
      const r = matchedRows[0];
      return { tier1: r.tier1, tier2: r.tier2, tier3: r.tier3, code: r.code, confidence };
    }
    if (matchedRows.length > 1) {
      const prefer =
        matchedRows.find((r) => norm(r.tier3 || "") === n3) ||
        matchedRows.find((r) => norm(r.tier2) === n2) ||
        matchedRows[0];
      return { tier1: prefer.tier1, tier2: prefer.tier2, tier3: prefer.tier3, code: prefer.code, confidence };
    }
  }

  return null;
}

function dedupeAndSort(items: IabTaxonomyItem[]): IabTaxonomyItem[] {
  const deduped = new Map<string, IabTaxonomyItem>();
  for (const item of items) {
    const key = `${item.code}|${item.tier1}|${item.tier2}|${item.tier3 || ""}`;
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
  const effectiveTier3 = high.length > 0
    ? [...new Set(effectiveItems.map((item) => item.tier3).filter((tier3): tier3 is string => Boolean(tier3)))]
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
    effectiveTier3,
    effectiveCodes,
    averageConfidence,
    fallbackApplied,
    fallbackReason,
  };
}
