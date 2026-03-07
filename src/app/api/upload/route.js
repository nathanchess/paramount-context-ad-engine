import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const blob = await put(file.name, file, {
            access: 'public',
            addRandomSuffix: true,
        });

        return NextResponse.json({ url: blob.url, pathname: blob.pathname });
    } catch (error) {
        console.error('Blob upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        );
    }
}