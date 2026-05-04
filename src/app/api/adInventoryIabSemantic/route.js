import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { TwelveLabs } from "twelvelabs-js";
import { get, put } from "@vercel/blob";
import { getCategoryFallbackIabRows, parseTaxonomy31Breadcrumb } from "../../lib/iabTaxonomy";
import { formatSceneTextForTaxonomyEmbedding } from "../../lib/taxonomySceneEmbeddingText.js";
import { pathnameSemanticIabCache } from "../../lib/adInventoryBlobPathnames.js";
import { isProbablyHlsManifestUrl, resolveAsyncAnalyzeVideo } from "../../lib/adInventorySemanticResolve.js";

export const maxDuration = 300;

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

/** Keep the K highest cosine rows in one pass (no full sort over the taxonomy). */
function pushTopCosine(top, entry, k) {
  if (top.length < k) {
    top.push(entry);
    top.sort((a, b) => b.cosine_similarity - a.cosine_similarity);
    return;
  }
  if (entry.cosine_similarity <= top[k - 1].cosine_similarity) return;
  top[k - 1] = entry;
  top.sort((a, b) => b.cosine_similarity - a.cosine_similarity);
}

function mapCosineToConfidence(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return 0.35;
  const t = Math.max(0, Math.min(1, (score - 0.18) / 0.62));
  return Math.round((0.35 + t * 0.45) * 1000) / 1000;
}

async function waitForAnalyzeTask(tlClient, taskId, { maxWaitMs = 240000, intervalMs = 4000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const task = await tlClient.analyzeAsync.tasks.retrieve(taskId);
    if (task.status === "ready") return task;
    if (task.status === "failed") {
      const msg = task.error?.message || `Analyze task ${taskId} failed`;
      throw new Error(msg);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timed out waiting for Pegasus 1.5 segmentation task");
}

function loadTaxonomyVectors() {
  const p = path.join(process.cwd(), "taxonomy_embeds.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Missing taxonomy_embeds.json at ${p}. Run pegasus_test.js embed_IAB_DATA first.`);
  }
  const raw = fs.readFileSync(p, "utf8").trim();
  const parsed = raw ? JSON.parse(raw) : [];
  const rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.vectors) ? parsed.vectors : []);
  const vectors = [];
  for (const row of rows) {
    if (!row) continue;
    const rowId = typeof row.iab_id === "number" ? String(row.iab_id) : row.iab_id;
    const rich =
      typeof row.rich_text === "string"
        ? row.rich_text
        : typeof row.node_data === "string"
          ? row.node_data
          : "";
    const emb = row.embedding;
    if (typeof rowId === "string" && rowId.length > 0 && Array.isArray(emb) && emb.length > 0 && rich) {
      vectors.push({
        iab_id: rowId,
        breadcrumb: typeof row.breadcrumb === "string" ? row.breadcrumb : "",
        rich_text: rich,
        embedding: emb,
      });
    }
  }
  if (vectors.length === 0) {
    throw new Error("taxonomy_embeds.json contained no usable embedding rows");
  }
  return vectors;
}

/**
 * Aggregate per-scene best taxonomy hits into 2–6 rows aligned to taxonomy_embeds.json:
 * tiers from `breadcrumb`, `code` and `taxonomyNodeId` set to the node's `iab_id` (same id as in the JSON).
 */
