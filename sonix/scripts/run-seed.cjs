#!/usr/bin/env node
/**
 * Seed runner - uses RavenDB session-based seeding
 *
 * IMPORTANT: The API server must be running before executing this script.
 * Start the API server with: npm run dev:apis
 */

const {spawn} = require('node:child_process');
const path = require('node:path');

// Use tsx with tsconfig that uses CommonJS
const rootDir = path.join(__dirname, '..');
const seedScript = path.join(rootDir, 'database', 'seed-runner.ts');
const tsconfig = path.join(rootDir, 'tsconfig.seeder.json');

const child = spawn('npx', ['tsx', '--tsconfig', tsconfig, seedScript], {
  stdio: 'inherit',
  shell: true,
  cwd: rootDir,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
