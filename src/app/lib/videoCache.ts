"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ── Types ──────────────────────────────────────────────── */
export interface CachedVideo {
    id: string;
    hls?: { videoUrl?: string; thumbnailUrls?: string[] };
    systemMetadata?: {
        filename?: string; duration?: number; width?: number; height?: number; fps?: number; size?: number;
    };
    userMetadata?: string | null;
}

interface CacheEntry {
    videos: CachedVideo[];
    timestamp: number;           // Date.now() when cached
}

/* ── Config ─────────────────────────────────────────────── */
const CACHE_KEY_PREFIX = "tl_video_cache_v2_";
const STALE_MS = 7 * 24 * 60 * 60 * 1000;  // 7 days — refetch in background after this

/* ── Low-level localStorage helpers ─────────────────────── */
function getCacheKey(index: string): string {
    return `${CACHE_KEY_PREFIX}${index}`;
}

function readCache(index: string): CacheEntry | null {
    try {
        const raw = localStorage.getItem(getCacheKey(index));
        if (!raw) return null;
        return JSON.parse(raw) as CacheEntry;
    } catch { return null; }
}

function writeCache(index: string, videos: CachedVideo[]): void {
    try {
        const entry: CacheEntry = { videos, timestamp: Date.now() };
        localStorage.setItem(getCacheKey(index), JSON.stringify(entry));
    } catch (err) {
        // localStorage might be full — silently fail, data still works in-memory
        console.warn("[videoCache] Could not write to localStorage:", err);
    }
}

/**
 * Invalidate (clear) the cache for a specific index.
 * Call this after a successful video upload so the next
 * page load fetches fresh data.
 */
export function invalidateVideoCache(index: string = "tl-context-engine-ads"): void {
    try {
        localStorage.removeItem(getCacheKey(index));
    } catch { /* noop */ }
}

/* ── React Hook ─────────────────────────────────────────── */
/**
 * useVideos — returns cached video data instantly + refreshes in background.
 *
 * Flow:
 * 1. On mount, check localStorage for cached data.
 *    - If found → set videos immediately, set loading=false.
 *    - If stale or missing → also kick off a background fetch.
 * 2. Background fetch updates both state and cache.
 * 3. `refresh()` can be called manually (e.g. after upload).
 */
export function useVideos(index: string = "tl-context-engine-ads") {
    const [videos, setVideos] = useState<CachedVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const fetchingRef = useRef(false);

    // Fetch from API and update cache + state
    const fetchFresh = useCallback(async (showLoading: boolean) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        if (showLoading) setLoading(true);

        try {
            const res = await fetch(`/api/videos?index=${encodeURIComponent(index)}`);
            if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
            const data: CachedVideo[] = await res.json();
            writeCache(index, data);
            setVideos(data);
        } catch (err) {
            console.error("[useVideos] Fetch error:", err);
        }

        setLoading(false);
        fetchingRef.current = false;
    }, [index]);

    // On mount: read cache, decide whether to fetch
    useEffect(() => {
        const cached = readCache(index);

        if (cached && cached.videos.length > 0) {
            // Serve cached data immediately
            setVideos(cached.videos);
            setLoading(false);

            // If stale, refresh in background (no loading spinner)
            const age = Date.now() - cached.timestamp;
            if (age > STALE_MS) {
                fetchFresh(false);
            }
        } else {
            // No cache — must fetch with loading spinner
            fetchFresh(true);
        }
    }, [index, fetchFresh]);

    /** Force a fresh fetch (e.g. after upload). Shows loading state. */
    const refresh = useCallback(() => {
        invalidateVideoCache(index);
        return fetchFresh(true);
    }, [index, fetchFresh]);

    return { videos, loading, refresh };
}
