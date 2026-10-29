// Bumps the ?v= token on the page's scripts so browsers fetch them fresh.
//
//   npm run stamp
//
// `npm run draw` does this automatically. Run it by hand after editing anything
// in docs/ WITHOUT redrawing - otherwise people keep running the old code for
// up to ten minutes (GitHub Pages serves these files with max-age=600), and if
// the encryption parameters changed, every correct passphrase gets rejected.

import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const VERSIONED_FILES = [join(ROOT, 'docs', 'index.html'), join(ROOT, 'docs', 'app.js')];

/** Rewrites every `?v=…` token to a fresh value. Returns the new version. */
export function stampVersion(version = Date.now().toString(36)) {
  for (const file of VERSIONED_FILES) {
    const src = readFileSync(file, 'utf8');
    const stamped = src.replace(/(\?v=)[A-Za-z0-9]+/g, `$1${version}`);
    if (stamped !== src) writeFileSync(file, stamped);
  }
  return version;
}

// Running this file directly stamps and reports; importing it does not.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  console.log(`\n  Stamped docs/ with version ${stampVersion()}`);
  console.log('  Commit and push, and browsers will pick up the new code.\n');
}
