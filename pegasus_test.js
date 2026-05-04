
const fs = require('fs');
const path = require('path');
const { TwelvelabsApiClient } = require('twelvelabs-js');
const { OpenAI } = require('openai');
require('dotenv').config();

const { formatSceneTextForTaxonomyEmbedding } = require(path.join(
    __dirname,
    'src',
    'app',
    'lib',
    'taxonomySceneEmbeddingText.js'
));

// REPLACE HERE.
const TL_API_KEY = process.env.TL_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const TL_ASSET_ID = process.env.TL_ASSET_ID || '';

const IAB_EMBED_DB_PATH = 'C:/Users/natha/OneDrive/Desktop/Coding/Projects/Consulting/TwelveLabs/contextual-ad-engine/taxonomy_embeds.json';
const IAB_CSV_PATH = 'C:/Users/natha/OneDrive/Desktop/Coding/Projects/Consulting/TwelveLabs/contextual-ad-engine/public/Content Taxonomy 3.1.csv';

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
})

const tl_client = new TwelvelabsApiClient({
    apiKey: TL_API_KEY,
})

function loadIABCSV(csv_path) {
    const csv = fs.readFileSync(csv_path, 'utf8');
    const lines = csv.split('\n');

    let IAB_DATA = {};
    let nodeMap = {}; // Temporary dictionary to hold all rows for relationship tracing

    // PASS 1: Register all rows and initialize Tier 1 categories
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = line.split(',');
        const id = values[0]?.trim();
        const parentId = values[1]?.trim();
        const name = values[2]?.trim();

        if (!id) continue;

        // Store every row in the temporary map
        nodeMap[id] = { id, parentId, name };

        // If there is no parent ID, it is a root Tier 1 category
        if (!parentId) {
            IAB_DATA[id] = {
                tier1: name,
                tier2: [],
                tier3: [],
                tier4: [], // Included based on the columns visible in your image
                code: id
            };
        }
    }

    // PASS 2: Trace lineage and place Tier 2/3/4 items into their root Tier 1 parent
    for (const id in nodeMap) {
        const node = nodeMap[id];
        
        // Skip Tier 1 nodes as they are already the root keys
        if (!node.parentId) continue; 

        // Trace up the tree to find the root Tier 1 ID and determine the tier depth
        let current = node;
        let depth = 1;
        
        while (current.parentId && nodeMap[current.parentId]) {
            current = nodeMap[current.parentId];
            depth++;
        }

        const rootTier1Id = current.id;

        // Push the child node into the correct array of its Tier 1 root
        if (IAB_DATA[rootTier1Id]) {
            const childObject = { 
                id: node.id, 
                parentId: node.parentId, 
                name: node.name 
            };
            
            if (depth === 2) {
                IAB_DATA[rootTier1Id].tier2.push(childObject);
            } else if (depth === 3) {
                IAB_DATA[rootTier1Id].tier3.push(childObject);
            } else if (depth === 4) {
                IAB_DATA[rootTier1Id].tier4.push(childObject);
            }
        }
    }

    return IAB_DATA;
}

async function generate_rich_node(hierarchy_data) {
    const hierarchyNames = hierarchy_data?.hierarchyNames || [];
    const breadcrumb = hierarchyNames.join(' > ');
    const fallbackName = hierarchyNames[hierarchyNames.length - 1] || hierarchy_data?.name || 'unknown category';

    const prompt = [
        'Generate exactly 10 specific keyword phrases for this IAB hierarchy node.',
        'Requirements:',
        '- Must be specific to this exact hierarchy meaning',
        '- Include close synonyms or adjacent concepts',
        '- No generic filler terms like "content", "topic", "audience", "insights", "industry"',
        '- 2 to 5 words each',
        '- Return ONLY JSON: {"keywords":["...", "..."]}',
        `Hierarchy: ${breadcrumb}`
    ].join('\n');

    let keywords = [];
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });
        const raw = response?.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(raw);
        keywords = Array.isArray(parsed?.keywords)
            ? parsed.keywords
                .map((k) => (typeof k === 'string' ? k.trim() : ''))
                .filter((k) => k.length > 0)
            : [];
    } catch (error) {
        console.warn(`Keyword enrichment fallback for ${breadcrumb}:`, error?.message || error);
    }

    if (keywords.length < 10) {
        const fallback = [
            fallbackName,
            ...hierarchyNames.slice().reverse(),
            `${fallbackName} trends`,
            `${fallbackName} techniques`,
            `${fallbackName} styles`,
            `${fallbackName} performances`,
            `${fallbackName} communities`,
            `${fallbackName} culture`,
            `${fallbackName} competitions`,
            `${fallbackName} productions`
        ]
            .map((k) => String(k).trim())
            .filter((k) => k.length > 0);
        keywords = Array.from(new Set([...keywords, ...fallback])).slice(0, 10);
    } else {
        keywords = keywords.slice(0, 10);
    }

    // Keep this purely semantic so cosine similarity prioritizes topic content.
    const rich_text = `Hierarchy: ${breadcrumb}. Keywords: ${keywords.join(', ')}.`;
    return {
        iab_id: hierarchy_data?.id,
        breadcrumb,
        rich_text,
        embedding: [],
    };

}

