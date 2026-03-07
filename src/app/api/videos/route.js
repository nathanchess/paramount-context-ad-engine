import { NextResponse } from "next/server"
import { getTwelveLabsClient, getIndexId } from "../../lib/twelvelabs"

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const targetIndex = searchParams.get("index") || "context-engine-ads";

        const indexId = await getIndexId(targetIndex);
        const client = getTwelveLabsClient();

        const videosPager = await client.indexes.listVideos(indexId);
        const videos = [];

        for await (const video of videosPager) {
            videos.push({
                id: video.id,
                title: video.title || video.filename,
                duration: video.duration,
                metadata: video.userMetadata,
            });
        }

        return NextResponse.json({ indexId, videos });
    } catch (err) {
        return NextResponse.json(
            { error: err.message || "Failed to fetch videos" },
            { status: 500 }
        );
    }
}

export async function POST(request) {

    // Pass in public video URLs and associated user metadata to add to TwelveLabs index.
    // Video URLS from Vercel Blob storage on client-side upload first.

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { videoURLs, metadata, target_index } = body;

    if (!videoURLs || !Array.isArray(videoURLs) || videoURLs.length === 0) {
        return NextResponse.json({ error: "videoURLs array required" }, { status: 400 });
    }

    let indexId;
    try {
        indexId = await getIndexId(target_index || "context-engine-ads");
    } catch (err) {
        return NextResponse.json(
            { error: `Failed to resolve index: ${err.message}` },
            { status: 500 }
        );
    }

    const client = getTwelveLabsClient();
    const totalVideos = videoURLs.length;

    // Stream progress back to the client via SSE
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()

            function send(event, data) {
                try {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
                } catch {
                    // stream may be closed by client
                }
            }

            send('progress', {
                completed: 0,
                total: totalVideos,
                percent: 0,
                message: `Starting upload of ${totalVideos} video${totalVideos !== 1 ? 's' : ''}…`,
            })

            const videoData = []

            for (let i = 0; i < videoURLs.length; i++) {
                const videoURL = videoURLs[i]

                try {
                    send('progress', {
                        completed: i,
                        total: totalVideos,
                        percent: Math.round((i / totalVideos) * 100),
                        message: `Indexing video ${i + 1} of ${totalVideos} on TwelveLabs…`,
                    })

                    const task = await client.tasks.create({
                        indexId: indexId,
                        videoUrl: videoURL,
                        userMetadata: JSON.stringify(metadata || {})
                    })

                    send('progress', {
                        completed: i,
                        total: totalVideos,
                        percent: Math.round(((i + 0.5) / totalVideos) * 100),
                        message: `Waiting for TwelveLabs to process video ${i + 1}…`,
                    })

                    const completedTask = await client.tasks.waitForDone(task.id, {
                        sleepInterval: 5
                    })

                    // Fallback in case waitForDone returns void/null
                    const finalTask = completedTask || await client.tasks.retrieve(task.id);

                    if (finalTask.status !== "ready") {
                        throw new Error(`Task ${finalTask.id} failed with status ${finalTask.status}`)
                    }

                    console.log(`Task ${finalTask.id} completed with status ${finalTask.status} and video ID ${finalTask.videoId}`)

                    const retrieveTask = await fetch(`https://api.twelvelabs.io/v1.3/indexes/${indexId}/videos/${finalTask.videoId}`, {
                        method: "GET",
                        headers: {
                            "x-api-key": process.env.TL_API_KEY,
                            "transcription": "true"
                        }
                    })

                    const retrievedVideoData = await retrieveTask.json()

                    const result = {
                        videoId: finalTask.videoId,
                        videoUrl: videoURL,
                        userMetadata: retrievedVideoData.user_metadata,
                        transcription: retrievedVideoData.transcription
                    }

                    videoData.push(result)

                    send('video_done', {
                        index: i,
                        completed: i + 1,
                        total: totalVideos,
                        percent: Math.round(((i + 1) / totalVideos) * 100),
                        video: result,
                    })

                } catch (err) {
                    console.error(`Error processing video ${i + 1}:`, err.message);
                    send('video_error', {
                        index: i,
                        videoUrl: videoURL,
                        error: err.message,
                        completed: i,
                        total: totalVideos,
                        percent: Math.round(((i + 1) / totalVideos) * 100),
                    })
                }
            }

            send('complete', {
                completed: totalVideos,
                total: totalVideos,
                percent: 100,
                videos: videoData,
            })

            controller.close()
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}