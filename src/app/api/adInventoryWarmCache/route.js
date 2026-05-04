import { NextResponse } from "next/server";
import { BlobNotFoundError, get, head, put } from "@vercel/blob";
import { AD_INVENTORY_DETAIL_ANALYZE_PROMPT } from "../../lib/adInventoryDetailAnalyzePrompt.js";
import {
  pathnameAdInventoryKnnCache,
  pathnameDetailAnalyzeCache,
  pathnameSemanticIabCache,
  pathnameSegmentEmbeddingsCache,
} from "../../lib/adInventoryBlobPathnames.js";
import { resolveAsyncAnalyzeVideo } from "../../lib/adInventorySemanticResolve.js";

export const maxDuration = 300;

const KNN_K = 5;

/** GET /api/adInventoryWarmCache?slug=… — read cached Marengo k-NN payload for a category (if present). */
export async function GET(request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug query parameter is required" }, { status: 400 });
  }
  const pathname = pathnameAdInventoryKnnCache(slug);
  try {
    const cached = await get(pathname, { access: "public" });
    if (cached?.statusCode === 200 && cached.stream) {
      const raw = await new Response(cached.stream).text();
      try {
        return NextResponse.json(JSON.parse(raw));
      } catch {
        return NextResponse.json({ error: "Corrupt k-NN cache" }, { status: 502 });
      }
    }
  } catch (e) {
    if (e instanceof BlobNotFoundError || e?.name === "BlobNotFoundError") {
      return NextResponse.json({ error: "No k-NN cache for this slug yet. Run Warm all caches." }, { status: 404 });
    }
    throw e;
  }
  return NextResponse.json({ error: "k-NN cache miss" }, { status: 404 });
}

async function blobExists(pathname) {
  try {
    await head(pathname);
    return true;
  } catch (e) {
    if (e instanceof BlobNotFoundError) return false;
    if (e && e.name === "BlobNotFoundError") return false;
    throw e;
  }
}

function averageVectors(vectors) {
  const valid = vectors.filter((v) => Array.isArray(v) && v.length > 0);
  if (valid.length === 0) return null;
  const dim = valid[0].length;
  const avg = new Array(dim).fill(0);
  for (const vec of valid) {
    if (vec.length !== dim) continue;
    for (let i = 0; i < dim; i++) avg[i] += vec[i];
  }
  for (let i = 0; i < dim; i++) avg[i] /= valid.length;
  return avg;
}

