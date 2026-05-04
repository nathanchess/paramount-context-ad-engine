type FreewheelPayload = {
  ad_server: string;
  endpoint: string;
  generated_kvps: Record<string, string>;
};

type OpenRtbInput = {
  freewheelPayload: FreewheelPayload;
  categorySlug: string;
  contentTitle: string;
  fallbackApplied: boolean;
  fallbackReason: string | null;
};

export function buildOpenRtbMappedView(input: OpenRtbInput) {
  const kvps = input.freewheelPayload.generated_kvps || {};
  const cat = (kvps.vw_iab_t1 || "").split(",").map((x) => x.trim()).filter(Boolean);
  const genre = (kvps.vw_iab_t2 || "").split(",").map((x) => x.trim()).filter(Boolean);
  const iabTier4 = (kvps.vw_iab_t4 || "").split(",").map((x) => x.trim()).filter(Boolean);
  const codes = (kvps.vw_iab_codes || "").split(",").map((x) => x.trim()).filter(Boolean);
  const includeContexts = (kvps.vw_ctx_inc || "").split(",").map((x) => x.trim()).filter(Boolean);
  const excludeContexts = (kvps.vw_ctx_exc || "").split(",").map((x) => x.trim()).filter(Boolean);

  return {
    openrtb_version: "2.6-demo",
    app: {
      name: "Contextual Ad Engine",
      publisher: {
        id: "demo-publisher",
      },
      content: {
        title: input.contentTitle,
        cat,
        genre,
        keywords: includeContexts.join(","),
      },
    },
    imp: [
      {
        id: "1",
        secure: 1,
        ext: {
          freewheel: {
            endpoint: input.freewheelPayload.endpoint,
            kvps,
          },
          contextual: {
            include_contexts: includeContexts,
            exclude_contexts: excludeContexts,
            iab_codes: codes,
            iab_tier4_labels: iabTier4,
            classification_confidence: kvps.vw_iab_conf || "0.000",
            fallback_applied: input.fallbackApplied,
            fallback_reason: input.fallbackReason,
          },
        },
      },
    ],
    ext: {
      demo_notes: {
        category_slug: input.categorySlug,
        mapping_mode: "freewheel-kvp-to-openrtb-view",
      },
    },
  };
}
