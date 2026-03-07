"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AddCategoryModal from "../../components/AddCategoryModal";
import {
    getCategoryBySlug,
    updateCategoryContexts,
    updateCategoryExclusions,
    type AdCategory,
} from "../../lib/adInventoryStore";

const contextSuggestions = [
    "Bar scenes", "Social gatherings", "Celebration", "Outdoor", "Construction",
    "Adventure", "Sports viewing", "Party", "Casual hangout", "Business",
    "Planning", "Future-focused", "Family", "Urban", "Travel",
];

const exclusionSuggestions = [
    "Violence", "Addiction", "Underage", "Gambling", "Crime",
    "Health/diet content", "Urban luxury", "Sedentary", "Political", "Religious",
];

export default function AdCategoryDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [data, setData] = useState<AdCategory | null>(null);
    const [loading, setLoading] = useState(true);
    const [showVideoModal, setShowVideoModal] = useState(false);

    // Inline add state
    const [addingContext, setAddingContext] = useState(false);
    const [contextInput, setContextInput] = useState("");
    const [addingExclusion, setAddingExclusion] = useState(false);
    const [exclusionInput, setExclusionInput] = useState("");

    useEffect(() => {
        const cat = getCategoryBySlug(slug);
        setData(cat || null);
        setLoading(false);
    }, [slug]);

    if (loading) return <div className="min-h-screen bg-white" />;

    if (!data) {
        return (
            <div className="min-h-screen bg-white">
                <header className="border-b border-border-light px-8 py-6">
                    <Link href="/ad-inventory" className="text-sm text-text-tertiary hover:text-text-primary transition-colors mb-2 inline-flex items-center gap-1">
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Back to Ad Inventory
                    </Link>
                    <h1 className="text-[32px] font-bold tracking-[-1.5px] text-text-primary mt-2">Category Not Found</h1>
                </header>
                <div className="px-8 py-12 text-center">
                    <p className="text-sm text-text-tertiary">This ad category doesn&apos;t exist.</p>
                </div>
            </div>
        );
    }

    /* ── Context / Exclusion mutations ──────────────────── */
    function addContext(val: string) {
        const trimmed = val.trim();
        if (!trimmed || !data || data.targetContexts.includes(trimmed)) return;
        const next = [...data.targetContexts, trimmed];
        updateCategoryContexts(slug, next);
        setData({ ...data, targetContexts: next });
        setContextInput("");
        setAddingContext(false);
    }

    function removeContext(ctx: string) {
        if (!data) return;
        const next = data.targetContexts.filter((c) => c !== ctx);
        updateCategoryContexts(slug, next);
        setData({ ...data, targetContexts: next });
    }

    function addExclusion(val: string) {
        const trimmed = val.trim();
        if (!trimmed || !data || data.exclusions.includes(trimmed)) return;
        const next = [...data.exclusions, trimmed];
        updateCategoryExclusions(slug, next);
        setData({ ...data, exclusions: next });
        setExclusionInput("");
        setAddingExclusion(false);
    }

    function removeExclusion(exc: string) {
        if (!data) return;
        const next = data.exclusions.filter((e) => e !== exc);
        updateCategoryExclusions(slug, next);
        setData({ ...data, exclusions: next });
    }

    const unusedContextSuggestions = contextSuggestions.filter(
        (s) => !data.targetContexts.includes(s) && s.toLowerCase().includes(contextInput.toLowerCase())
    ).slice(0, 5);

    const unusedExclusionSuggestions = exclusionSuggestions.filter(
        (s) => !data.exclusions.includes(s) && s.toLowerCase().includes(exclusionInput.toLowerCase())
    ).slice(0, 5);

    return (
        <div className="min-h-screen bg-white">
            {/* ── Header ─────────────────────────────────────────── */}
            <header className="border-b border-border-light px-8 py-6">
                <div className="flex items-start justify-between">
                    <div>
                        <Link href="/ad-inventory" className="text-sm text-text-tertiary hover:text-text-primary transition-colors mb-2 inline-flex items-center gap-1">
                            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Back to Ad Inventory
                        </Link>
                        <h1 className="text-[32px] font-bold tracking-[-1.5px] text-text-primary mt-2">{data.category}</h1>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {data.brands.map((brand) => (
                                <span key={brand} className="px-2.5 py-0.5 rounded-full bg-gray-50 text-[11px] font-medium text-text-secondary">
                                    {brand}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right side: Stats + Add Video */}
                    <div className="flex items-center gap-4 shrink-0 mt-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-text-secondary">
                            <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                                <path fillRule="evenodd" clipRule="evenodd" d="M5.55217 4.79058V7.20942L7.26522 6L5.55217 4.79058ZM4.5 4.315C4.5 3.65679 5.23462 3.27103 5.76926 3.64849L8.15593 5.33348C8.61469 5.65737 8.61469 6.34263 8.15593 6.66652L5.76926 8.35151C5.23462 8.72897 4.5 8.34321 4.5 7.685V4.315Z" fill="currentColor" />
                            </svg>
                            <span className="text-xs font-medium">{data.videoCount} videos</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-text-secondary">
                            <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                                <path d="M6 3.5V6.5L8 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-xs font-medium">{data.totalDuration}</span>
                        </div>
                        <button
                            onClick={() => setShowVideoModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border-light text-sm font-medium text-text-primary hover:border-border-default hover:bg-gray-50 transition-all duration-200"
                        >
                            <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            Add Video
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Content (full width) ───────────────────────────── */}
            <div className="px-8 py-6 space-y-8">
                {/* Target Contexts */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-sm font-semibold text-text-primary">Target Contexts</h2>
                        {!addingContext && (
                            <button
                                onClick={() => setAddingContext(true)}
                                className="text-xs text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1"
                            >
                                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                Add
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-text-tertiary mb-3 leading-relaxed">
                        TwelveLabs will prioritize ad placement during scenes matching these contexts and recommend optimal timestamps based on video content and viewer metadata.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        {data.targetContexts.map((ctx) => (
                            <span key={ctx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mb-green-light/40 text-xs font-medium text-mb-green-dark group/tag">
                                {ctx}
                                <button onClick={() => removeContext(ctx)} className="opacity-0 group-hover/tag:opacity-100 transition-opacity hover:text-text-primary">
                                    <svg viewBox="0 0 8 8" fill="none" className="w-2.5 h-2.5"><path d="M6 2L2 6M2 2L6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                </button>
                            </span>
                        ))}
                    </div>
                    {addingContext && (
                        <div className="mt-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    value={contextInput}
                                    onChange={(e) => setContextInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addContext(contextInput); } if (e.key === "Escape") { setAddingContext(false); setContextInput(""); } }}
                                    placeholder="Type and press Enter..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-default transition-colors"
                                />
                                <button onClick={() => { setAddingContext(false); setContextInput(""); }} className="text-xs text-text-tertiary hover:text-text-primary transition-colors">Cancel</button>
                            </div>
                            {unusedContextSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {unusedContextSuggestions.map((s) => (
                                        <button key={s} onClick={() => addContext(s)} className="px-2.5 py-1 rounded-full border border-border-light text-[11px] font-medium text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors">
                                            + {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Exclusions */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-sm font-semibold text-text-primary">Exclusions</h2>
                        {!addingExclusion && (
                            <button
                                onClick={() => setAddingExclusion(true)}
                                className="text-xs text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1"
                            >
                                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                Add
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-text-tertiary mb-3 leading-relaxed">
                        Videos containing these themes will be excluded from ad placement to protect brand safety and align with campaign guidelines.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        {data.exclusions.map((exc) => (
                            <span key={exc} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mb-pink-light/40 text-xs font-medium text-mb-pink-dark group/tag">
                                {exc}
                                <button onClick={() => removeExclusion(exc)} className="opacity-0 group-hover/tag:opacity-100 transition-opacity hover:text-text-primary">
                                    <svg viewBox="0 0 8 8" fill="none" className="w-2.5 h-2.5"><path d="M6 2L2 6M2 2L6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                </button>
                            </span>
                        ))}
                    </div>
                    {addingExclusion && (
                        <div className="mt-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    autoFocus
                                    value={exclusionInput}
                                    onChange={(e) => setExclusionInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExclusion(exclusionInput); } if (e.key === "Escape") { setAddingExclusion(false); setExclusionInput(""); } }}
                                    placeholder="Type and press Enter..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-border-light bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-default transition-colors"
                                />
                                <button onClick={() => { setAddingExclusion(false); setExclusionInput(""); }} className="text-xs text-text-tertiary hover:text-text-primary transition-colors">Cancel</button>
                            </div>
                            {unusedExclusionSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {unusedExclusionSuggestions.map((s) => (
                                        <button key={s} onClick={() => addExclusion(s)} className="px-2.5 py-1 rounded-full border border-border-light text-[11px] font-medium text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors">
                                            + {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Videos — full width */}
                <div>
                    <h2 className="text-sm font-semibold text-text-primary mb-3">Videos</h2>
                    <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-border-light">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <svg viewBox="0 0 12 12" fill="none" className="w-5 h-5 text-text-tertiary">
                                <path fillRule="evenodd" clipRule="evenodd" d="M5.55217 4.79058V7.20942L7.26522 6L5.55217 4.79058ZM4.5 4.315C4.5 3.65679 5.23462 3.27103 5.76926 3.64849L8.15593 5.33348C8.61469 5.65737 8.61469 6.34263 8.15593 6.66652L5.76926 8.35151C5.23462 8.72897 4.5 8.34321 4.5 7.685V4.315Z" fill="currentColor" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-text-primary mb-1">{data.videoCount} videos uploaded</p>
                        <p className="text-sm text-text-tertiary">Video management will be available once the API is connected.</p>
                    </div>
                </div>
            </div>

            {/* Add Video Modal (video-only mode) */}
            <AddCategoryModal
                open={showVideoModal}
                onClose={() => setShowVideoModal(false)}
                videoOnly
                categoryName={data.category}
                categoryContexts={data.targetContexts}
                categoryExclusions={data.exclusions}
            />
        </div>
    );
}
