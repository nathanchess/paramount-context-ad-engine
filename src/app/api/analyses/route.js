import { NextResponse } from 'next/server';
import { listAllBlobs } from '../../lib/blobList';

export const dynamic = 'force-dynamic';

const ANALYSIS_V5_PREFIX = 'analysis_v5_';
/** Matches blob pathname: analysis_v5_<videoId>_<contractHash>.json */
const V5_VIDEO_ID_RE = /^analysis_v5_([^_]+)_/;

function parseAnalysisPayload(rawResult) {
    let parsed = rawResult;
    if (typeof rawResult === 'string' || rawResult?.data || rawResult?.text) {
        const rawStr =
            typeof rawResult === 'string'
                ? rawResult
                : (rawResult.data || rawResult.text || JSON.stringify(rawResult));
        const jsonMatch = rawStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                parsed = JSON.parse(jsonMatch[0]);
            } catch {
                return null;
            }
        }
    }
    return parsed && typeof parsed === 'object' ? parsed : null;
}

export async function GET() {
    try {
        const blobs = await listAllBlobs(ANALYSIS_V5_PREFIX);
        const bestByVideoId = new Map();

        for (const blob of blobs) {
            const pathname = blob.pathname || '';
            const match = pathname.match(V5_VIDEO_ID_RE);
            const videoId = match?.[1];
            if (!videoId) continue;

            const prior = bestByVideoId.get(videoId);
            const t = new Date(blob.uploadedAt).getTime();
            if (!prior || t > new Date(prior.uploadedAt).getTime()) {
                bestByVideoId.set(videoId, blob);
            }
        }

        const winners = [...bestByVideoId.values()];
        const analysisMap = {};

        await Promise.all(
            winners.map(async (blob) => {
                const pathname = blob.pathname || '';
                const match = pathname.match(V5_VIDEO_ID_RE);
                const videoId = match?.[1];
                if (!videoId) return;

                try {
                    const req = await fetch(blob.url);
                    if (!req.ok) return;
                    const rawResult = await req.json();
                    const parsed = parseAnalysisPayload(rawResult);
                    if (parsed) {
                        analysisMap[videoId] = parsed;
                    }
                } catch {
                    // ignore individual failures
                }
            })
        );

        return NextResponse.json(analysisMap, { status: 200 });
    } catch (error) {
        console.error('Failed to list or fetch analyses:', error);
        return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }
}
