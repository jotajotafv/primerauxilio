import fs from 'node:fs';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSETS } from '../src/config/assets.js';

test('El build usa /primerauxilio/ y conserva los 20 GLB', { skip: !fs.existsSync('dist/index.html') }, () => {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]).filter(value => !value.startsWith('#'));
  assert.ok(references.some(value => value.endsWith('.js')));
  assert.ok(references.some(value => value.endsWith('.css')));
  for (const reference of references) {
    assert.ok(reference.startsWith('/primerauxilio/'), `Ruta sin base: ${reference}`);
    assert.ok(fs.existsSync(`dist/${reference.slice('/primerauxilio/'.length)}`), `No existe: ${reference}`);
  }
  for (const filename of Object.values(ASSETS)) {
    const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
    assert.equal(hash(`dist/models/${filename}`), hash(`public/models/${filename}`));
  }
  const scripts = fs.readdirSync('dist/assets').filter(name => name.endsWith('.js')).map(name => fs.readFileSync(`dist/assets/${name}`, 'utf8')).join('\n');
  assert.ok(scripts.includes('/primerauxilio/'));
});