async function asyncPool(poolLimit, array, iteratorFn) {
    const ret = [];
    const executing = [];
    for (const item of array) {
        const p = Promise.resolve().then(() => iteratorFn(item));
        ret.push(p);
        if (poolLimit <= array.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= poolLimit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(ret);
}

async function embed_IAB_DATA() {
    const IAB_DATA = loadIABCSV(IAB_CSV_PATH);
    const embedNodeLimit = Number(process.env.EMBED_NODE_LIMIT || 0);
    const enrichConcurrency = Number(process.env.ENRICH_CONCURRENCY || 8);
    const forceRegenerate = String(process.env.FORCE_REGENERATE || '').toLowerCase() === 'true';
    const allNodes = [];
    const nodeOrder = [];

    for (const tier1Id in IAB_DATA) {
        const root = IAB_DATA[tier1Id];
        const localNodes = {
            [tier1Id]: { id: tier1Id, parentId: null, name: root.tier1, tier: 1 }
        };

        for (const node of root.tier2) {
            localNodes[node.id] = { ...node, tier: 2 };
        }
        for (const node of root.tier3) {
            localNodes[node.id] = { ...node, tier: 3 };
        }
        for (const node of root.tier4) {
            localNodes[node.id] = { ...node, tier: 4 };
        }

        const buildHierarchy = (nodeId) => {
            const ids = [];
            const names = [];
            let current = localNodes[nodeId];
            while (current) {
                ids.unshift(current.id);
                names.unshift(current.name);
                current = current.parentId ? localNodes[current.parentId] : null;
            }
            return { ids, names };
        };

        for (const nodeId in localNodes) {
            if (embedNodeLimit > 0 && allNodes.length >= embedNodeLimit) break;
            const node = localNodes[nodeId];
            const hierarchy = buildHierarchy(nodeId);
            allNodes.push({
                id: node.id,
                name: node.name,
                tier: node.tier,
                hierarchyIds: hierarchy.ids,
                hierarchyNames: hierarchy.names
            });
            nodeOrder.push(node.id);
        }
        if (embedNodeLimit > 0 && allNodes.length >= embedNodeLimit) break;
    }

    const existingById = new Map();
    if (!forceRegenerate && fs.existsSync(IAB_EMBED_DB_PATH)) {
        try {
            const existingRaw = fs.readFileSync(IAB_EMBED_DB_PATH, 'utf8').trim();
            const parsedExisting = existingRaw ? JSON.parse(existingRaw) : [];
            const existingRows = Array.isArray(parsedExisting)
                ? parsedExisting
                : (Array.isArray(parsedExisting?.vectors) ? parsedExisting.vectors : []);

            for (const row of existingRows) {
                if (!row) continue;

                const rowId = typeof row.iab_id === 'number' ? String(row.iab_id) : row.iab_id;
                const rowRichText =
                    typeof row.rich_text === 'string'
                        ? row.rich_text
                        : (typeof row.node_data === 'string' ? row.node_data : '');

                if (
                    typeof rowId === 'string' &&
                    rowId.length > 0 &&
                    Array.isArray(row.embedding) &&
                    row.embedding.length > 0 &&
                    typeof rowRichText === 'string' &&
                    rowRichText.length > 0
                ) {
                    existingById.set(rowId, {
                        ...row,
                        iab_id: rowId,
                        rich_text: rowRichText
                    });
                }
            }
        } catch (error) {
            console.warn('Could not parse existing taxonomy_embeds.json, rebuilding:', error?.message || error);
        }
    }

    const missingNodes = allNodes.filter((node) => !existingById.has(node.id));
    if (missingNodes.length === 0 && existingById.size >= allNodes.length) {
        console.log(`Using existing embeddings (${existingById.size} nodes), no regeneration needed.`);
        return Array.from(existingById.values());
    }

    console.log(`Reusing ${existingById.size} cached nodes, generating ${missingNodes.length} missing nodes...`);
    const enrichedMissing = await asyncPool(enrichConcurrency, missingNodes, async (node) => {
        const enriched = await generate_rich_node(node);
        console.log(`Prepared node ${node.id} (${node.name})`);
        return enriched;
    });

    const vectorDb = [];
    for (const row of enrichedMissing) vectorDb.push(row);

    const chunkSize = 100;
    for (let i = 0; i < vectorDb.length; i += chunkSize) {
        const chunk = vectorDb.slice(i, i + chunkSize);
        if (chunk.length === 0) break;
        const toEmbed = chunk.map((entry) => entry.rich_text);
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: toEmbed
        });
        for (let j = 0; j < chunk.length; j++) {
            chunk[j].embedding = embeddingResponse.data[j].embedding;
        }
        console.log(`Embedded batch ${Math.floor(i / chunkSize) + 1}/${Math.ceil(vectorDb.length / chunkSize)}`);
    }

    for (const entry of vectorDb) {
        existingById.set(entry.iab_id, entry);
    }

    const finalVectorDb = [];
    for (const id of nodeOrder) {
        const row = existingById.get(id);
        if (row) finalVectorDb.push(row);
    }

    fs.writeFileSync(IAB_EMBED_DB_PATH, JSON.stringify(finalVectorDb, null, 2));
    console.log(`Saved ${finalVectorDb.length} embeddings to ${IAB_EMBED_DB_PATH}`);
    return finalVectorDb;
}

