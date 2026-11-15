export interface CmsImage { url: string; width?: number; height?: number }
export interface Topic {
  id: string;
  title?: string;
  body?: string;
  displayDate?: string;
  seasonYear?: string | number;
  category?: string[];
  [key: string]: unknown;
}
export function topicDate(value?: string): { label: string; iso: string } | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { label: new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric" }).format(date), iso: date.toISOString() };
}
export function categories(topic: Topic): string[] {
  return Array.isArray(topic.category) ? topic.category.filter(item => item === "お知らせ" || item === "トピックス") : [];
}
export function season(topic: Topic): string | null {
  return typeof topic.seasonYear === "number" || typeof topic.seasonYear === "string" ? String(topic.seasonYear).trim() || null : null;
}
export function coverImage(topic: Topic, field?: string): CmsImage | null {
  const isImage = (value: unknown): value is CmsImage => {
    if (!value || typeof value !== "object" || !("url" in value) || typeof value.url !== "string") return false;
    try { return new URL(value.url).protocol === "https:"; } catch { return false; }
  };
  if (field) return isImage(topic[field]) ? topic[field] : null;
  // Inspect the actual response shape; never invent an image field ID.
  const images = Object.values(topic).filter(isImage);
  return images.length === 1 ? images[0] : null;
}
export function sortTopics(topics: Topic[]): Topic[] {
  return [...topics].sort((a, b) => {
    const dateA = topicDate(a.displayDate)?.iso ?? "";
    const dateB = topicDate(b.displayDate)?.iso ?? "";
    return dateB.localeCompare(dateA) || a.id.localeCompare(b.id);
  });
}
