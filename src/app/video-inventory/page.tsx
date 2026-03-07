"use client";

import { useState, useRef, useEffect } from "react";

const genres = [
    "All Genres",
    "Technology",
    "Education",
    "Entertainment",
    "Sports",
    "News",
    "Music",
    "Gaming",
    "Lifestyle",
    "Documentary",
];

const samplePrompts = [
    "Find scenes with people celebrating",
    "Outdoor adventure footage with mountains",
    "Close-up product shots on a table",
    "People talking in a meeting room",
    "Sports highlights with crowd cheering",
    "Cooking or food preparation scenes",
];

const placeholderVideos = [
    { id: "1", title: "Introduction to Machine Learning", genre: "Technology", duration: "12:34" },
    { id: "2", title: "Morning Workout Routine", genre: "Lifestyle", duration: "8:15" },
    { id: "3", title: "Breaking News Compilation", genre: "News", duration: "24:02" },
    { id: "4", title: "Guitar Lessons for Beginners", genre: "Music", duration: "18:47" },
    { id: "5", title: "Championship Highlights", genre: "Sports", duration: "6:30" },
    { id: "6", title: "The Future of Space Exploration", genre: "Documentary", duration: "45:12" },
];

const searchIcon = (
    <svg viewBox="0 0 12 11.707" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.5 0C9.98528 0 12 2.01472 12 4.5C12 6.98528 9.98528 9 7.5 9C6.36252 8.99998 5.32451 8.57691 4.53223 7.88086L0.707031 11.707L0 11L3.85742 7.1416C3.31847 6.39969 3 5.48716 3 4.5C3 2.01474 5.01475 4.07169e-05 7.5 0ZM7.5 1C5.56704 1.00004 4 2.56703 4 4.5C4 6.43297 5.56704 7.99996 7.5 8C9.433 8 11 6.433 11 4.5C11 2.567 9.433 1 7.5 1Z" fill="currentColor" />
    </svg>
);

const playIcon = (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
        <path fillRule="evenodd" clipRule="evenodd" d="M5.55217 4.79058V7.20942L7.26522 6L5.55217 4.79058ZM4.5 4.315C4.5 3.65679 5.23462 3.27103 5.76926 3.64849L8.15593 5.33348C8.61469 5.65737 8.61469 6.34263 8.15593 6.66652L5.76926 8.35151C5.23462 8.72897 4.5 8.34321 4.5 7.685V4.315Z" fill="currentColor" />
    </svg>
);

