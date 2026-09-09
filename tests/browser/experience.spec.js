import { test, expect } from '@playwright/test';
import { MODULES, EQUIPMENT } from '../../src/config/modules.js';

async function ready(page) {
  await expect(page.locator('#initial-loader')).toHaveCount(0);
  await expect(page.locator('#scene-loader')).toBeHidden();
  await expect(page.locator('canvas')).toBeVisible();
  // Let the directed camera finish before inspecting rendered composition.
  await page.waitForTimeout(1000);
}
async function demonstration(page, module) {
  await page.getByRole('button', { name: 'Ver demostración', exact: true }).click();
  for (let i = 0; i < module.steps.length; i++) await page.locator('[data-action="demo-next"]').click();
  await page.getByRole('button', { name: 'Comenzar práctica', exact: true }).click();
}

test('Landing, sala, consola y navegación de todos los modelos', async ({ page }) => {
  test.slow(); // Seven 3D scenes and screenshots run with software WebGL.
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/'); await ready(page);
  await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'COMENZAR ENTRENAMIENTO' }).click(); await ready(page);
  await expect(page.locator('.module-row')).toHaveCount(7);
  await page.screenshot({ path: 'test-results/hub-desktop.png', fullPage: true });
  for (const module of MODULES) {
    await page.goto(`/#module/${module.id}`); await ready(page);
    await expect(page.locator('.module-heading h1')).toHaveText(module.name);
    await page.screenshot({ path: `test-results/module-${module.id}.png`, fullPage: true });
    if (module.variants) {
      await page.getByRole('button', { name: 'Pierna', exact: true }).click(); await ready(page);
      await expect(page.locator('#scene-title')).toContainText('Pierna');
    }
  }
  expect(errors).toEqual([]);
});

