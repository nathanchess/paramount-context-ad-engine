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

/** Why `fallbackApplied` / which band selected — for debugging UI and logs. */
export type IabPolicyDiagnostics = {
  rawArrayLength: number;
  normalizedCount: number;
  maxConfidence: number;
  minConfidence: number;
  highBandCount: number;
  mediumBandCount: number;
  thresholds: { high: number; medium: number };
  effectiveSource: "high" | "medium" | "fallback_rows" | "fallback_empty" | "semantic_direct";
};

export type IabPolicyResult = {
  normalizedItems: IabTaxonomyItem[];
  effectiveTier1: string[];
  effectiveTier2: string[];
  effectiveTier3: string[];
  effectiveTier4: string[];
  effectiveCodes: string[];
  averageConfidence: number;
  fallbackApplied: boolean;
  fallbackReason: string | null;
  diagnostics: IabPolicyDiagnostics;
};

const IAB_HIGH_CONFIDENCE = 0.75;
/** Cosine→confidence mapping for semantic hits often lands 0.4–0.55; 0.5 was too strict and forced fallback every time. */
const IAB_MEDIUM_CONFIDENCE = 0.4;

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

/**
 * Split a Content Taxonomy 3.1-style breadcrumb (`"A > B > C > D"`) into up to four tier labels.
 * Deeper paths join remaining segments into `tier4` so a fifth level is not dropped silently.
 */
export function parseTaxonomy31Breadcrumb(breadcrumb: string): {
  tier1: string;
  tier2: string;
  tier3?: string;
  tier4?: string;
} {
  const parts = String(breadcrumb ?? "")
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { tier1: "", tier2: "" };
  if (parts.length === 1) return { tier1: parts[0], tier2: parts[0] };
  if (parts.length === 2) return { tier1: parts[0], tier2: parts[1] };
  if (parts.length === 3) return { tier1: parts[0], tier2: parts[1], tier3: parts[2] };
  return {
    tier1: parts[0],
    tier2: parts[1],
    tier3: parts[2],
    tier4: parts.length > 4 ? parts.slice(3).join(" / ") : parts[3],
  };
}

/** Coerce IAB rows from stored JSON / APIs into `IabTaxonomyItem` (tier strings, confidence, CT31 id). */
export function normalizeIabItemsFromUnknown(input: unknown): IabTaxonomyItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item): IabTaxonomyItem | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const tier1 = typeof record.tier1 === "string" ? record.tier1.trim() : "";
      const tier2 = typeof record.tier2 === "string" ? record.tier2.trim() : "";
      const tier3 = typeof record.tier3 === "string" ? record.tier3.trim() : "";
      const tier4 = typeof record.tier4 === "string" ? record.tier4.trim() : "";
      const code = typeof record.code === "string" ? record.code.trim() : "";
      const rawTaxonomyId = record.taxonomyNodeId;
      const taxonomyNodeId =
        typeof rawTaxonomyId === "string"
          ? rawTaxonomyId.trim()
          : rawTaxonomyId != null && String(rawTaxonomyId).trim()
            ? String(rawTaxonomyId).trim()
            : "";
      let confidence = 0;
      if (typeof record.confidence === "number" && !Number.isNaN(record.confidence)) {
        confidence = Math.max(0, Math.min(1, record.confidence));
      } else if (typeof record.confidence === "string" && record.confidence.trim()) {
        const p = parseFloat(record.confidence);
        if (!Number.isNaN(p)) confidence = Math.max(0, Math.min(1, p));
      }
      if (!tier1 || !tier2) return null;
      return {
        tier1,
        tier2,
        tier3: tier3 || undefined,
        tier4: tier4 || undefined,
        code,
        confidence,
        ...(taxonomyNodeId ? { taxonomyNodeId } : {}),
      };
    })
    .filter((v): v is IabTaxonomyItem => v !== null);
}

