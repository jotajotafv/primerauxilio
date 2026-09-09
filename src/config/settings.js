export const SETTINGS = Object.freeze({
  debug: import.meta.env?.DEV === true && new URLSearchParams(globalThis.location?.search).has('debug'),
  maxPixelRatio: 1.75,
  shadowMapSize: 1024,
  storageKey: 'first-aid-3d:progress:v1',
  cpr: { minRate: 100, maxRate: 120, practiceCount: 30 },
});