export default function VideoInventoryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState("All Genres");
    const [showPrompts, setShowPrompts] = useState(false);
    const [genreOpen, setGenreOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const genreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowPrompts(false);
            }
            if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
                setGenreOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredVideos = placeholderVideos.filter((v) => {
        const matchesGenre = selectedGenre === "All Genres" || v.genre === selectedGenre;
        const matchesSearch =
            !searchQuery ||
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.genre.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesGenre && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-border-light px-8 py-6">
                <h1 className="text-[32px] font-bold tracking-[-1.5px] text-text-primary">
                    Video Inventory
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                    Search, browse, and manage your video content library.
                </p>
            </header>

            {/* ── Search + Genre Filter ─────────────────────────── */}
            <div className="px-8 pt-6 pb-2">
                <div className="flex items-center justify-between">
                    {/* ── Gradient search bar ────────────────────────── */}
                    <div ref={searchRef} className="relative flex-1 max-w-[560px]">
                        <div className={`gradient-search-wrapper ${searchFocused ? "active" : ""}`}>
                            <div className="gradient-search-inner flex items-center">
                                <span className={`pl-4 transition-colors duration-200 ${searchFocused ? "text-text-primary" : "text-text-tertiary"}`}>
                                    {searchIcon}
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search videos by content, scene, or dialogue..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowPrompts(e.target.value === "");
                                    }}
                                    onFocus={() => {
                                        setSearchFocused(true);
                                        if (!searchQuery) setShowPrompts(true);
                                    }}
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

                        {/* Sample Prompts Dropdown */}
                        {showPrompts && searchFocused && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-border-light shadow-lg z-20 animate-fade-in overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-border-light">
                                    <p className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-tertiary">
                                        Try a sample prompt
                                    </p>
                                </div>
                                {samplePrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            setSearchQuery(prompt);
                                            setShowPrompts(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors flex items-center gap-2.5"
                                    >
                                        <span className="text-text-tertiary shrink-0">{searchIcon}</span>
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Genre Dropdown (far right) ────────────────── */}
                    <div ref={genreRef} className="relative ml-auto">
                        <button
                            onClick={() => setGenreOpen(!genreOpen)}
                            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${genreOpen
                                    ? "border-gray-700 text-text-primary"
                                    : "border-border-light text-text-secondary hover:border-border-default hover:text-text-primary"
                                }
              `}
                        >
                            <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5 text-text-tertiary">
                                <path d="M4 4V5H1V4H4ZM4 1H1V5L0.897461 4.99512C0.393331 4.94379 0 4.51768 0 4V1C0 0.447715 0.447715 0 1 0H4C4.55228 0 5 0.447715 5 1V4C5 4.55228 4.55228 5 4 5V1Z" fill="currentColor" />
                                <path d="M4 11V12H1V11H4ZM4 8H1V12L0.897461 11.9951C0.393331 11.9438 0 11.5177 0 11V8C0 7.44772 0.447715 7 1 7H4C4.55228 7 5 7.44772 5 8V11C5 11.5523 4.55228 12 4 12V8Z" fill="currentColor" />
                                <path d="M11 4V5H8V4H11ZM11 1H8V5L7.89746 4.99512C7.39333 4.94379 7 4.51768 7 4V1C7 0.447715 7.44772 0 8 0H11C11.5523 0 12 0.447715 12 1V4C12 4.55228 11.5523 5 11 5V1Z" fill="currentColor" />
                                <path d="M11 11V12H8V11H11ZM11 8H8V12L7.89746 11.9951C7.39333 11.9438 7 11.5177 7 11V8C7 7.44772 7.44772 7 8 7H11C11.5523 7 12 7.44772 12 8V11C12 11.5523 11.5523 12 11 12V8Z" fill="currentColor" />
                            </svg>
                            {selectedGenre}
                            <svg viewBox="0 0 12 12" fill="none" className={`w-3 h-3 text-text-tertiary transition-transform duration-200 ${genreOpen ? "rotate-180" : ""}`}>
                                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {genreOpen && (
                            <div className="absolute top-full right-0 mt-2 w-[200px] bg-white rounded-xl border border-border-light shadow-lg z-20 animate-fade-in overflow-hidden py-1">
                                {genres.map((genre) => (
                                    <button
                                        key={genre}
                                        onClick={() => {
                                            setSelectedGenre(genre);
                                            setGenreOpen(false);
                                        }}
                                        className={`
                      w-full text-left px-4 py-2 text-sm flex items-center gap-3
                      transition-colors duration-150
                      ${selectedGenre === genre
                                                ? "text-text-primary bg-gray-50"
                                                : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                                            }
                    `}
                                    >
                                        {/* Radio indicator */}
                                        <span className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                      transition-colors duration-150
                      ${selectedGenre === genre ? "border-gray-700" : "border-gray-300"}
                    `}>
                                            {selectedGenre === genre && (
                                                <span className="w-2 h-2 rounded-full bg-gray-700" />
                                            )}
                                        </span>
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Video Grid ────────────────────────────────────── */}
            <div className="px-8 py-6">
                {filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVideos.map((video) => (
                            <div
                                key={video.id}
                                className="group rounded-2xl border border-border-light overflow-hidden hover-lift cursor-pointer"
                            >
                                <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-text-tertiary group-hover:text-text-primary group-hover:bg-white group-hover:shadow-md transition-all duration-200">
                                        {playIcon}
                                    </div>
                                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-gray-700/80 text-[10px] font-medium text-white backdrop-blur-sm">
                                        {video.duration}
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-sm font-medium text-text-primary mb-1 line-clamp-1">{video.title}</h3>
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-50 text-[11px] font-medium text-text-secondary">
                                        {video.genre}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-border-light">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <span className="text-text-tertiary">{searchIcon}</span>
                        </div>
                        <p className="text-sm font-medium text-text-primary mb-1">No results found</p>
                        <p className="text-sm text-text-tertiary">Try adjusting your search or filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