/** One Marengo vector per creative: mean of segment vectors from /api/embeddings payload. */
function meanVectorFromEmbeddingsPayload(payload) {
  const segs = payload?.segments;
  if (!segs || typeof segs !== "object") return null;
  const list = Object.values(segs).filter((v) => Array.isArray(v) && v.length > 0);
  return averageVectors(list);
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildKnnNeighbors(byId, k) {
  const ids = Object.keys(byId);
  const neighbors = {};
  for (const id of ids) {
    const a = byId[id];
    const scores = [];
    for (const peer of ids) {
      if (peer === id) continue;
      const sim = cosineSimilarity(a, byId[peer]);
      if (typeof sim === "number" && sim > -0.5) scores.push({ videoId: peer, cosineSimilarity: sim });
    }
    scores.sort((x, y) => y.cosineSimilarity - x.cosineSimilarity);
    neighbors[id] = scores.slice(0, k);
  }
  return neighbors;
}

/**
 * POST /api/adInventoryWarmCache
 * Body: { slug: string, categoryKey: string, videos: [{ id: string, videoUrl?: string }] }
 *
 * For each video (in parallel): if detail analyze / semantic IAB / segment embeddings blobs are
 * missing, calls the existing APIs so they populate Vercel Blob. Then writes Marengo k-NN graph
 * (cosine on mean segment vectors) to Blob for this category slug.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const categoryKey = typeof body.categoryKey === "string" ? body.categoryKey.trim() : "";
  const videos = Array.isArray(body.videos) ? body.videos : [];

  if (!slug || !categoryKey) {
    return NextResponse.json({ error: "slug and categoryKey are required" }, { status: 400 });
  }
  if (videos.length === 0) {
    return NextResponse.json({ error: "videos array is required" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  const perVideo = await Promise.all(
    videos.map(async (v) => {
      const videoId = typeof v.id === "string" ? v.id.trim() : "";
      const videoUrl = typeof v.videoUrl === "string" ? v.videoUrl.trim() : "";
      if (!videoId) {
        return {
          videoId: v.id,
          ok: false,
          error: "missing id",
          skipped: null,
          embeddingJson: null,
        };
      }

      const resolved = resolveAsyncAnalyzeVideo({ videoId, videoUrl: videoUrl || undefined, categoryKey });
      if (!resolved) {
        return {
          videoId,
          ok: false,
          error: "could_not_resolve_video_for_semantic",
          skipped: null,
          embeddingJson: null,
        };
      }

      const pAnalyze = pathnameDetailAnalyzeCache(videoId);
      const pSemantic = pathnameSemanticIabCache(categoryKey, resolved);
      const pEmb = pathnameSegmentEmbeddingsCache(videoId);

      let hasAnalyze;
      let hasSemantic;
      let hasEmbeddings;
      try {
        [hasAnalyze, hasSemantic, hasEmbeddings] = await Promise.all([
          blobExists(pAnalyze),
          blobExists(pSemantic),
          blobExists(pEmb),
        ]);
      } catch (e) {
        return {
          videoId,
          ok: false,
          error: e?.message || "blob_probe_failed",
          skipped: null,
          embeddingJson: null,
        };
      }

      const skipped = { analyze: hasAnalyze, semantic: hasSemantic, embeddings: hasEmbeddings };

      const warmTasks = [];
      if (!hasAnalyze) {
        warmTasks.push(
          fetch(`${origin}/api/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoId, prompt: AD_INVENTORY_DETAIL_ANALYZE_PROMPT }),
          })
        );
      }
      if (!hasSemantic) {
        warmTasks.push(
          fetch(`${origin}/api/adInventoryIabSemantic`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId,
              videoUrl: videoUrl || undefined,
              categoryKey,
            }),
          })
        );
      }
      if (!hasEmbeddings) {
        warmTasks.push(
          fetch(`${origin}/api/embeddings?videoId=${encodeURIComponent(videoId)}`)
        );
      }

      try {
        if (warmTasks.length > 0) {
          const responses = await Promise.all(warmTasks);
          for (let i = 0; i < responses.length; i++) {
            if (!responses[i].ok) {
              const txt = await responses[i].text();
              throw new Error(`upstream ${responses[i].status}: ${txt.slice(0, 240)}`);
            }
          }
        }
      } catch (e) {
        return {
          videoId,
          ok: false,
          error: e?.message || "warm_failed",
          skipped,
          embeddingJson: null,
        };
      }

      let embeddingJson = null;
      try {
        const embRes = await fetch(`${origin}/api/embeddings?videoId=${encodeURIComponent(videoId)}`);
        if (embRes.ok) embeddingJson = await embRes.json();
      } catch {
        /* KNN may skip this video */
      }

      return { videoId, ok: true, error: null, skipped, embeddingJson };
    })
  );

  const vectorsById = {};
  const errors = [];
  for (const row of perVideo) {
    if (!row.ok) {
      errors.push({ videoId: row.videoId, error: row.error });
      continue;
    }
    const vec = meanVectorFromEmbeddingsPayload(row.embeddingJson);
    if (vec) vectorsById[row.videoId] = vec;
  }

  const knnPathname = pathnameAdInventoryKnnCache(slug);
  let knnSaved = false;
  const idList = Object.keys(vectorsById);
  if (idList.length >= 1) {
    const neighbors = buildKnnNeighbors(vectorsById, KNN_K);
    const knnPayload = {
      kind: "ad_inventory_marengo_knn",
      slug,
      categoryKey,
      k: KNN_K,
      updatedAt: new Date().toISOString(),
      videoIds: idList,
      neighbors,
      vectorDim: vectorsById[idList[0]]?.length ?? 0,
    };
    try {
      await put(knnPathname, JSON.stringify(knnPayload), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      knnSaved = true;
    } catch (e) {
      errors.push({ videoId: null, error: `knn_blob_write: ${e?.message || e}` });
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    slug,
    categoryKey,
    videoCount: videos.length,
    results: perVideo.map((r) => ({
      videoId: r.videoId,
      ok: r.ok,
      error: r.error,
      skipped: r.skipped,
      hasMarengoMean: Boolean(r.embeddingJson && meanVectorFromEmbeddingsPayload(r.embeddingJson)),
    })),
    knn: {
      saved: knnSaved,
      pathname: knnPathname,
      videosWithVectors: idList.length,
    },
    errors,
  });
}
