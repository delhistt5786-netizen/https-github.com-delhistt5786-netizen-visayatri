/**
 * Manual mock for `archiver` — the real package is ESM-only and Jest's
 * CJS module system can't `require()` it, even though it works fine
 * under plain Node (which has native require(esm) support since v22+).
 * This confirms it's a test-tooling gap, not a production bug — verified
 * separately with `node -e "require('archiver')"`.
 *
 * The ZIP-pack route (routes/pdf.js GET /pack/:appId) isn't covered by
 * the test suite yet; this stub exists purely so requiring app.js (which
 * requires every route, including pdf.js) doesn't blow up the whole
 * suite over an unrelated route.
 */
module.exports = () => ({
  pipe: () => {},
  append: () => {},
  file: () => {},
  finalize: async () => {},
  on: () => {},
});