/** Copy of category fallbacks for callers that need a deterministic row outside `normalizeIabWithPolicy`. */
export function getCategoryFallbackIabRows(categoryKey: string): IabTaxonomyItem[] {
  const rows = FALLBACK_BY_CATEGORY_KEY[categoryKey];
  return rows ? rows.map((r) => ({ ...r })) : [];
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
  const tier4 = typeof candidate.tier4 === "string" ? candidate.tier4.trim() : "";
  const taxonomyNodeIdRaw = candidate.taxonomyNodeId;
  const taxonomyNodeId =
    typeof taxonomyNodeIdRaw === "string"
      ? taxonomyNodeIdRaw.trim()
      : taxonomyNodeIdRaw != null && String(taxonomyNodeIdRaw).trim()
        ? String(taxonomyNodeIdRaw).trim()
        : "";
  const code = typeof candidate.code === "string" ? candidate.code.trim().toUpperCase() : "";
  const confidence = clampConfidence(candidate.confidence);
  const passExtras = {
    ...(tier4 ? { tier4 } : {}),
    ...(taxonomyNodeId ? { taxonomyNodeId } : {}),
  };

  const n1 = norm(tier1);
  const n2 = norm(tier2);
  const n3 = norm(tier3);

  if (!tier1 && !tier2 && !tier3 && !code) return null;

  const exact = IAB_ALLOWED_ROWS.find(
    (r) => norm(r.tier1) === n1 && norm(r.tier2) === n2 && norm(r.tier3 || "") === n3
  );
  if (exact) {
    return { tier1: exact.tier1, tier2: exact.tier2, tier3: exact.tier3, code: exact.code, confidence, ...passExtras };
  }

  const byT2 = IAB_ALLOWED_ROWS.filter((r) => norm(r.tier2) === n2);
  if (byT2.length === 1) {
    const r = byT2[0];
    return { tier1: r.tier1, tier2: r.tier2, tier3: r.tier3, code: r.code, confidence, ...passExtras };
  }

  if (code) {
    const byCode = IAB_ALLOWED_ROWS.filter((r) => r.code.toUpperCase() === code);
    if (byCode.length === 1) {
      const r = byCode[0];
      return { tier1: r.tier1, tier2: r.tier2, tier3: r.tier3, code: r.code, confidence, ...passExtras };
    }
    if (byCode.length > 1 && (n2 || n3)) {
      const hit = byCode.find((r) => norm(r.tier2) === n2 && norm(r.tier3 || "") === n3);
      if (hit) return { tier1: hit.tier1, tier2: hit.tier2, tier3: hit.tier3, code: hit.code, confidence, ...passExtras };
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
      return { tier1: r.tier1, tier2: r.tier2, tier3: r.tier3, code: r.code, confidence, ...passExtras };
    }
    if (matchedRows.length > 1) {
      const prefer =
        matchedRows.find((r) => norm(r.tier3 || "") === n3) ||
        matchedRows.find((r) => norm(r.tier2) === n2) ||
        matchedRows[0];
      return { tier1: prefer.tier1, tier2: prefer.tier2, tier3: prefer.tier3, code: prefer.code, confidence, ...passExtras };
    }
  }

  return null;
}

/** Dedupe embedding-matched taxonomy rows by `taxonomyNodeId` (same as `iab_id` in taxonomy_embeds.json). */
function dedupeSemanticTaxonomyItems(items: IabTaxonomyItem[]): IabTaxonomyItem[] {
  const m = new Map<string, IabTaxonomyItem>();
  for (const item of items) {
    const key = (item.taxonomyNodeId && String(item.taxonomyNodeId).trim()) || item.code;
    if (!key) continue;
    const prior = m.get(key);
    if (!prior || item.confidence > prior.confidence) m.set(key, item);
  }
  return [...m.values()].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.tier1.localeCompare(b.tier1);
  });
}

/** True when every normalized row came from taxonomy_embeds cosine match (`taxonomyNodeId` / `iab_id`). */
export function isSemanticDirectTaxonomyPayload(rawInput: unknown): boolean {
  const items = normalizeIabItemsFromUnknown(rawInput);
  if (items.length === 0) return false;
  return items.every((item) => item.taxonomyNodeId != null && String(item.taxonomyNodeId).trim().length > 0);
}

/**
 * Lightweight finalize for rows already aligned to Content Taxonomy 3.1 (`taxonomy_embeds.json`):
 * each item should carry `taxonomyNodeId` (= `iab_id`) and tier labels from the node breadcrumb.
 * No snapping to the demo `IAB_ALLOWED_ROWS` set and no high/medium/fallback bands.
 */
