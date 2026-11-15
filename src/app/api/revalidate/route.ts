import { revalidatePath, revalidateTag } from "next/cache";
import { cmsTag } from "@/lib/cms";
import { verifySignature, webhookTarget } from "@/lib/webhook";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.MICROCMS_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook is not configured" }, { status: 503 });
  if (Number(request.headers.get("content-length")) > 1_000_000) return new Response(null, { status: 413 });
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 1_000_000) { await reader.cancel(); return new Response(null, { status: 413 }); }
    chunks.push(value);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!verifySignature(raw, request.headers.get("x-microcms-signature"), secret)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const target = webhookTarget(payload);
  if (!target) return Response.json({ error: "Unsupported API" }, { status: 400 });
  // Immediate expiration, rather than stale-while-revalidate: next open sees fresh content.
  revalidateTag(cmsTag(target.endpoint), { expire: 0 });
  revalidatePath(`/${target.endpoint}`);
  if (target.endpoint === "topics") {
    if (target.id) {
      revalidateTag(cmsTag("topics", target.id), { expire: 0 });
      revalidatePath(`/topics/${target.id}`);
    } else {
      revalidatePath("/topics/[id]", "page");
    }
  }
  return Response.json({ revalidated: true, api: target.endpoint, ...(target.id ? { id: target.id } : {}) });
}
