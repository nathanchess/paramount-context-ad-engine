import { TwelveLabs } from "twelvelabs-js"

let _client = null;

export function getTwelveLabsClient() {
    if (!_client) {
        _client = new TwelveLabs({ apiKey: process.env.TL_API_KEY });
    }
    return _client;
}

/**
 * Find an existing TwelveLabs index by name, or create one if it doesn't exist.
 * @param {string} targetIndex - The name of the index to find or create
 * @returns {Promise<string>} The index ID
 */
export async function getIndexId(targetIndex) {
    const client = getTwelveLabsClient();
    const indexPager = await client.indexes.list();
    let indexId = null;

    for await (const index of indexPager) {
        if (index.indexName === targetIndex) {
            indexId = index.id;
            break;
        }
    }

    if (!indexId) {
        const index = await client.indexes.create({
            indexName: targetIndex,
            models: [
                {
                    modelName: "marengo3.0",
                    modelOptions: ["visual", "audio"],
                },
                {
                    modelName: "pegasus1.2",
                    modelOptions: ["visual", "audio"],
                },
            ],
        });
        indexId = index.id;
    }

    return indexId;
}
