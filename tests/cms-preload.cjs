// Loaded ONLY by the integration test server using NODE_OPTIONS.
// No test mode or fixture endpoint is included in application code.
const fs = require('node:fs');
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (input, init) {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
  if (url.hostname !== 'ikebukuromj.microcms.io') return originalFetch(input, init);
  fs.appendFileSync(process.env.CMS_TEST_CALLS, url.pathname + url.search + '\n');
  const data = JSON.parse(fs.readFileSync(process.env.CMS_TEST_DATA, 'utf8'));
  const parts = url.pathname.split('/').filter(Boolean);
  const api = parts[2];
  const id = parts[3];
  let body = data[api];
  if (api === 'topics') {
    if (id) body = data.topics.find(topic => topic.id === id);
    else {
      const offset = Number(url.searchParams.get('offset') || 0);
      const limit = Number(url.searchParams.get('limit') || 100);
      body = { contents: data.topics.slice(offset, offset + limit), totalCount: data.topics.length, offset, limit };
    }
  }
  return new Response(JSON.stringify(body || { message: 'Not found' }), { status: body ? 200 : 404, headers: { 'content-type': 'application/json' } });
};
