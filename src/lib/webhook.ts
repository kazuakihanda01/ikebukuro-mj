import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!secret || !signature || !/^[a-fA-F0-9]{64}$/.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
const endpoints = ["schedule", "score", "topics", "about", "rules"] as const;
export function webhookTarget(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;
  const endpoint = endpoints.find(item => item === data.api);
  if (!endpoint) return null;
  // All microCMS publication/update/unpublication/delete events invalidate.
  // An absent ID still invalidates all topics via the endpoint tag.
  const id = typeof data.id === "string" && /^[a-zA-Z0-9_-]+$/.test(data.id) ? data.id : undefined;
  return { endpoint, id };
}
