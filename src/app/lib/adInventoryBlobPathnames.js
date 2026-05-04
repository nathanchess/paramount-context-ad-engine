import { AD_INVENTORY_DETAIL_ANALYZE_PROMPT } from "./adInventoryDetailAnalyzePrompt.js";

export const ANALYSIS_CACHE_VERSION = "v5";
/** Must match adInventoryIabSemantic/route.js SEMANTIC_IAB_CACHE_VERSION */
export const SEMANTIC_IAB_CACHE_VERSION = "v1";
/** Must match api/embeddings/route.js CACHE_VERSION */
export const SEGMENT_EMBEDDINGS_CACHE_VERSION = "v1";
export const AD_INVENTORY_KNN_CACHE_VERSION = "v1";

export function stableHash(input) {
  const text = typeof input === "string" ? input : JSON.stringify(input || {});
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16);
}

/** Blob pathname for POST /api/analyze with arbitrary prompt (matches analyze route). */
export function pathnameAnalyzeCache(videoId, prompt, responseFormat, temperature) {
  const contractHash = stableHash({
    prompt,
    response_format: responseFormat,
    temperature: temperature ?? 0.2,
  });
  return `analysis_${ANALYSIS_CACHE_VERSION}_${videoId}_${contractHash}.json`;
}

/** Detail-page analyze cache (fixed prompt + temperature 0.2, no response_format). */
export function pathnameDetailAnalyzeCache(videoId) {
  return pathnameAnalyzeCache(
    videoId,
    AD_INVENTORY_DETAIL_ANALYZE_PROMPT,
    undefined,
    0.2
  );
}

export function pathnameSemanticIabCache(categoryKey, resolvedVideo) {
  const videoSig =
    resolvedVideo.video.type === "asset_id"
      ? { t: "a", id: String(resolvedVideo.video.assetId).toLowerCase() }
      : { t: "u", u: String(resolvedVideo.video.url) };
  const contractHash = stableHash({
    categoryKey,
    video: videoSig,
    cache: SEMANTIC_IAB_CACHE_VERSION,
  });
  return `iab_semantic_${SEMANTIC_IAB_CACHE_VERSION}_${contractHash}.json`;
}

export function pathnameSegmentEmbeddingsCache(videoId) {
  return `segment_embeddings_${SEGMENT_EMBEDDINGS_CACHE_VERSION}_${videoId}.json`;
}

export function pathnameAdInventoryKnnCache(slug) {
  const safe = String(slug || "unknown").replace(/[^a-z0-9-_]/gi, "_");
  return `ad_inventory_knn_${AD_INVENTORY_KNN_CACHE_VERSION}_${safe}.json`;
}