async function IAB_Analysis_With_Semantic_Search(assetId) {
    const vectorDbPath = 'C:/Users/natha/OneDrive/Desktop/Coding/Projects/Consulting/TwelveLabs/contextual-ad-engine/taxonomy_embeds.json';
    if (!fs.existsSync(vectorDbPath) || fs.readFileSync(vectorDbPath, 'utf8').trim().length === 0) {
        await embed_IAB_DATA();
    }

    const vectors = JSON.parse(fs.readFileSync(vectorDbPath, 'utf8'));

    const cosineSimilarity = (a, b) => {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return -1;
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA === 0 || normB === 0) return -1;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const waitForTask = async (taskId) => {
        while (true) {
            const task = await tl_client.analyzeAsync.tasks.retrieve(taskId);
            console.log(`Task ${taskId} status: ${task.status}`);
            if (task.status === 'ready') return task;
            if (task.status === 'failed') throw new Error(task.error?.message || `Task ${taskId} failed`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    };

    const sceneTask = await tl_client.analyzeAsync.tasks.create({
        modelName: 'pegasus1.5',
        video: {
            type: 'asset_id',
            assetId
        },
        analysisMode: 'time_based_metadata',
        responseFormat: {
            type: 'segment_definitions',
            segmentDefinitions: [
                {
                    id: 'scene_classification',
                    description:
                        'Scene-level signals for what is advertised or shown on screen (products, brands, people, places, activities, mood). Not how the spot was filmed.',
                    fields: [
                        {
                            name: 'scene_description',
                            type: 'string',
                            description:
                                'Two short sentences: visible products or services, brands or packaging if any, human activities and setting (indoor/outdoor, venue type), and overall tone. Do not describe cameras, editing, video production, or filmmaking unless those are literally the product being sold.'
                        }
                    ]
                }
            ]
        },
        minSegmentDuration: 5.0,
        maxSegmentDuration: 30.0
    });

    const completed = await waitForTask(sceneTask.taskId);
    const raw = completed?.result?.data;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const scenes = parsed?.scene_classification || [];
    const matches = [];

    for (const scene of scenes) {
        const description = scene?.metadata?.scene_description;
        if (!description || typeof description !== 'string') continue;

        const categoryKey = String(process.env.AD_CATEGORY_KEY || '').trim();
        const embeddingInput = formatSceneTextForTaxonomyEmbedding(description, {
            categoryKey: categoryKey || undefined
        });
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: embeddingInput
        });
        const sceneEmbedding = embeddingResponse?.data?.[0]?.embedding || [];

        let best = null;
        let bestScore = -2;
        for (const node of vectors) {
            const score = cosineSimilarity(sceneEmbedding, node.embedding);
            if (score > bestScore) {
                bestScore = score;
                best = node;
            }
        }

        matches.push({
            start: scene.startTime ?? scene.start_time ?? scene.start,
            end: scene.endTime ?? scene.end_time ?? scene.end,
            scene_description: description,
            embeddingTextForTaxonomyMatch: embeddingInput,
            matched_iab_id: best?.iab_id || null,
            matched_breadcrumb: best?.breadcrumb || '',
            matched_rich_text: best?.rich_text || '',
            cosine_similarity: bestScore
        });
    }

    return matches;
}

