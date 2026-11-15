import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifySignature, webhookTarget } from "../src/lib/webhook";

test("microCMS HMAC validates the exact raw body and rejects forged/missing signatures", () => {
  const body = '{"api":"topics","id":"article-1","type":"edit"}';
  const secret = "test-only-secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifySignature(body, signature, secret), true);
  assert.equal(verifySignature(body + " ", signature, secret), false);
  assert.equal(verifySignature(body, signature, "wrong"), false);
  for (const invalid of [null, "", "0", "z".repeat(64), "0".repeat(64)]) assert.equal(verifySignature(body, invalid, secret), false);
});
test("all lifecycle event types target a known API and only valid content paths", () => {
  for (const type of ["new", "edit", "publish", "unpublish", "delete"]) assert.deepEqual(webhookTarget({ api: "topics", id: "article-1", type }), { endpoint: "topics", id: "article-1" });
  assert.equal(webhookTarget({ api: "../score" }), null);
  assert.deepEqual(webhookTarget({ api: "topics", id: "../../secret" }), { endpoint: "topics", id: undefined });
  assert.deepEqual(webhookTarget({ api: "score" }), { endpoint: "score", id: undefined });
});
