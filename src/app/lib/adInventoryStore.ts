export interface AdCategory {
    id: string;
    slug: string;
    category: string;
    brands: string[];
    targetContexts: string[];
    exclusions: string[];
}

const STORAGE_KEY = "ad_inventory_categories";

const DEFAULT_CATEGORIES: AdCategory[] = [
    {
        id: "1",
        slug: "premium-spirits",
        category: "Premium Spirits",
        brands: ["Macallan", "Grey Goose"],
        targetContexts: ["Bar scenes", "Social gatherings", "Celebration"],
        exclusions: ["Underage", "Addiction", "Violence"],
    },
    {
        id: "2",
        slug: "automotive-truck",
        category: "Automotive (Truck)",
        brands: ["Ford F-150", "RAM"],
        targetContexts: ["Outdoor", "Construction", "Adventure"],
        exclusions: ["Urban luxury", "Sedentary"],
    },
    {
        id: "3",
        slug: "cpg-snacks",
        category: "CPG (Snacks)",
        brands: ["Doritos", "Oreo"],
        targetContexts: ["Sports viewing", "Party", "Casual hangout"],
        exclusions: ["Health/diet content"],
    },
    {
        id: "4",
        slug: "financial-services",
        category: "Financial Services",
        brands: ["Fidelity", "Schwab"],
        targetContexts: ["Business", "Planning", "Future-focused"],
        exclusions: ["Gambling", "Crime"],
    },
];

export function getCategories(): AdCategory[] {
    if (typeof window === "undefined") return DEFAULT_CATEGORIES;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
            return DEFAULT_CATEGORIES;
        }
        return JSON.parse(raw) as AdCategory[];
    } catch {
        return DEFAULT_CATEGORIES;
    }
}

export function saveCategories(cats: AdCategory[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
}

export function getCategoryBySlug(slug: string): AdCategory | undefined {
    return getCategories().find((c) => c.slug === slug);
}

function toSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function addCategory(cat: Omit<AdCategory, "id" | "slug">): AdCategory {
    const cats = getCategories();
    const newCat: AdCategory = {
        ...cat,
        id: String(Date.now()),
        slug: toSlug(cat.category),
    };
    saveCategories([...cats, newCat]);
    return newCat;
}

export function deleteCategory(slug: string): void {
    saveCategories(getCategories().filter((c) => c.slug !== slug));
}

export function updateCategoryContexts(slug: string, contexts: string[]): void {
    const cats = getCategories().map((c) =>
        c.slug === slug ? { ...c, targetContexts: contexts } : c
    );
    saveCategories(cats);
}

export function updateCategoryExclusions(slug: string, exclusions: string[]): void {
    const cats = getCategories().map((c) =>
        c.slug === slug ? { ...c, exclusions } : c
    );
    saveCategories(cats);
}
