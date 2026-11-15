import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import { chromium } from '@playwright/test';

const temp = await mkdtemp(join(tmpdir(), 'ikebukuro-mj-e2e-'));
const fixturePath = join(temp, 'cms.json');
const callsPath = join(temp, 'calls.log');
const secret = 'integration-test-secret-only';
const port = 3107;
const origin = `http://127.0.0.1:${port}`;
const table = `<table><tbody><tr>${Array.from({length: 16}, (_, i) => `<th>順位項目${i}</th>`).join('')}</tr><tr>${'<td>123456789</td>'.repeat(16)}</tr></tbody></table>`;
const data = {
  schedule: { schedule: '<h2>開催予定</h2><p>FIXTURE-SCHEDULE-V1</p>' + table },
  score: { CurrentStandings: '<h2>速報本文</h2><p>FIXTURE-CURRENT</p>' + table, HistoricalStandings: '<a href="https://docs.google.com/spreadsheets/d/test-fixture" target="_blank">過去成績シート</a>' },
  about: { aboutus: '<h2>会の紹介</h2><p>FIXTURE-ABOUT</p>' },
  rules: { rules: '<h2>基本ルール</h2><p>FIXTURE-RULES</p>' },
  topics: [
    { id: 'new-article', title: '年度ありの新しい記事', body: '<h2>記事本文</h2><p>FIXTURE-ARTICLE-V1</p>' + table, displayDate: '2026-11-14T16:00:00Z', seasonYear: 2026, category: ['お知らせ'], realCoverField: { url: 'https://images.microcms-assets.io/test-cover.png' } },
    { id: 'legacy-article', title: '分類と日付がない旧記事', body: '<p>FIXTURE-LEGACY</p>' },
    ...Array.from({ length: 100 }, (_, i) => ({ id: `past-${i}`, title: `過去の記事${i}`, body: '<p>過去の本文</p>', seasonYear: 2025, category: ['トピックス'] })),
  ],
};
await writeFile(fixturePath, JSON.stringify(data));
await writeFile(callsPath, '');
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '--hostname', '127.0.0.1'], {
  cwd: resolve('.'), env: { ...process.env, NODE_OPTIONS: `--require=${resolve('tests/cms-preload.cjs')}`, MICROCMS_API_KEY: `integration-test-only-${randomUUID()}`, MICROCMS_WEBHOOK_SECRET: secret, MICROCMS_TOPICS_COVER_FIELD: 'realCoverField', CMS_TEST_DATA: fixturePath, CMS_TEST_CALLS: callsPath }, stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', chunk => { logs += chunk; });
server.stderr.on('data', chunk => { logs += chunk; });
let browser;
const get = async path => { const response = await fetch(origin + path); return { status: response.status, body: await response.text() }; };
const webhook = async (api, id, type = 'edit', valid = true) => {
  const body = JSON.stringify({ api, id, type });
  return fetch(origin + '/api/revalidate', { method: 'POST', headers: { 'content-type': 'application/json', 'x-microcms-signature': valid ? createHmac('sha256', secret).update(body).digest('hex') : '0'.repeat(64) }, body });
};
try {
  let ready = false;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(origin)).ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 100)); }
  assert.ok(ready, logs);
  const home = await get('/');
  assert.match(home.body, /池袋雀友会/);
  assert.equal(await readFile(callsPath, 'utf8'), '', 'home must never request microCMS');
  for (const [path, marker] of [['/schedule', 'FIXTURE-SCHEDULE-V1'], ['/score', 'FIXTURE-CURRENT'], ['/about', 'FIXTURE-ABOUT'], ['/rules', 'FIXTURE-RULES']]) { const result = await get(path); assert.equal(result.status, 200); assert.ok(result.body.includes(marker), `${path}: ${result.body.slice(-600)}`); }
  assert.match((await get('/score')).body, /name="robots" content="noindex/);
  assert.match((await get('/score')).body, /https:\/\/docs.google.com\/spreadsheets\/d\/test-fixture/);
  const list = await get('/topics');
  assert.match(list.body, /past-99/); // proves pagination past 100
  assert.match(list.body, /legacy-article/);
  assert.match(list.body, /2026年11月15日/);
  assert.match((await get('/topics/new-article')).body, /FIXTURE-ARTICLE-V1/);

  const callsBefore = await readFile(callsPath, 'utf8');
  await get('/schedule'); await get('/topics'); await get('/topics/new-article');
  assert.equal(await readFile(callsPath, 'utf8'), callsBefore, 'repeat views use Data Cache');
  data.schedule.schedule = data.schedule.schedule.replace('V1', 'V2');
  await writeFile(fixturePath, JSON.stringify(data));
  assert.match((await get('/schedule')).body, /FIXTURE-SCHEDULE-V1/);
  assert.equal((await webhook('schedule', undefined, 'edit', false)).status, 401);
  assert.match((await get('/schedule')).body, /FIXTURE-SCHEDULE-V1/);
  assert.equal((await webhook('schedule')).status, 200);
  assert.match((await get('/schedule')).body, /FIXTURE-SCHEDULE-V2/);
  data.topics[0].body = data.topics[0].body.replace('V1', 'V2');
  data.topics[0].title = '修正した記事';
  await writeFile(fixturePath, JSON.stringify(data));
  assert.equal((await webhook('topics', 'new-article')).status, 200);
  assert.match((await get('/topics/new-article')).body, /FIXTURE-ARTICLE-V2/);
  assert.match((await get('/topics')).body, /修正した記事/);
  console.log('PASS: object fields, paginated list/detail, legacy articles, JST, noindex, spreadsheet links, cache, invalid signature, signed update');

  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://images.microcms-assets.io/**', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/gX8AAAAASUVORK5CYII=', 'base64') }));
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/schedule', '/score', '/topics', '/topics/new-article', '/about', '/rules']) {
      await page.goto(origin + path);
      await page.locator('h1').waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `horizontal page overflow: ${width} ${path}`);
      assert.equal(await page.locator('nav[aria-label="共通メニュー"] a').count(), 6);
      if (path === '/schedule') {
        const scroll = page.locator('.table-scroll');
        assert.ok(await scroll.evaluate(element => element.scrollWidth > element.clientWidth), `table has its own scroll area at ${width}`);
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin);
  if (process.env.E2E_SCREENSHOT_DIR) {
    await mkdir(process.env.E2E_SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: join(process.env.E2E_SCREENSHOT_DIR, 'home-mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: join(process.env.E2E_SCREENSHOT_DIR, 'home-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
  }
  assert.equal(await page.locator('h1').innerText(), '池袋雀友会 ポータル');
  await page.locator('.menu-grid a[href="/score"]').click();
  await page.waitForURL('**/score');
  assert.equal(await page.getByRole('link', { name: '過去成績シート' }).getAttribute('href'), 'https://docs.google.com/spreadsheets/d/test-fixture');
  await page.goto(origin + '/topics');
  await page.selectOption('#season', '2026');
  assert.equal(await page.locator('.topic-card').count(), 1);
  await page.locator('.topic-link').click();
  await page.waitForURL('**/topics/new-article');
  assert.ok(await page.locator('.article-cover').isVisible());
  await page.goto(origin + '/topics');
  await page.selectOption('#season', '');
  assert.equal(await page.locator('.topic-card').count(), 102);
  console.log('PASS: 4 viewport widths, 7 pages, table containment, navigation, year filter, detail link, cover, mobile menu navigation');

  data.topics.shift();
  await writeFile(fixturePath, JSON.stringify(data));
  assert.equal((await webhook('topics', 'new-article', 'unpublish')).status, 200);
  assert.doesNotMatch((await get('/topics')).body, /new-article/);
  assert.equal((await get('/topics/new-article')).status, 404);
  data.topics.unshift({ id: 'new-article', title: '再公開した記事', body: '<p>REPUBLISHED</p>', seasonYear: 2026 });
  await writeFile(fixturePath, JSON.stringify(data));
  assert.equal((await webhook('topics', 'new-article', 'publish')).status, 200);
  assert.match((await get('/topics/new-article')).body, /REPUBLISHED/);
  assert.match((await get('/topics')).body, /再公開した記事/);
  console.log('PASS: unpublish removes list item and returns real 404; republish clears cached 404 without redeployment');
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await new Promise(resolve => server.once('exit', resolve));
  await rm(temp, { recursive: true, force: true });
}
