import { TwelveLabs } from "twelvelabs-js"
import { NextResponse } from "next/server"
import { get, put } from '@vercel/blob';
import { pathnameAnalyzeCache } from "../../lib/adInventoryBlobPathnames.js";

export const maxDuration = 120;


export async function POST(request) {
    const tl_client = new TwelveLabs({ apiKey: process.env.TL_API_KEY });
    const { videoId, prompt, response_format } = await request.json()

    if (!videoId) {
        return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    if (!prompt) {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }
    if (String(prompt).length > 12000) {
        return NextResponse.json({ error: "Prompt too long" }, { status: 400 })
    }

    const parameters = {
        videoId: videoId,
        prompt: prompt,
        temperature: 0.2
    }

    if (response_format) {
        parameters.response_format = response_format
    }

    try {
        // 1. Serve from Vercel Blob if this exact analysis was stored before (pathname lookup, not list scan)
        const blobName = pathnameAnalyzeCache(videoId, prompt, response_format, parameters.temperature);

        const cached = await get(blobName, { access: 'public' });
        if (cached?.statusCode === 200 && cached.stream) {
            const raw = await new Response(cached.stream).text();
            try {
                const cachedData = JSON.parse(raw);
                console.log(`[DEBUG] Blob cache hit for ${videoId}`);
                return NextResponse.json(cachedData, { status: 200 });
            } catch {
                // corrupt cache object — fall through and re-analyze
            }
        }

        // 2. Not cached - Generate from TwelveLabs
        console.log(`[DEBUG] Generating new analysis for ${videoId} via TwelveLabs...`);
        const result = await tl_client.analyze(parameters, {
            timeoutInSeconds: 90,
        })

        // 3. Save to Vercel Blob for future loads
        try {
            await put(blobName, JSON.stringify(result), {
                access: 'public',
                addRandomSuffix: false,
                allowOverwrite: true,
                contentType: 'application/json'
            });
            console.log(`[DEBUG] Saved analysis for ${videoId} to Vercel Blob`);
        } catch (blobErr) {
            console.error(`[DEBUG] Failed to cache analysis for ${videoId} - Check BLOB_READ_WRITE_TOKEN`, blobErr);
        }

        return NextResponse.json(result, { status: 200 })
    } catch (error) {
        console.error("Analyze API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to analyze video" }, { status: 500 });
    }
}