export function finalizeSemanticTaxonomyIab(rawInput: unknown): IabPolicyResult {
  const rawItems = Array.isArray(rawInput) ? rawInput : [];
  const candidates = normalizeIabItemsFromUnknown(rawInput);
  const normalizedItems = dedupeSemanticTaxonomyItems(candidates);
  const effectiveItems = normalizedItems;

  const effectiveTier1 = [...new Set(effectiveItems.map((item) => item.tier1))];
  const effectiveTier2 = effectiveItems.length > 0 ? [...new Set(effectiveItems.map((item) => item.tier2))] : [];
  const effectiveTier3 = effectiveItems.length > 0
    ? [...new Set(effectiveItems.map((item) => item.tier3).filter((t): t is string => Boolean(t)))]
    : [];
  const effectiveTier4 = effectiveItems.length > 0
    ? [...new Set(effectiveItems.map((item) => item.tier4).filter((t): t is string => Boolean(t)))]
    : [];
  const effectiveCodes = effectiveItems.length > 0
    ? [...new Set(effectiveItems.map((item) => item.code).filter(Boolean))]
    : [];

  const averageConfidence = normalizedItems.length > 0
    ? normalizedItems.reduce((sum, item) => sum + item.confidence, 0) / normalizedItems.length
    : 0;

  const confidences = normalizedItems.map((i) => i.confidence);
  const diagnostics: IabPolicyDiagnostics = {
    rawArrayLength: rawItems.length,
    normalizedCount: normalizedItems.length,
    maxConfidence: confidences.length ? Math.max(...confidences) : 0,
    minConfidence: confidences.length ? Math.min(...confidences) : 0,
    highBandCount: normalizedItems.length,
    mediumBandCount: 0,
    thresholds: { high: IAB_HIGH_CONFIDENCE, medium: IAB_MEDIUM_CONFIDENCE },
    effectiveSource: "semantic_direct",
  };

  return {
    normalizedItems,
    effectiveTier1,
    effectiveTier2,
    effectiveTier3,
    effectiveTier4,
    effectiveCodes,
    averageConfidence,
    fallbackApplied: normalizedItems.length === 0,
    fallbackReason:
      normalizedItems.length === 0
        ? "No semantic taxonomy rows after dedupe (check taxonomy_embeds coverage and scene matches)."
        : null,
    diagnostics,
  };
}

function dedupeAndSort(items: IabTaxonomyItem[]): IabTaxonomyItem[] {
  const deduped = new Map<string, IabTaxonomyItem>();
  for (const item of items) {
    const key = `${item.code}|${item.tier1}|${item.tier2}|${item.tier3 || ""}|${item.tier4 || ""}|${item.taxonomyNodeId || ""}`;
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
  let effectiveSource: IabPolicyDiagnostics["effectiveSource"] = "fallback_empty";

  if (high.length > 0) {
    effectiveItems = high;
    effectiveSource = "high";
  } else if (medium.length > 0) {
    effectiveItems = medium;
    effectiveSource = "medium";
    fallbackReason =
      "No high-confidence classes (≥ " +
      IAB_HIGH_CONFIDENCE +
      "); using medium band (≥ " +
      IAB_MEDIUM_CONFIDENCE +
      ") for OpenRTB tier fields.";
  } else {
    const fallback = (categoryKey && FALLBACK_BY_CATEGORY_KEY[categoryKey]) || [];
    effectiveItems = fallback;
    fallbackApplied = true;
    effectiveSource = fallback.length ? "fallback_rows" : "fallback_empty";
    fallbackReason = fallback.length
      ? "No items met the medium confidence threshold; applied deterministic category fallback."
      : "No normalized IAB rows and no category fallback mapping for this vertical key.";
  }

  const effectiveTier1 = [...new Set(effectiveItems.map((item) => item.tier1))];
  const showRichTiers = effectiveItems.length > 0;
  const effectiveTier2 = showRichTiers ? [...new Set(effectiveItems.map((item) => item.tier2))] : [];
  const effectiveTier3 = showRichTiers
    ? [...new Set(effectiveItems.map((item) => item.tier3).filter((tier3): tier3 is string => Boolean(tier3)))]
    : [];
  const effectiveTier4 = showRichTiers
    ? [...new Set(effectiveItems.map((item) => item.tier4).filter((tier4): tier4 is string => Boolean(tier4)))]
    : [];
  const effectiveCodes = showRichTiers ? [...new Set(effectiveItems.map((item) => item.code).filter(Boolean))] : [];

  const averageConfidence = normalizedItems.length > 0
    ? normalizedItems.reduce((sum, item) => sum + item.confidence, 0) / normalizedItems.length
    : 0;

  const confidences = normalizedItems.map((i) => i.confidence);
  const diagnostics: IabPolicyDiagnostics = {
    rawArrayLength: rawItems.length,
    normalizedCount: normalizedItems.length,
    maxConfidence: confidences.length ? Math.max(...confidences) : 0,
    minConfidence: confidences.length ? Math.min(...confidences) : 0,
    highBandCount: high.length,
    mediumBandCount: medium.length,
    thresholds: { high: IAB_HIGH_CONFIDENCE, medium: IAB_MEDIUM_CONFIDENCE },
    effectiveSource,
  };

  return {
    normalizedItems,
    effectiveTier1,
    effectiveTier2,
    effectiveTier3,
    effectiveTier4,
    effectiveCodes,
    averageConfidence,
    fallbackApplied,
    fallbackReason,
    diagnostics,
  };
}
