import { NextResponse } from "next/server";
import { getTwelveLabsClient } from "../../lib/twelvelabs";

// --- 1. Cosine Similarity Helper ---
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- 2. TwelveLabs Text Embedding Helper ---
async function generateTextEmbedding(text) {
    const tl_client = getTwelveLabsClient();
    try {
        const response = await tl_client.embed.v2.create({
            inputType: 'text',
            modelName: 'marengo3.0',
            text: {
                inputText: text
            }
        });

        console.log(`[TextEmbedding] Created for "${text}". Embeddings count: ${response?.data?.length}`);

        // Adjusted for Marengo 3.0 v2 SDK output structure
        if (response.data && response.data.length > 0) {
            return response.data[0].embedding; // Changed from textEmbeddings[0].float
        }
    } catch (error) {
        console.error("Text embedding error:", error);
    }
    return null;
}

// --- 3. OpenAI Audience Evaluator ---
async function evaluateAudienceWithLLM(userInterests, formattedAdAffinities) {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("[Audience LLM] Missing OPENAI_API_KEY. Defaulting to string match.");
        // Fallback to basic string matching if no API key is provided
        // We flatten the formatted affinities back into a simple array for the fallback string match
        const flatAffinities = (typeof formattedAdAffinities === 'string'
            ? formattedAdAffinities.split('\n').filter(line => line.startsWith('-')).map(line => line.replace('- ', ''))
            : []);

        const audienceMatches = flatAffinities.filter(tag => {
            const t = tag.toLowerCase().trim();
            return userInterests.some(uTag => {
                const ut = uTag.toLowerCase().trim();
                return ut.includes(t) || t.includes(ut);
            });
        });
        if (audienceMatches.length > 0) return { score: 20, reason: `Viewer aligns with brand target (${audienceMatches.join(', ')})` };
        if (flatAffinities.length > 0) return { score: 0, reason: `Does not specifically align with brand affinities (${flatAffinities.slice(0, 3).join(', ')}).` };
        return { score: 0, reason: "Broad audience (No specific affinities requested)." };
    }

    if (!userInterests || userInterests.length === 0) {
        return { score: 0, reason: "Viewer has no listed interests to evaluate against." };
    }

    const prompt = `You are an AdTech audience matching engine.
Your ONLY job is to check for semantic or thematic overlap between Array A (User Interests) and Array B (Ad Target Affinities). 
You must NOT invent information, make assumptions, or reference any video/creative content.

Array A - User Interests: [${userInterests.join(', ')}]
Array B - Ad Target Affinities: \n${formattedAdAffinities}

RULES:
1. Look for conceptual or thematic overlap, not just exact keyword matches (e.g., "Health & Wellness" strongly aligns with "Health-Conscious Consumers", "Gaming" aligns with "Esports").
2. If there is NO direct or thematic overlap, the score MUST be 0. (Example: "Fast Food" does NOT match "Health-Conscious").
3. "score" must be an integer: 0 (No match), 10 (Partial match), or 20 (Strong thematic match).
4. "reason" MUST strictly follow this exact template if the score is > 0: "The user's interest in [Insert word from Array A] aligns with the campaign's target of [Insert word from Array B]."
5. If the score is 0, the "reason" MUST be: "The user's interests do not align with the campaign's target affinities."

Respond ONLY with a valid JSON object in this format: {"score": 0, "reason": "..."}`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Lightweight model for speed
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.1
            })
        });

        if (!response.ok) {
            console.error("[Audience LLM] API Error:", await response.text());
            return { score: 0, reason: "Semantic evaluator API error. Defaulting to zero." };
        }

        const data = await response.json();
        const parsed = JSON.parse(data.choices[0].message.content);

        return {
            score: typeof parsed.score === 'number' ? parsed.score : 0,
            reason: parsed.reason || "Evaluated by AI"
        };
    } catch (e) {
        console.error("[Audience LLM] Fetch Error:", e);
        return { score: 0, reason: "Failed to run semantic evaluation." };
    }
}

