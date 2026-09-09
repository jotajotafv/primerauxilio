import { test, expect } from '@playwright/test';
import { preview } from 'vite';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { ASSETS } from '../../src/config/assets.js';

test('Producción: subdirectorio, 20 GLB, recorrido, persistencia y móvil', async ({ page, request }) => {
  test.setTimeout(180000);
  const remote = process.env.PLAYWRIGHT_BASE_URL;
  const server = remote ? null : await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
  const url = new URL(remote || 'http://127.0.0.1:4173/primerauxilio/');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  const baseURL = url.href;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const loaded = async () => {
    await expect(page.locator('#initial-loader')).toHaveCount(0);
    await expect(page.locator('#scene-loader')).toBeHidden();
    await expect(page.locator('canvas')).toBeVisible();
  };
  const settleCamera = () => page.evaluate(async () => {
    // Wait for rendered frames, including the directed camera transition.
    for (let frame = 0; frame < 60; frame++) await new Promise(resolve => requestAnimationFrame(resolve));
  });
  try {
    const response = await page.goto(baseURL);
    expect(response.status()).toBe(200);
    await loaded();
    const publicAssets = await page.locator('script[src], link[rel="stylesheet"], link[rel="icon"]').evaluateAll(elements => elements.map(element => element.src || element.href));
    expect(publicAssets.length).toBeGreaterThanOrEqual(3);
    for (const asset of publicAssets) {
      expect(new URL(asset).pathname.startsWith(url.pathname)).toBeTruthy();
      expect((await request.get(asset)).status()).toBe(200);
    }
    await page.getByRole('link', { name: 'COMENZAR ENTRENAMIENTO' }).click();
    await loaded();
    await expect(page.locator('.module-row')).toHaveCount(7);
    await settleCamera();
    await page.screenshot({ path: test.info().outputPath('hub-desktop.png'), fullPage: true });
    for (const id of ['intro', 'cpr', 'heimlich', 'bleeding', 'burns', 'fractures', 'kit']) {
      await page.goto(`${baseURL}#module/${id}`);
      await loaded();
      await expect(page.locator('.lesson-intro')).toBeVisible();
      if (id === 'bleeding' || id === 'fractures') {
        await page.getByRole('button', { name: 'Pierna', exact: true }).click();
        await loaded();
        await expect(page.locator('#scene-title')).toContainText('Pierna');
      }
    }
    await Promise.all(Object.values(ASSETS).map(async filename => {
      const response = await request.get(new URL(`models/${filename}`, baseURL).href);
      expect(response.status(), filename).toBe(200);
      const bytes = await response.body();
      expect(bytes.subarray(0, 4).toString(), filename).toBe('glTF');
      const hash = data => crypto.createHash('sha256').update(data).digest('hex');
      expect(hash(bytes), filename).toBe(hash(fs.readFileSync(`public/models/${filename}`)));
    }));
    await page.goto(`${baseURL}#module/intro`); await loaded();
    await page.getByRole('button', { name: 'Ver demostración', exact: true }).click();
    for (let index = 0; index < 5; index++) await page.locator('[data-action="demo-next"]').click();
    await page.getByRole('button', { name: 'Comenzar práctica', exact: true }).click();
    for (let index = 0; index < 5; index++) {
      await page.locator('[data-action="interact"]').click();
      await page.locator('[data-action="next-step"]').click();
    }
    await page.goto(`${baseURL}#hub`); await loaded();
    await page.reload(); await loaded();
    await expect(page.locator('.module-row.completed')).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseURL}#module/burns`); await loaded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await settleCamera();
    await page.screenshot({ path: test.info().outputPath('burns-mobile.png'), fullPage: true });
    expect(await page.evaluate(() => window.firstAidDebug)).toBeUndefined();
    expect(errors).toEqual([]);
    await test.info().attach('production-verification.json', {
      body: JSON.stringify({ url: baseURL, models: Object.values(ASSETS), glbHashesMatch: true, javascriptErrors: errors, persistence: true, mobile: true }),
      contentType: 'application/json',
    });
  } finally { if (server) await new Promise(resolve => server.httpServer.close(resolve)); }
});
