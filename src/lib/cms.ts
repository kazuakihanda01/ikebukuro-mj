import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import type { CmsImage, Topic } from "./content";

export type Endpoint = "schedule" | "score" | "topics" | "about" | "rules";
const CACHE_SECONDS = 300;
export class CmsError extends Error {
  constructor(public status: number) { super(`microCMS request failed (${status})`); }
}
export class CmsNotConfigured extends Error {}

async function cmsFetch<T>(endpoint: Endpoint, id?: string, offset?: number): Promise<T> {
  const key = process.env.MICROCMS_API_KEY;
  if (!key) throw new CmsNotConfigured("microCMS API key is not configured");
  const domain = process.env.MICROCMS_SERVICE_DOMAIN || "ikebukuromj";
  if (!/^[a-z0-9-]+$/.test(domain)) throw new Error("Invalid microCMS service domain");
  const url = new URL(`https://${domain}.microcms.io/api/v1/${endpoint}${id ? `/${encodeURIComponent(id)}` : ""}`);
  if (offset !== undefined) { url.searchParams.set("limit", "100"); url.searchParams.set("offset", String(offset)); }
  const readCached = unstable_cache(async () => {
    const response = await fetch(url, {
      headers: { "X-MICROCMS-API-KEY": key },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    // Cache a 404 as data so unpublication replaces a previously cached article.
    // Caching fetch alone would keep its last successful 200 response on a 404.
    if (response.status === 404) return { status: 404 as const, data: null };
    if (!response.ok) throw new CmsError(response.status);
    return { status: 200 as const, data: await response.json() as T };
  }, ["microcms-published-300s-v1", url.toString(), createHash("sha256").update(key).digest("hex")], {
    revalidate: CACHE_SECONDS,
  });
  const result = await readCached();
  if (result.status === 404) throw new CmsError(404);
  return result.data;
}
export const getSchedule = () => cmsFetch<{ schedule?: string }>("schedule");
export const getScore = () => cmsFetch<{ CurrentStandings?: string; HistoricalStandings?: string }>("score");
export const getAbout = () => cmsFetch<{ aboutus?: string; Adviser?: string; Adviserpic?: CmsImage }>("about");
export const getRules = () => cmsFetch<{ rules?: string }>("rules");
export const getTopic = (id: string) => cmsFetch<Topic>("topics", id);

export async function getTopics(): Promise<Topic[]> {
  const topics: Topic[] = [];
  let offset = 0;
  for (;;) {
    const page = await cmsFetch<{ contents: Topic[]; totalCount: number; limit: number; offset: number }>("topics", undefined, offset);
    topics.push(...page.contents);
    offset += page.contents.length;
    if (offset >= page.totalCount) break;
    if (!page.contents.length) throw new Error("microCMS pagination returned an empty page");
  }
  return topics;
}

export function cmsFailure(error: unknown): "unconfigured" | "unavailable" {
  // Log only status/type. Never log request headers, response content or API keys.
  console.error("CMS content unavailable:", error instanceof CmsNotConfigured ? "unconfigured" : error instanceof CmsError ? error.status : "fetch failure");
  return error instanceof CmsNotConfigured ? "unconfigured" : "unavailable";
}
