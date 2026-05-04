/**
 * Canonical Pegasus prompt for ad-inventory detail pages and warm-cache.
 * Keep in sync with any copy embedded in API routes that key blob caches.
 */
export const AD_INVENTORY_DETAIL_ANALYZE_PROMPT = `Analyze this ad video. Return a JSON object with these exact keys:
            - "summary": 2-3 sentence description of what the ad shows and its message
            - "company": the brand or company featured in this ad
            - "proposedTitle": a compelling, concise ad title
            - "recommendedContexts": array of 3-5 literal visual and audio scene tags that you can actually see or hear (e.g., "Beach", "Sunny Sky", "Cocktails", "Friends Laughing"). Do not use abstract concepts.
            - "negativeCampaignContexts": array of 2-3 negative campaign contexts or settings to avoid for this specific ad (e.g. "Indoor Settings", "Negative Reviews", "Gloomy Weather").
            - "brandSafetyGARM": array of 1-3 strictly defined GARM (Global Alliance for Responsible Media) brand safety exclusions present or bordering in this video. Only use terms like: "Violence", "Underage", "Hate Speech", "Tragedy", "Crime", "Drugs", "Adult Content". If absolutely clean, return [].
            - "targetDemographics": array of 2-4 strings describing the target age, gender, and household income (e.g., "Male", "30s", "HHI $100K+").
            - "negativeDemographics": array of 1-3 strings describing demographics who should NOT see this ad (e.g., "Teenagers", "Underage").
            - "targetAudience": Object with 3 string arrays: "highPriority" (2-3 items), "mediumPriority" (1-2 items), and "lowPriority" (1-2 items). These are target audience affinities (e.g., Luxury, Spirits, Gen-Z).
            - "timelineMarkers": array of 3-6 objects with { "timestampSec": number, "label": short label, "reasoning": why this moment is relevant for ad targeting }

            Do not include keys for IAB taxonomy; those are filled separately.

            Return ONLY valid JSON, no markdown fences.`;