function buildIabFromSceneMatches(sceneRows, categoryKey) {
  const byId = new Map();
  for (const row of sceneRows) {
    const id = row.matched_iab_id;
    if (!id || typeof id !== "string") continue;
    const cos = typeof row.cosine_similarity === "number" ? row.cosine_similarity : -1;
    const prev = byId.get(id) || { sum: 0, n: 0, breadcrumb: row.matched_breadcrumb || "" };
    prev.sum += Math.max(0, cos);
    prev.n += 1;
    if (!prev.breadcrumb && row.matched_breadcrumb) prev.breadcrumb = row.matched_breadcrumb;
    byId.set(id, prev);
  }

  const ranked = [...byId.entries()]
    .map(([iab_id, v]) => ({
      iab_id,
      avgCos: v.n ? v.sum / v.n : 0,
      breadcrumb: v.breadcrumb || "",
    }))
    .sort((a, b) => b.avgCos - a.avgCos)
    .slice(0, 8);

  const out = [];
  const usedIds = new Set();

  for (const { avgCos, breadcrumb, iab_id } of ranked) {
    const tid = typeof iab_id === "string" ? iab_id : String(iab_id);
    if (usedIds.has(tid)) continue;
    usedIds.add(tid);
    const leaf = parseTaxonomy31Breadcrumb(breadcrumb);
    const t1 = (leaf.tier1 && leaf.tier1.trim()) || "Unknown";
    const t2 = (leaf.tier2 && leaf.tier2.trim()) || t1;
    const conf = mapCosineToConfidence(avgCos);
    out.push({
      tier1: t1,
      tier2: t2,
      tier3: leaf.tier3,
      tier4: leaf.tier4,
      code: tid,
      confidence: conf,
      taxonomyNodeId: tid,
    });
    if (out.length >= 6) break;
  }

  if (out.length === 0) {
    const fb = getCategoryFallbackIabRows(categoryKey || "");
    return fb.length ? fb.map((r) => ({ ...r, confidence: Math.min(0.45, r.confidence) })) : [];
  }

  return out.slice(0, 6);
}

