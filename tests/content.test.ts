import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeRichText } from "../src/lib/rich-text";
import { categories, coverImage, season, sortTopics, topicDate } from "../src/lib/content";

test("rich HTML keeps tables, headings, line breaks, images and spreadsheet links while stripping active content", () => {
  const result = sanitizeRichText('<h2>速報</h2><p>本文<br>続き</p><script>alert(1)</script><img src="https://images.microcms-assets.io/test.png" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><a href="https://docs.google.com/spreadsheets/d/example" target="_blank">過去成績</a><table><tbody><tr><th scope="col">順位</th><td colspan="2">1</td></tr></tbody></table><iframe src="https://evil.example"></iframe>');
  assert.doesNotMatch(result, /<script|onerror|javascript:|<iframe/);
  assert.match(result, /<h2>速報<\/h2>/);
  assert.match(result, /<br\s*\/>/);
  assert.match(result, /https:\/\/images.microcms-assets.io/);
  assert.match(result, /https:\/\/docs.google.com\/spreadsheets/);
  assert.match(result, /rel="noopener noreferrer"/);
  assert.match(result, /class="table-scroll"/);
  assert.match(result, /colspan="2"/);
});
test("unsafe images and layout styles cannot escape the content container", () => {
  const result = sanitizeRichText('<p style="position:fixed">text</p><img src="data:image/svg+xml,evil"><img src="//evil.example/image.png">');
  assert.doesNotMatch(result, /style=|src=/);
});
test("dates use Japan time and missing/invalid dates are retained without invented dates", () => {
  assert.equal(topicDate("2026-11-14T16:00:00Z")?.label, "2026年11月15日");
  assert.equal(topicDate(undefined), null);
  assert.equal(topicDate("invalid"), null);
  const topics = [{ id: "old" }, { id: "new", displayDate: "2026-11-14T16:00:00Z" }];
  assert.deepEqual(sortTopics(topics).map(topic => topic.id), ["new", "old"]);
  assert.deepEqual(categories({ id: "old" }), []);
  assert.deepEqual(categories({ id: "new", category: ["お知らせ", "トピックス", "その他"] }), ["お知らせ", "トピックス"]);
  assert.equal(season({ id: "new", seasonYear: 2026 }), "2026");
});
test("cover field uses actual image data or explicit verified field name", () => {
  const topic = { id: "one", actualImageField: { url: "https://images.microcms-assets.io/test.png", width: 800 } };
  assert.equal(coverImage(topic)?.url, topic.actualImageField.url);
  assert.equal(coverImage(topic, "actualImageField")?.width, 800);
  assert.equal(coverImage(topic, "inventedField"), null);
  assert.equal(coverImage({ id: "bad", image: { url: "javascript:alert(1)" } }), null);
});
