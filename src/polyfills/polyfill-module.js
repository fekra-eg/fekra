// Replaces next/dist/build/polyfills/polyfill-module (aliased in next.config.ts).
// Our browserslist (Chrome 111, Safari 16.4) has everything else it ships;
// URL.canParse arrived in Chrome 120 / Safari 17, so it stays.
if (!('canParse' in URL)) {
  URL.canParse = function (url, base) {
    try {
      return !!new URL(url, base)
    } catch {
      return false
    }
  }
}