export async function POST(request) {
  const apiKey = process.env.TL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TL_API_KEY is not configured" }, { status: 500 });
  }
  if (!openaiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is required for taxonomy embedding match" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const categoryKey = typeof body.categoryKey === "string" ? body.categoryKey.trim() : "";

  const resolvedVideo = resolveAsyncAnalyzeVideo(body);
  if (!resolvedVideo) {
    const hasUrl = typeof body.videoUrl === "string" && /^https?:\/\//i.test(String(body.videoUrl).trim());
    const hint = hasUrl && isProbablyHlsManifestUrl(body.videoUrl)
      ? "HLS .m3u8 URLs are not accepted as analyze input. Pass TwelveLabs assetId, or a direct .mp4 (etc.) URL, or ensure the playback URL contains /assets/{24-hex}/ so the server can derive asset_id."
      : "Provide assetId (24-char hex), videoId (same id used as asset_id for indexed creatives), or videoUrl (direct media file, not HLS).";
    return NextResponse.json({ error: `Could not resolve video for Pegasus 1.5. ${hint}` }, { status: 400 });
  }

  const blobName = pathnameSemanticIabCache(categoryKey, resolvedVideo);

  try {
    const cached = await get(blobName, { access: "public" });
    if (cached?.statusCode === 200 && cached.stream) {
      const raw = await new Response(cached.stream).text();
      try {
        const cachedData = JSON.parse(raw);
        const vid =
          resolvedVideo.video.type === "asset_id"
            ? resolvedVideo.video.assetId
            : String(resolvedVideo.video.url || "").slice(0, 48);
        console.log("[DEBUG] IAB semantic blob cache hit", vid);
        return NextResponse.json(cachedData, { status: 200 });
      } catch {
        // corrupt entry — fall through and recompute
      }
    }
  } catch (blobReadErr) {
    console.warn("[adInventoryIabSemantic] blob cache read failed", blobReadErr?.message || blobReadErr);
  }

  let vectors;
  try {
    vectors = loadTaxonomyVectors();
  } catch (e) {
    return NextResponse.json({ error: e.message || "Failed to load taxonomy embeddings" }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey: openaiKey });
  const tlClient = new TwelveLabs({ apiKey });

  try {
    const created = await tlClient.analyzeAsync.tasks.create({
      modelName: "pegasus1.5",
      video: resolvedVideo.video,
      analysisMode: "time_based_metadata",
      responseFormat: {
        type: "segment_definitions",
        segmentDefinitions: [
          {
            id: "scene_classification",
            description:
              "Scene-level signals for what is advertised or shown on screen (products, brands, people, places, activities, mood). Not how the spot was filmed.",
            fields: [
              {
                name: "scene_description",
                type: "string",
                description:
                  "Two short sentences: visible products or services, brands or packaging if any, human activities and setting (indoor/outdoor, venue type), and overall tone. Do not describe cameras, editing, video production, or filmmaking unless those are literally the product being sold.",
              },
            ],
          },
        ],
      },
      minSegmentDuration: 5,
      maxSegmentDuration: 30,
    });

    const taskId = created?.taskId;
    if (!taskId) {
      return NextResponse.json({ error: "TwelveLabs did not return a task id" }, { status: 502 });
    }

    const completed = await waitForAnalyzeTask(tlClient, taskId);
    const raw = completed?.result?.data;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const scenes = parsed?.scene_classification || [];

    const sceneMatches = [];

    for (const scene of scenes) {
      const description = scene?.metadata?.scene_description;
      if (!description || typeof description !== "string") continue;

      const embeddingInput = formatSceneTextForTaxonomyEmbedding(description, { categoryKey });
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: embeddingInput,
      });
      const sceneEmbedding = embeddingResponse?.data?.[0]?.embedding || [];

      let best = null;
      let bestScore = -2;
      const taxonomyTopCandidates = [];
      const topK = 5;
      for (const node of vectors) {
        const score = cosineSimilarity(sceneEmbedding, node.embedding);
        if (score > bestScore) {
          bestScore = score;
          best = node;
        }
        pushTopCosine(taxonomyTopCandidates, {
          iab_id: node.iab_id,
          breadcrumb: node.breadcrumb,
          cosine_similarity: score,
        }, topK);
      }

      const taxonomyTiers = best?.breadcrumb ? parseTaxonomy31Breadcrumb(best.breadcrumb) : null;
      sceneMatches.push({
        start: scene.startTime ?? scene.start_time ?? scene.start,
        end: scene.endTime ?? scene.end_time ?? scene.end,
        scene_description: description,
        embeddingTextForTaxonomyMatch: embeddingInput,
        matched_iab_id: best?.iab_id || null,
        matched_breadcrumb: best?.breadcrumb || "",
        matched_rich_text: best?.rich_text || "",
        cosine_similarity: bestScore,
        taxonomyTopCandidates,
        taxonomyTiers,
      });
    }

    const iab = buildIabFromSceneMatches(sceneMatches, categoryKey);

    const tier1set = new Set(iab.map((x) => x.tier1));
    const tier2set = new Set(iab.map((x) => x.tier2));
    const tier3set = new Set(iab.map((x) => x.tier3).filter(Boolean));
    const tier4set = new Set(iab.map((x) => x.tier4).filter(Boolean));
    const taxonomyNodeIds = [...new Set(iab.map((x) => x.taxonomyNodeId).filter(Boolean))];

    const responseBody = {
      pegasusSceneFieldPrompt: {
        segmentId: "scene_classification",
        segmentDescription:
          "Scene-level signals for what is advertised or shown on screen (products, brands, people, places, activities, mood). Not how the spot was filmed.",
        sceneDescriptionField:
          "Two short sentences: visible products or services, brands or packaging if any, human activities and setting, and overall tone. Do not describe cameras, editing, video production, or filmmaking unless those are literally the product being sold.",
      },
      iab,
      taxonomyNodeIds,
      iabTopTier1: [...tier1set].slice(0, 3),
      iabTopTier2: [...tier2set].slice(0, 5),
      iabTopTier3: [...tier3set].slice(0, 5),
      iabTopTier4: [...tier4set].slice(0, 8),
      sceneMatches,
      taskId,
      pegasusModel: "pegasus1.5",
      embeddingModel: "text-embedding-3-small",
      pegasusVideoInput: {
        type: resolvedVideo.video.type,
        resolvedVia: resolvedVideo.source,
      },
    };

    try {
      await put(blobName, JSON.stringify(responseBody), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      console.log("[DEBUG] IAB semantic saved to blob", blobName.slice(0, 72));
    } catch (blobErr) {
      console.error("[DEBUG] Failed to cache IAB semantic — check BLOB_READ_WRITE_TOKEN", blobErr);
    }

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("[adInventoryIabSemantic]", err);
    return NextResponse.json(
      { error: err?.message || "Semantic IAB pipeline failed" },
      { status: 500 }
    );
  }
}
