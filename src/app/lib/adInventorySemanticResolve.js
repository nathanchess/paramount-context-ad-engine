/** TwelveLabs CDN playback URLs embed the indexed asset id under `/assets/{id}/`. */
const TL_ASSET_PATH_RE = /\/assets\/([a-f0-9]{24})\//i;

export function isProbablyHlsManifestUrl(url) {
  return /\.m3u8(\?|$)/i.test(String(url || ""));
}

/**
 * Pegasus 1.5 async analyze accepts `url` (direct media file) or `asset_id` (platform asset).
 * HLS playlist URLs (.m3u8) are not valid for the `url` option — use `asset_id` instead.
 */
export function resolveAsyncAnalyzeVideo(body) {
  const explicitAsset =
    typeof body.assetId === "string" && /^[a-f0-9]{24}$/i.test(body.assetId.trim())
      ? body.assetId.trim()
      : null;
  if (explicitAsset) {
    return { video: { type: "asset_id", assetId: explicitAsset }, source: "body.assetId" };
  }

  const videoUrl = typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";
  if (videoUrl) {
    const m = videoUrl.match(TL_ASSET_PATH_RE);
    if (m?.[1]) {
      return { video: { type: "asset_id", assetId: m[1] }, source: "playback_url.assets_segment" };
    }
    if (!isProbablyHlsManifestUrl(videoUrl) && /^https?:\/\//i.test(videoUrl)) {
      return { video: { type: "url", url: videoUrl }, source: "direct_url" };
    }
  }

  const videoId = typeof body.videoId === "string" ? body.videoId.trim() : "";
  if (videoId && /^[a-f0-9]{24}$/i.test(videoId)) {
    return { video: { type: "asset_id", assetId: videoId }, source: "body.videoId_as_asset" };
  }

  if (videoUrl && /^https?:\/\//i.test(videoUrl)) {
    return null;
  }
  return null;
}