// --- 4. Hybrid Match Logic ---
async function calculateHybridAdMatch(userCohort, adData, videoSegments, adContextEmbedding) {
    let finalScore = 0;
    let reasoningLog = [];
    let bestSegment = null;

    // AI AUDIENCE MATCH (Replaces deterministic string match)
    const userInterests = userCohort.interest_signals || [];

    // Format target audience for the LLM to understand priorities
    let formattedAdAffinities = "No specific affinities requested.";
    if (adData.targetAudience && typeof adData.targetAudience === 'object') {
        const ta = adData.targetAudience;
        const parts = [];
        if (ta.highPriority?.length > 0) parts.push(`HIGH Priority:\n- ${ta.highPriority.join('\n- ')}`);
        if (ta.mediumPriority?.length > 0) parts.push(`MEDIUM Priority:\n- ${ta.mediumPriority.join('\n- ')}`);
        if (ta.lowPriority?.length > 0) parts.push(`LOW Priority:\n- ${ta.lowPriority.join('\n- ')}`);
        if (parts.length > 0) formattedAdAffinities = parts.join('\n\n');
    } else if (typeof adData.targetAudience === 'string') {
        const tags = adData.targetAudience.split(',').map(s => s.trim()).filter(Boolean);
        if (tags.length > 0) formattedAdAffinities = `Target:\n- ${tags.join('\n- ')}`;
    }

    const llmAudienceEvaluation = await evaluateAudienceWithLLM(userInterests, formattedAdAffinities);

    finalScore += llmAudienceEvaluation.score;
    const audienceMatched = llmAudienceEvaluation.score > 0; // Tracking for the AdTech logic squelch

    reasoningLog.push(`Audience Match (+${llmAudienceEvaluation.score} pts): ${llmAudienceEvaluation.reason}`);

    // Helper function for Household Income (HHI) extraction
    function getHHI(tag) {
        const match = tag.match(/HHI\s*\$(\d+)K\+/i);
        return match ? parseInt(match[1], 10) : null;
    }

    // Helper function for Age groups
    function isAgeMatch(adTag, userTag) {
        const adT = adTag.toLowerCase().trim();
        const uT = userTag.toLowerCase().trim();

        // Check if user tag is a raw number (e.g., "19")
        const uAgeMatch = uT.match(/^(\d+)$/);
        const userAge = uAgeMatch ? parseInt(uAgeMatch[1], 10) : null;

        const adultTags = ['adults', 'adult', '18+', '20s', '30s', '40s', '50s', '60s', '70s', '80s', 'senior'];
        const underageTags = ['teenagers', 'teens', 'teenager', 'teen', 'underage', 'youth', 'under 21'];

        if (adT === 'adults' || adT === 'adult') {
            if (adultTags.includes(uT)) return true;
            if (userAge !== null && userAge >= 18) return true;
        }

        if (underageTags.includes(adT)) {
            if (underageTags.includes(uT)) return true;
            if (userAge !== null && userAge < 21) return true;
        }

        return false;
    }

    // 1.5 DEMOGRAPHIC CHECK
    if (adData.targetDemographics && adData.targetDemographics.length > 0) {
        const demoMatches = adData.targetDemographics.filter(tag => {
            const adHHI = getHHI(tag);
            const t = tag.toLowerCase().trim();

            return userCohort.demographics?.some(uTag => {
                const userHHI = getHHI(uTag);
                const ut = uTag.toLowerCase().trim();

                // Special case: Both tags are HHI brackets
                if (adHHI !== null && userHHI !== null) {
                    return userHHI >= adHHI;
                }

                // Special case: Age groups (e.g., Adults matches 30s)
                if (isAgeMatch(t, ut)) {
                    return true;
                }

                // Substring matches are too dangerous for short gender/demo words (e.g., "feMALE" contains "male")
                // Enforce exact word boundary or exact match for safe demographics 
                if (t === 'male' || t === 'female' || ut === 'male' || ut === 'female') {
                    return t === ut;
                }

                return ut.includes(t) || t.includes(ut);
            });
        });

        if (demoMatches.length > 0) {
            const propScore = Math.round((demoMatches.length / adData.targetDemographics.length) * 15);
            finalScore += propScore;
            reasoningLog.push(`Demographics Match (+${propScore} pts): Viewer matches preferred demographics (${demoMatches.join(', ')})`);
        } else {
            reasoningLog.push("Demographics Match (0 pts): No overlap with preferred demographics.");
        }
    }

    if (adData.negativeDemographics && adData.negativeDemographics.length > 0) {
        const negDemoMatches = adData.negativeDemographics.filter(tag => {
            const t = tag.toLowerCase().trim();
            return userCohort.demographics?.some(uTag => {
                const ut = uTag.toLowerCase().trim();

                if (t === 'male' || t === 'female' || ut === 'male' || ut === 'female') {
                    return t === ut;
                }

                // Special case: Negative Age groups (e.g., Underage matches 19)
                if (isAgeMatch(t, ut)) {
                    return true;
                }

                // Special case: Negative Age groups (e.g., Underage matches 19)
                if (isAgeMatch(t, ut)) {
                    return true;
                }

                return ut.includes(t) || t.includes(ut);
            });
        });

        if (negDemoMatches.length > 0) {
            reasoningLog.push(`Failed: User explicitly excluded by campaign demographics (${negDemoMatches.join(', ')}).`);
            return { isEligible: false, score: 0, reasoning: reasoningLog, bestSegment: null };
        }
    }

    // 2. SEMANTIC CONTEXT MATCH (The TwelveLabs Magic)
    if (!adContextEmbedding) {
        reasoningLog.push("Contextual Placement (0 pts): Missing Ad target contexts to match against video.");
    } else if (!videoSegments || videoSegments.length === 0) {
        reasoningLog.push("Contextual Placement (0 pts): Video has no visual data to analyze.");
    } else {
        let maxScore = -1;
        let maxSeg = null;

        for (const seg of videoSegments) {
            if (!seg.vector) continue;
            // Compare the AD against the SCENE
            const score = cosineSimilarity(adContextEmbedding, seg.vector);
            if (score > maxScore) {
                maxScore = score;
                maxSeg = seg;
            }
        }

        // 1. LOG THE RAW SCORE (Crucial for debugging!)
        console.log(`[DEBUG] Raw Cosine Score against video: ${maxScore.toFixed(3)}`);

        // 2. RAISE THE FLOOR AND CEILING TO CUT OUT "NOISE"
        // Demo-Optimized Curve: 
        // 0.20 is our noise floor, 0.28 represents a "Perfect" cross-modal match.
        const minExpected = 0.20;
        const maxExpected = 0.28;

        if (maxScore > minExpected) {
            let normalizedPoints = ((maxScore - minExpected) / (maxExpected - minExpected)) * 65;
            normalizedPoints = Math.max(0, Math.min(65, Math.round(normalizedPoints))); // Cap at 65

            // 3. THE ADTECH LOGIC GATE (The Fix)
            // Check if the user completely failed the deterministic audience checks
            // We shouldn't reward them with high contextual points if they aren't the primary audience
            if (!audienceMatched) {
                // Squelch the semantic score by 80% if they aren't the target audience
                normalizedPoints = Math.round(normalizedPoints * 0.2);
                // Updated UI Text
                reasoningLog.push(`Contextual Placement (+${normalizedPoints} pts): Scene perfectly matches Ad campaign contexts, but score penalized due to zero audience alignment.`);
            } else {
                // Updated UI Text
                reasoningLog.push(`Contextual Placement (+${normalizedPoints} pts): The video's current scene perfectly matches the brand's required campaign environments.`);
            }

            finalScore += normalizedPoints;

            if (maxSeg) {
                bestSegment = {
                    start: maxSeg.startOffsetSec,
                    end: maxSeg.endOffsetSec,
                    score: maxScore
                };
            }
        } else {
            reasoningLog.push(`Contextual Placement (0 pts): Visual context does not strongly resonate with the Ad's target environments.`);
            // Don't auto-fail them if they had high audience scores, just give 0 semantic points.
        }
    }

    // 3. BRAND SAFETY CHECK (Handled on UI usually, but confirm passing status here)
    if (adData.brandSafetyGARM && adData.brandSafetyGARM.length > 0) {
        reasoningLog.push(`Warning: Subjective GARM tags detected (${adData.brandSafetyGARM.join(', ')}).`);
    }

    return {
        isEligible: finalScore > 0,
        score: finalScore,
        reasoning: reasoningLog,
        bestSegment
    };
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { userCohort, adData, videoSegments } = body;

        if (!userCohort || !adData || !videoSegments) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let result;

        // 1. Gather the Ad's Target Contexts (Fallback to a generic string if empty)
        let contextArray = [];
        if (Array.isArray(adData.targetContexts)) {
            contextArray = adData.targetContexts;
        } else if (adData.targetContexts && typeof adData.targetContexts === 'object') {
            // In case it's an object with categories
            contextArray = Object.values(adData.targetContexts).flat();
        } else if (typeof adData.targetContexts === 'string') {
            contextArray = adData.targetContexts.split(',').map(s => s.trim()).filter(Boolean);
        }

        const adQuery = contextArray.length > 0
            ? contextArray.join(', ')
            : "Commercial, advertising, brand promotion";

        // 2. Fetch vector from TwelveLabs using the AD'S CONTEXTS, not the User's
        console.log(`[Semantic Match] Generating vector for Ad Contexts: ${adQuery}`);
        const adContextEmbedding = await generateTextEmbedding(adQuery);

        if (!adContextEmbedding) {
            return NextResponse.json({ error: "Failed to generate text embedding" }, { status: 500 });
        }

        // Pass the adContextEmbedding instead of userEmbedding
        result = await calculateHybridAdMatch(userCohort, adData, videoSegments, adContextEmbedding);

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error("Affinity Matching Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}