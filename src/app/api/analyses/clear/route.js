import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export async function POST() {
    try {
        const { blobs } = await list({ prefix: 'analysis_' });
        const blobUrls = blobs.map(b => b.url);

        if (blobUrls.length > 0) {
            await del(blobUrls);
            console.log(`[Cache Clear] Deleted ${blobUrls.length} cached analysis blobs.`);
        } else {
            console.log('[Cache Clear] No cached analysis blobs found to delete.');
        }

        return NextResponse.json({ success: true, deletedCount: blobUrls.length }, { status: 200 });
    } catch (error) {
        console.error('[Cache Clear] Error deleting blobs:', error);
        return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
    }
}
