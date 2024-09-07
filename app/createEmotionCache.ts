import createCache from "@emotion/cache";

// Create the cache for SSR
export default function createEmotionCache() {
  return createCache({ key: "css" });
}
