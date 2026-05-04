/**
 * Taxonomy rows in taxonomy_embeds.json embed `rich_text` shaped like:
 *   "Hierarchy: Automotive. Keywords: phrase one, phrase two, ..."
 *
 * Pegasus outputs a plain `scene_description`. We wrap it in the same outer shape
 * before calling text-embedding-3-small so token patterns align with stored vectors.
 *
 * IMPORTANT: Do not use phrases like "video scene", "creative video", or "video production"
 * in the synthetic Hierarchy line — they collide semantically with IAB node 268
 * (Hobbies & Interests > Content Production > Video Production) and skew cosine retrieval.
 *
 * @param {string} sceneDescription
 * @param {{ categoryKey?: string }} [options]
 * @returns {string}
 */

/** Optional vertical hint for the Hierarchy line (same keys as ad inventory `categoryKey`). */
const CATEGORY_HIERARCHY_HINT = {
  alcohol_premium:
    "Alcoholic beverages, spirits, wine, cocktails, or bar and celebration settings in the spot",
  alcohol_beer: "Beer, malt beverages, brewery, or casual social drinking in the spot",
  automotive_truck: "Trucks, pickups, towing, worksites, or utility vehicle use in the spot",
  automotive_luxury: "Luxury or performance cars and premium automotive lifestyle in the spot",
  cpg_snacks: "Packaged snacks, chips, cookies, or grocery food moments in the spot",
  financial_services: "Banking, investing, insurance, or financial services messaging in the spot",
};

const DEFAULT_HIERARCHY =
  "Subjects, products, brands, people, locations, activities, and mood depicted in the advertisement";

function formatSceneTextForTaxonomyEmbedding(sceneDescription, options = {}) {
  const body = String(sceneDescription ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!body) return "";
  const punct = body.endsWith(".") ? "" : ".";
  const key = typeof options.categoryKey === "string" ? options.categoryKey.trim() : "";
  const hierarchy = (key && CATEGORY_HIERARCHY_HINT[key]) || DEFAULT_HIERARCHY;
  return `Hierarchy: ${hierarchy}. Keywords: ${body}${punct}`;
}

module.exports = { formatSceneTextForTaxonomyEmbedding, CATEGORY_HIERARCHY_HINT };
