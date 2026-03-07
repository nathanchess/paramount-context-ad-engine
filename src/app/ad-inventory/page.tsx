"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import AddCategoryModal from "../components/AddCategoryModal";
import { getCategories, type AdCategory } from "../lib/adInventoryStore";

const searchIcon = (
    <svg viewBox="0 0 12 11.707" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.5 0C9.98528 0 12 2.01472 12 4.5C12 6.98528 9.98528 9 7.5 9C6.36252 8.99998 5.32451 8.57691 4.53223 7.88086L0.707031 11.707L0 11L3.85742 7.1416C3.31847 6.39969 3 5.48716 3 4.5C3 2.01474 5.01475 4.07169e-05 7.5 0ZM7.5 1C5.56704 1.00004 4 2.56703 4 4.5C4 6.43297 5.56704 7.99996 7.5 8C9.433 8 11 6.433 11 4.5C11 2.567 9.433 1 7.5 1Z" fill="currentColor" />
    </svg>
);

export default function AdInventoryPage() {
    const [categories, setCategories] = useState<AdCategory[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Load from localStorage on mount + when modal closes
    useEffect(() => {
        setCategories(getCategories());
    }, []);

    function refreshCategories() {
        setCategories(getCategories());
    }

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredAds = categories.filter((ad) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            ad.category.toLowerCase().includes(q) ||
            ad.brands.some((b) => b.toLowerCase().includes(q)) ||
            ad.targetContexts.some((c) => c.toLowerCase().includes(q))
        );
    });

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-border-light px-8 py-6">
                <h1 className="text-[32px] font-bold tracking-[-1.5px] text-text-primary">
                    Ad Inventory
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                    Manage and match ads to your video content.
                </p>
            </header>

            {/* ── Search Bar + Add Category ─────────────────────── */}
            <div className="px-8 pt-6 pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex-1 max-w-[560px]">
                        <div className={`gradient-search-wrapper ${searchFocused ? "active" : ""}`}>
                            <div className="gradient-search-inner flex items-center">
                                <span className={`pl-4 transition-colors duration-200 ${searchFocused ? "text-text-primary" : "text-text-tertiary"}`}>
                                    {searchIcon}
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search ads by category, brand, or context..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                    className="w-full px-3 py-3 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="pr-4 text-text-tertiary hover:text-text-primary transition-colors"
                                    >
                                        <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                                            <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-light text-sm font-medium text-text-primary hover:border-border-default hover:bg-gray-50 transition-all duration-200"
                    >
                        <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Add Category
                    </button>
                </div>
            </div>

            {/* ── Ad Cards Grid ─────────────────────────────────── */}
            <div className="px-8 py-6">
                {filteredAds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredAds.map((ad) => (
                            <div key={ad.id} className="relative group">
                                <Link
                                    href={`/ad-inventory/${ad.slug}`}
                                    className="block relative rounded-2xl border border-border-light p-6 pb-10 hover-lift cursor-pointer transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-base font-semibold text-text-primary mb-1">{ad.category}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {ad.brands.map((brand) => (
                                                    <span key={brand} className="px-2.5 py-0.5 rounded-full bg-gray-50 text-[11px] font-medium text-text-secondary">
                                                        {brand}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 shrink-0" />
                                    </div>

                                    <div className="mb-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary mb-2">Target contexts</p>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {ad.targetContexts.map((ctx) => (
                                                <span key={ctx} className="px-2.5 py-1 rounded-full bg-mb-green-light/40 text-[11px] font-medium text-mb-green-dark">{ctx}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary mb-2">Exclusions</p>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {ad.exclusions.map((exc) => (
                                                <span key={exc} className="px-2.5 py-1 rounded-full bg-mb-pink-light/40 text-[11px] font-medium text-mb-pink-dark">{exc}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="absolute bottom-3 right-4 flex items-center gap-3 text-text-tertiary">
                                        <span className="flex items-center gap-1 text-[11px]">
                                            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path fillRule="evenodd" clipRule="evenodd" d="M5.55217 4.79058V7.20942L7.26522 6L5.55217 4.79058ZM4.5 4.315C4.5 3.65679 5.23462 3.27103 5.76926 3.64849L8.15593 5.33348C8.61469 5.65737 8.61469 6.34263 8.15593 6.66652L5.76926 8.35151C5.23462 8.72897 4.5 8.34321 4.5 7.685V4.315Z" fill="currentColor" /></svg>
                                            {ad.videoCount}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px]">
                                            <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" /><path d="M6 3.5V6.5L8 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            {ad.totalDuration}
                                        </span>
                                    </div>
                                </Link>

                                {/* Actions Menu */}
                                <div className="absolute top-6 right-6" ref={openMenuId === ad.id ? menuRef : undefined}>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === ad.id ? null : ad.id);
                                        }}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-gray-100 transition-all duration-200"
                                    >
                                        <svg viewBox="0 0 4 16" fill="currentColor" className="w-3 h-4">
                                            <circle cx="2" cy="2" r="1.5" />
                                            <circle cx="2" cy="8" r="1.5" />
                                            <circle cx="2" cy="14" r="1.5" />
                                        </svg>
                                    </button>

                                    {openMenuId === ad.id && (
                                        <div className="absolute top-full right-0 mt-1 w-[160px] bg-white rounded-xl border border-border-light shadow-lg z-30 animate-fade-in overflow-hidden py-1">
                                            {[
                                                { label: "View Videos", icon: "M5.55217 4.79V7.21L7.265 6L5.55217 4.79ZM4.5 4.315C4.5 3.657 5.235 3.271 5.77 3.649L8.156 5.334C8.615 5.657 8.615 6.343 8.156 6.667L5.77 8.352C5.235 8.729 4.5 8.343 4.5 7.685V4.315Z" },
                                                { label: "Edit Name", icon: "M8.5 1.5L10.5 3.5 4 10H2V8L8.5 1.5Z" },
                                                { label: "Edit Rules", icon: "M1 3h10M1 6h10M1 9h6" },
                                                { label: "Delete", icon: "M2 3h8M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M5 5.5v4M7 5.5v4M3 3l.5 7a1 1 0 001 1h3a1 1 0 001-1L9 3", danger: true },
                                            ].map((action) => (
                                                <button
                                                    key={action.label}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setOpenMenuId(null);
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2 text-sm flex items-center gap-2.5 transition-colors duration-150
                            ${(action as { danger?: boolean }).danger
                                                            ? "text-red-500 hover:bg-red-50"
                                                            : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                                                        }
                          `}
                                                >
                                                    <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5 shrink-0">
                                                        <path d={action.icon} stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                                    </svg>
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-border-light">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <span className="text-text-tertiary">{searchIcon}</span>
                        </div>
                        <p className="text-sm font-medium text-text-primary mb-1">No matching ads</p>
                        <p className="text-sm text-text-tertiary">Try adjusting your search query.</p>
                    </div>
                )}
            </div>

            <AddCategoryModal
                open={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    refreshCategories();
                }}
            />
        </div>
    );
}
