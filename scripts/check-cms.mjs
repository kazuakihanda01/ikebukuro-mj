// Run locally with: node --env-file=.env.local scripts/check-cms.mjs
// Prints field IDs/status only, never API keys or article content.
const key = process.env.MICROCMS_API_KEY;
if (!key) throw new Error("Set MICROCMS_API_KEY in .env.local first");
const domain = process.env.MICROCMS_SERVICE_DOMAIN || "ikebukuromj";
if (!/^[a-z0-9-]+$/.test(domain)) throw new Error("Invalid service domain");
const fields = { schedule: ["schedule"], score: ["CurrentStandings", "HistoricalStandings"], about: ["aboutus"], rules: ["rules"] };
for (const api of [...Object.keys(fields), "topics"]) {
  const response = await fetch(`https://${domain}.microcms.io/api/v1/${api}`, { headers: { "X-MICROCMS-API-KEY": key } });
  console.log(`${api}: HTTP ${response.status}`);
  if (!response.ok) { process.exitCode = 1; continue; }
  const data = await response.json();
  if (api !== "topics") {
    for (const field of fields[api]) {
      const valid = typeof data[field] === "string";
      console.log(`  ${field}: ${valid ? "HTML string" : "MISSING / unexpected type"}`);
      if (!valid) process.exitCode = 1;
    }
  } else {
    if (!Array.isArray(data.contents)) { console.log("  contents: MISSING"); process.exitCode = 1; continue; }
    console.log(`  totalCount: ${data.totalCount}`);
    console.log("  field IDs:", [...new Set(data.contents.flatMap(Object.keys))].join(", "));
    const imageFields = [...new Set(data.contents.flatMap(item => Object.entries(item).filter(([, value]) => value && typeof value === "object" && typeof value.url === "string").map(([field]) => field)))];
    console.log("  image field IDs:", imageFields.join(", ") || "No image in returned articles; inspect CMS schema");
  }
}
