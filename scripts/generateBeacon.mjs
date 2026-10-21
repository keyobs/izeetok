import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { writeBeaconManifest } from '@keyobs/pulsepit-beacon/static';

const root = fileURLToPath(new URL('../', import.meta.url));
const app = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

function checkoutCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

// Pages supplies PULSEPIT_ENV;
// The checkout SHA is used locally and for manually selected Pages refs.
const environment = process.env.PULSEPIT_ENV || process.env.VERCEL_ENV || 'development';
await writeBeaconManifest(
  fileURLToPath(new URL('../dist/pulsepit-deployment.json', import.meta.url)),
  {
    name: app.name,
    version: app.version,
    env: environment,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || checkoutCommit(),
    // A build timestamp is not a deployment timestamp.
    deployedAt: null,
  },
);
console.log('Pulsepit deployment metadata generated.');
