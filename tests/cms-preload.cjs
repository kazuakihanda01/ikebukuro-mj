// Loaded ONLY by the integration test server using NODE_OPTIONS.
// No test mode or fixture endpoint is included in application code.
const fs = require('node:fs');
// Only this test server sees the adjustable clock. The production TTL stays 300s.
const offset = () => Number(JSON.parse(fs.readFileSync(process.env.CMS_TEST_DATA, 'utf8')).__clockOffsetMs || 0);
const realDateNow = Date.now.bind(Date);
Date.now = () => realDateNow() + offset();
const realPerformance = globalThis.performance;
Object.defineProperty(globalThis, 'performance', {
  configurable: true,
  value: new Proxy(realPerformance, {
    get(target, property) {
      if (property === 'now') return () => target.now() + offset();
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  }),
});
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (input, init) {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input : input.url);
  if (url.hostname !== 'ikebukuromj.microcms.io') return originalFetch(input, init);
  fs.appendFileSync(process.env.CMS_TEST_CALLS, url.pathname + url.search + '\n');
  const data = JSON.parse(fs.readFileSync(process.env.CMS_TEST_DATA, 'utf8'));
  const parts = url.pathname.split('/').filter(Boolean);
  const api = parts[2];
  const id = parts[3];
  if (data.__failedApi === api) {
    fs.appendFileSync(process.env.CMS_TEST_CALLS, '503 ' + url.pathname + '\n');
    return new Response('{"message":"Temporary failure"}', { status: 503 });
  }
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
