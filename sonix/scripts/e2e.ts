#!/usr/bin/env tsx
/**
 * E2E Test Tools — interactive CLI for end-to-end tests
 *
 * Usage:
 *   npm run e2e                        → interactive menu
 *   npm run e2e -- apis                → run API e2e tests
 *   npm run e2e -- web                 → run all web e2e tests
 *   npm run e2e -- web:chromium        → run chromium only
 *   npm run e2e -- web:headed          → run headed (visible browser)
 *   npm run e2e -- show-report         → open last Playwright report
 */

import {execSync} from 'node:child_process';
import readline from 'node:readline';
import {BLUE, BOLD, NC, RED} from '../libs/shared/data-models/src/lib/constants/console-colors.js';
import {BIN_BASH_PATH} from '../libs/shared/data-models/src/lib/constants/constants.js';

const COMMANDS = {
  apis: 'Run API e2e tests (nx + vitest)',
  web: 'Run all web e2e tests (Playwright, all browsers)',
  'web:chromium': 'Run web e2e — chromium only',
  'web:headed': 'Run web e2e — headed (visible browser)',
  'show-report': 'Open last Playwright HTML report',
} as const;

type Command = keyof typeof COMMANDS;

function exec(cmd: string): void {
  execSync(cmd, {stdio: 'inherit', shell: BIN_BASH_PATH});
}

function run(command: Command): void {
  switch (command) {
    case 'apis': {
      exec('nx e2e sonix-apis-e2e');
      break;
    }
    case 'web': {
      exec('cd apps/client-web-e2e && npx playwright test');
      break;
    }
    case 'web:chromium': {
      exec('cd apps/client-web-e2e && npx playwright test --project=chromium');
      break;
    }
    case 'web:headed': {
      exec('cd apps/client-web-e2e && npx playwright test --project=chromium --headed');
      break;
    }
    case 'show-report': {
      exec('cd apps/client-web-e2e && npx playwright show-report');
      break;
    }
  }
}

function showMenu(): void {
  if (!process.stdin.isTTY) {
    console.error(`${RED}Interactive menu requires a TTY.${NC}`);
    console.error(`Pass a command directly: npm run e2e -- <command>`);
    console.error(`Available: ${Object.keys(COMMANDS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n${BOLD}${BLUE}E2E Test Tools${NC}`);
  console.log('═'.repeat(55));

  const keys = Object.keys(COMMANDS) as Command[];
  for (const [i, key] of keys.entries()) {
    console.log(`  ${BLUE}${i + 1}.${NC} ${key.padEnd(18)} ${COMMANDS[key]}`);
  }
  console.log('');

  const readLineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readLineInterface.question(`Select option (1-${keys.length}) or Ctrl+C to exit: `, (answer) => {
    readLineInterface.close();
    const index: number = Number.parseInt(answer, 10) - 1;
    if (index >= 0 && index < keys.length) {
      run(keys[index]);
    } else {
      console.log(`${RED}Invalid option${NC}`);
    }
  });
}

const arg = process.argv[2] as Command | undefined;
if (arg) {
  if (!(arg in COMMANDS)) {
    console.error(`${RED}Unknown command: ${arg}${NC}`);
    console.error(`Available: ${Object.keys(COMMANDS).join(', ')}`);
    process.exit(1);
  }
  run(arg);
} else {
  showMenu();
}
