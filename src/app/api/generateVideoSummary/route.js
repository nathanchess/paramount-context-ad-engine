import { TwelveLabs } from "twelvelabs-js";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { listAllBlobs } from "../../lib/blobList";

export const maxDuration = 120;


const summary_prompt = `
You are helping a CTV ad-ops team understand a single TV video from a show likely aired on a premium CTV platform.

Analyze the video and return ONLY a JSON object with these exact keys:

- "summary": 2-3 sentence description of what the video shows and its message.
- "proposedTitle": a concise, human-friendly title for the video.
- "targetAudience": array of 3-6 strings capturing audience affinities (e.g., "Health-Conscious", "Gen-Z", "Luxury Seekers").
- "tags": array of 5-10 short content or context tags that describe the video (visuals, themes, mood). Use lowercase, space-separated tags (e.g., "beach sunset", "family dinner").

Do not include any extra commentary or markdown. Return valid JSON only.`;


function parseAnalyzeResult(raw) {
    if (!raw) return null;

    let inner = raw.data ?? raw;
    if (typeof inner === "string") {
        try {
            inner = JSON.parse(inner);
        } catch {
            const match = inner.match(/\{[\s\S]*\}/);
            if (match) {
                try { inner = JSON.parse(match[0]); } catch { return null; }
            } else {
                return null;
            }
        }
    }
    return inner;
}

export async function POST(request) {
  const tl_client = new TwelveLabs({ apiKey: process.env.TL_API_KEY });
  const { videoId } = await request.json();

  if (!videoId) {
    return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
  }

  const parameters = {
    videoId,
    prompt: summary_prompt,
    temperature: 0.3,
  };

  try {
    const blobName = `video_summary_v2_${videoId}.json`;
    const blobs = await listAllBlobs(blobName);

    if (blobs.length > 0) {
      console.log(`[DEBUG] Found cached video summary for ${videoId} in Vercel Blob`);
      const best = blobs.reduce((a, b) =>
        new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b
      );
      const cachedRes = await fetch(best.url);
      if (cachedRes.ok) {
        const cachedData = await cachedRes.json();
        return NextResponse.json(cachedData, { status: 200 });
      }
    }

    console.log(`[DEBUG] Generating new video summary for ${videoId} via TwelveLabs Pegasus...`);
    const result = await tl_client.analyze(parameters, {
      timeoutInSeconds: 90,
    });
    const parsed = parseAnalyzeResult(result);

    if (!parsed) {
      console.error("[DEBUG] Could not parse TwelveLabs analyze result:", JSON.stringify(result).slice(0, 500));
      return NextResponse.json({ error: "Failed to parse video summary" }, { status: 500 });
    }

    try {
      await put(blobName, JSON.stringify(parsed), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      console.log(`[DEBUG] Saved video summary for ${videoId} to Vercel Blob`);
    } catch (blobErr) {
      console.error(`[DEBUG] Failed to cache video summary for ${videoId}`, blobErr);
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error("generateVideoSummary API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate video summary" },
      { status: 500 },
    );
  }
}