async function IAB_Analysis_With_Cascading(assetId) {
    const IAB_DATA = loadIABCSV(IAB_CSV_PATH);
    const tier1IabIds = Object.keys(IAB_DATA).filter((id) => typeof id === 'string' && id.length > 0);
    const tier1IabNames = tier1IabIds
        .map((id) => IAB_DATA[id]?.tier1)
        .filter((name) => typeof name === 'string' && name.length > 0);
    const tier1NameToId = Object.fromEntries(
        tier1IabIds
            .map((id) => [IAB_DATA[id]?.tier1, id])
            .filter(([name, id]) => typeof name === 'string' && name.length > 0 && typeof id === 'string')
    );
    const finalAdTechTimeline = [];

    async function waitForTask(taskId) {
        while (true) {
            const task = await tl_client.analyzeAsync.tasks.retrieve(taskId);
            console.log(`Task ${taskId} status: ${task.status}`);
            if (task.status === "ready") return task;
            if (task.status === "failed") {
                throw new Error(task.error?.message || `Task ${taskId} failed`);
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    async function classifyExactIabId({ startTime, endTime, parentId, candidates, parentName }) {
        if (!candidates || candidates.length === 0) return parentId;

        const candidatePairs = candidates
            .map((item) => ({ id: item?.id, name: item?.name }))
            .filter((item) => typeof item.id === 'string' && item.id.length > 0 && typeof item.name === 'string' && item.name.length > 0);
        const candidateIds = candidatePairs.map((item) => item.id);
        const candidateNames = candidatePairs.map((item) => item.name);
        const candidateNameToId = Object.fromEntries(candidatePairs.map((item) => [item.name, item.id]));
        const candidateOptions = candidatePairs.map((item) => `${item.name} (${item.id})`).join('\n');

        const prompt = `Look strictly at the scene from ${startTime} seconds to ${endTime} seconds. It falls under the broad category of ${parentName}. Classify this specific scene into the most accurate sub-category from this list ONLY:\n${candidateOptions}\n\nRespond with valid JSON in this exact format: {"sub_category":"<exact category name from the list>"}.`;

        try {
            let response;

            response = await tl_client.analyze({
                videoId: assetId,
                prompt,
                start: startTime,
                end: endTime,
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        type: 'object',
                        properties: {
                            sub_category: {
                                type: 'string',
                                enum: candidateNames
                            }
                        },
                        required: ['sub_category']
                    }
                }
            }, {
                timeoutInSeconds: 90
            });

            console.log('RESPONSE: ', response);
            
            const rawText = response?.data ?? response?.text ?? response;
            const parsed = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
            console.log('PARSED: ', parsed);

            const rawValue = parsed?.sub_category || parsed?.category || parsed?.exact_iab_id || Object.values(parsed || {})[0];
            if (!rawValue || typeof rawValue !== 'string') {
                console.warn(`Failed to extract string from parsed object for scene ${startTime}-${endTime}`);
                return parentId;
            }

            const selectedName = rawValue.trim();
            const mappedId = candidateNameToId[selectedName];

            console.log('SELECTED NAME: ', selectedName);
            console.log('MAPPED ID: ', mappedId);

            return candidateIds.includes(mappedId) ? mappedId : parentId;
        } catch (error) {
            console.error(`Failed to classify sub-tier ${startTime}-${endTime}:`, error?.message || error);
            return parentId;
        }
    }

    console.log("TIER 1 IAB:", tier1IabNames);

    const sceneTask = await tl_client.analyzeAsync.tasks.create({
        modelName: 'pegasus1.5',
        video: {
            type: 'asset_id',
            assetId: assetId
        },
        analysisMode: 'time_based_metadata',
        responseFormat: {
            type: 'segment_definitions',
            segmentDefinitions: [
                {
                    id: "scene_classification",
                    description: "A visually and contextually distinct scene in the video.",
                    fields: [
                        {
                            name: "tier_1_iab_category",
                            type: "string",
                            description: "The exact IAB Content Taxonomy 3.1 Tier 1 ID that best describes this specific scene.",
                            enum: tier1IabNames
                        }
                    ],
                },
            ],
        },
        minSegmentDuration: 5.0,
        maxSegmentDuration: 30.0,
    });

    const completedSceneTask = await waitForTask(sceneTask.taskId);
    const scenePayload = completedSceneTask.result?.data;
    const parsedScenePayload = typeof scenePayload === 'string' ? JSON.parse(scenePayload) : scenePayload;
    const scenesTimeline = parsedScenePayload?.scene_classification || [];

    for (const scene of scenesTimeline) {
        const start = scene.startTime ?? scene.start_time ?? scene.start;
        const end = scene.endTime ?? scene.end_time ?? scene.end;
        const t1Name = scene.metadata?.tier_1_iab_category;
        const t1Id = tier1NameToId[t1Name];

        console.log('SCENE: ', scene);

        if (!t1Id || !IAB_DATA[t1Id]) continue;

        let finalIabId = t1Id;
        let t2Id = null;
        let t3Id = null;
        let t4Id = null;
        let parentName = IAB_DATA[t1Id].tier1;

        const t2Candidates = IAB_DATA[t1Id].tier2.filter((node) => node.parentId === t1Id);
        console.log('T2 CANDIDATES: ', t2Candidates);
        
        finalIabId = await classifyExactIabId({
            startTime: start,
            endTime: end,
            parentId: finalIabId,
            candidates: t2Candidates,
            parentName
        });
        t2Id = finalIabId !== t1Id ? finalIabId : null;

        const t3Candidates = IAB_DATA[t1Id].tier3.filter((node) => node.parentId === finalIabId);
        if (t3Candidates.length > 0) {
            parentName = (t2Candidates.find((n) => n.id === finalIabId) || {}).name || parentName;
            finalIabId = await classifyExactIabId({
                startTime: start,
                endTime: end,
                parentId: finalIabId,
                candidates: t3Candidates,
                parentName
            });
            t3Id = finalIabId !== t2Id ? finalIabId : null;
        }
        console.log('T3 CANDIDATES: ', t3Candidates);

        const t4Candidates = IAB_DATA[t1Id].tier4.filter((node) => node.parentId === finalIabId);
        if (t4Candidates.length > 0) {
            parentName = (
                t3Candidates.find((n) => n.id === finalIabId) ||
                t2Candidates.find((n) => n.id === finalIabId) ||
                {}
            ).name || parentName;
            finalIabId = await classifyExactIabId({
                startTime: start,
                endTime: end,
                parentId: finalIabId,
                candidates: t4Candidates,
                parentName
            });
            t4Id = finalIabId !== t3Id ? finalIabId : null;
        }

        console.log('T4 CANDIDATES: ', t4Candidates);

        finalAdTechTimeline.push({
            start,
            end,
            t1_iab_id: t1Id,
            t2_iab_id: t2Id,
            t3_iab_id: t3Id,
            t4_iab_id: t4Id,
            final_iab_id: finalIabId
        });

        console.log('SCENE CLASSIFICATION:', {
            start,
            end,
            t1_iab_id: t1Id,
            t2_iab_id: t2Id,
            t3_iab_id: t3Id,
            t4_iab_id: t4Id,
            final_iab_id: finalIabId
        });
    }

    console.log(JSON.stringify(finalAdTechTimeline, null, 2));
    return finalAdTechTimeline;

} 

async function main() {
    await embed_IAB_DATA();
    if (!TL_ASSET_ID) {
        console.log('Set TL_ASSET_ID to run scene classification and cosine matching.');
        return;
    }
    const semanticMatches = await IAB_Analysis_With_Semantic_Search(TL_ASSET_ID);
    console.log(JSON.stringify(semanticMatches, null, 2));
}

if (require.main === module) {
    main().catch((error) => {
        console.error('Execution failed:', error?.message || error);
        process.exit(1);
    });
}