test('Prácticas completas, botiquín, variantes y persistencia de progreso', async ({ page }) => {
  test.slow(); // Completes every guided step and both limb variants.
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const module of MODULES.filter(m => m.id !== 'cpr')) {
    await page.goto(`/#module/${module.id}`); await ready(page);
    for (let variant = 0; variant < (module.variants ? 2 : 1); variant++) {
      if (variant) { await page.locator('[data-action="variant"][data-value="1"]').first().click(); await ready(page); }
      await demonstration(page, module);
      for (const [index, step] of module.steps.entries()) {
        if (module.id === 'kit' && index === 1) {
          for (const id of Object.keys(EQUIPMENT)) await page.locator(`[data-action="interact"][data-value="${id}"]`).click();
          await expect(page.locator('.equipment-detail h3')).toHaveText('Compresa fría');
        } else {
          await page.locator(`[data-action="interact"][data-value="${step.target}"]`).click();
          await expect(page.locator('#step-feedback')).toContainText('Paso registrado');
        }
        await page.locator('[data-action="next-step"]').click();
      }
      await expect(page.locator('.result-panel')).toContainText('PRÁCTICA FINALIZADA');
    }
  }
  await page.goto('/#hub'); await ready(page);
  await expect(page.locator('.module-row.completed')).toHaveCount(6);
  await page.reload(); await ready(page);
  await expect(page.locator('.module-row.completed')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('RCP: 30 pulsaciones, ritmo, teclado y ventilaciones opcionales', async ({ page }) => {
  await page.goto('/#module/cpr'); await ready(page);
  await demonstration(page, MODULES.find(m => m.id === 'cpr'));
  for (const target of ['response', 'help', 'position', 'chest']) {
    await page.locator(`[data-action="interact"][data-value="${target}"]`).click();
    await page.locator('[data-action="next-step"]').click();
  }
  await page.locator('body').click({ position: { x: 10, y: 10 } });
  for (let index = 0; index < 30; index++) {
    await page.keyboard.press('Space');
    if (index < 29) await page.waitForTimeout(545);
  }
  await expect(page.locator('#rhythm')).toContainText('30');
  await page.screenshot({ path: 'test-results/cpr-practice.png', fullPage: true });
  await page.locator('[data-action="next-step"]').click();
  await expect(page.locator('.result-stat strong')).toHaveText('30');
  await page.getByRole('button', { name: 'Ver ventilaciones opcionales' }).click();
  await expect(page.locator('dialog')).toContainText('30 compresiones con 2 ventilaciones');
});

test('Carga fallida recuperable y navegación rápida sin escena obsoleta', async ({ page }) => {
  const pattern = '**/models/FirstAid_Burn_HandForearm.glb';
  await page.route(pattern, route => route.abort());
  await page.goto('/#module/burns');
  await expect(page.locator('.error-panel')).toBeVisible();
  await page.unroute(pattern);
  await page.getByRole('button', { name: 'Volver a intentar' }).click(); await ready(page);
  await expect(page.locator('.module-heading h1')).toHaveText('Quemaduras');
  await page.evaluate(() => { location.hash = 'module/cpr'; });
  await page.evaluate(() => { location.hash = 'module/kit'; });
  await ready(page);
  await expect(page.locator('.module-heading h1')).toHaveText('Botiquín');
});

test('Móvil, tacto, movimiento reducido y fuentes accesibles', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173/'); await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'COMENZAR ENTRENAMIENTO' }).tap(); await ready(page);
  await page.getByRole('link', { name: /05 Quemaduras/ }).tap(); await ready(page);
  await demonstration(page, MODULES.find(m => m.id === 'burns'));
  await page.locator('[data-action="interact"]').tap();
  await page.locator('[data-action="next-step"]').tap();
  await page.screenshot({ path: 'test-results/burns-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole('button', { name: 'Fuentes y consideraciones' }).tap();
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).not.toBeVisible();
  await context.close();
});

test('Raycasting real, animación del pecho, tapa y recursos estables', async ({ page }) => {
  await page.goto('/?debug=1#module/cpr'); await ready(page);
  await demonstration(page, MODULES.find(m => m.id === 'cpr'));
  for (const target of ['response', 'help', 'position']) {
    await page.locator(`[data-action="interact"][data-value="${target}"]`).click();
    await page.locator('[data-action="next-step"]').click();
  }
  await page.waitForTimeout(1000);
  const chestPoint = async () => page.evaluate(async () => {
    const { Box3, Vector3 } = await import('/node_modules/.vite/deps/three.js');
    const app = window.firstAidDebug;
    const point = new Box3().setFromObject(app.scenes.current.chest).getCenter(new Vector3());
    point.y += 0.08;
    point.project(app.camera.camera);
    const rect = app.renderer.renderer.domElement.getBoundingClientRect();
    return { x: rect.x + (point.x + 1) / 2 * rect.width, y: rect.y + (1 - point.y) / 2 * rect.height };
  });
  let point = await chestPoint(); await page.mouse.click(point.x, point.y);
  await expect(page.locator('#step-feedback')).toContainText('Paso registrado');
  await page.locator('[data-action="next-step"]').click(); await page.waitForTimeout(1000);
  point = await chestPoint(); await page.mouse.click(point.x, point.y);
  await expect(page.locator('#rhythm')).toContainText('01');
  const actionPlaying = await page.evaluate(() => window.firstAidDebug.scenes.current.mainInstance.mixer._actions.some(action => action.isRunning()));
  expect(actionPlaying).toBeTruthy();
  await page.goto('/?debug=1#module/kit'); await ready(page);
  const closed = await page.evaluate(() => window.firstAidDebug.scenes.current.lid.quaternion.toArray());
  await page.getByRole('button', { name: 'Ver demostración', exact: true }).click();
  await page.waitForTimeout(3200);
  const opened = await page.evaluate(() => window.firstAidDebug.scenes.current.lid.quaternion.toArray());
  expect(opened).not.toEqual(closed);
  const cycle = async () => {
    for (const id of ['intro', 'bleeding', 'cpr', 'kit']) { await page.goto(`/?debug=1#module/${id}`); await ready(page); }
    return page.evaluate(() => {
      const app = window.firstAidDebug;
      return { geometries: app.renderer.renderer.info.memory.geometries, textures: app.renderer.renderer.info.memory.textures, drawCalls: app.renderer.renderer.info.render.calls, triangles: app.renderer.renderer.info.render.triangles, cachedAssets: app.assets.cache.size };
    });
  };
  const first = await cycle(), second = await cycle();
  expect(second.geometries).toBe(first.geometries);
  expect(second.textures).toBe(first.textures);
  expect(second.cachedAssets).toBe(first.cachedAssets);
  await test.info().attach('renderer-stability.json', { body: JSON.stringify({ first, second }, null, 2), contentType: 'application/json' });
});

test('Progreso reiniciable, almacenamiento denegado y ampliación de texto', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  await page.goto('/#hub'); await ready(page);
  await expect(page.locator('.panel-bottom')).toContainText('solo en esta sesión');
  await page.getByRole('button', { name: 'Reiniciar progreso', exact: true }).click();
  await page.getByRole('button', { name: 'Conservar progreso' }).click();
  await expect(page.locator('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Reiniciar progreso', exact: true }).click();
  await page.locator('dialog').getByRole('button', { name: 'Reiniciar progreso', exact: true }).click();
  await expect(page.locator('.overall-progress')).toContainText('0 de 7');
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
