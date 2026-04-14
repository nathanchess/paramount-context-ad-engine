import { list } from "@vercel/blob";

/**
 * List every blob under a prefix using Vercel Blob cursor pagination.
 * @param {string} prefix
 */
export async function listAllBlobs(prefix) {
  const out = [];
  let hasMore = true;
  let cursor;

  while (hasMore) {
    const listResult = await list({
      prefix,
      cursor,
    });
    out.push(...(listResult.blobs || []));
    cursor = listResult.cursor;
    hasMore =
      listResult.hasMore === true ||
      (listResult.hasMore !== false && Boolean(cursor));
  }

  return out;
}
