function toSnakeCaseTag(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

/** Maps ad-inventory URL slug → cohort key used in APIs and policy. */
export function getCategoryKeyFromSlug(slug) {
  const slugToCategoryKey = {
    "premium-spirits": "alcohol_premium",
    "automotive-truck": "automotive_truck",
    "cpg-snacks": "cpg_snacks",
    "financial-services": "financial_services",
  };
  return slugToCategoryKey[slug] ?? toSnakeCaseTag(slug);
}
