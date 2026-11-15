import "server-only";
import type { Topic } from "./content";

export type Endpoint = "schedule" | "score" | "topics" | "about" | "rules";
export const cmsTag = (endpoint: Endpoint, id?: string) => `microcms:${endpoint}${id ? `:${id}` : ""}`;
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
  const response = await fetch(url, {
    headers: { "X-MICROCMS-API-KEY": key },
    cache: "force-cache",
    next: { revalidate: false, tags: [cmsTag(endpoint), ...(id ? [cmsTag(endpoint, id)] : [])] },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new CmsError(response.status);
  return response.json() as Promise<T>;
}
export const getSchedule = () => cmsFetch<{ schedule?: string }>("schedule");
export const getScore = () => cmsFetch<{ CurrentStandings?: string; HistoricalStandings?: string }>("score");
export const getAbout = () => cmsFetch<{ aboutus?: string }>("about");
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
