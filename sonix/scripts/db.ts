#!/usr/bin/env tsx
/**
 * DB Dev Tools — interactive CLI for database management
 *
 * Usage:
 *   npm run db                     → interactive menu
 *   npm run db -- seed             → ensure db + sync locations + run seed
 *   npm run db -- clear            → clear all RavenDB documents
 *   npm run db -- full-reset       → clear + sync locations + seed
 *   npm run db -- count            → show current record counts
 */

import {execSync} from 'node:child_process';
import readline from 'node:readline';
import {
  BLUE,
  BOLD,
  GREEN,
  NC,
  RED,
  YELLOW,
} from '../libs/shared/data-models/src/lib/constants/console-colors.js';
import {BIN_BASH_PATH} from '../libs/shared/data-models/src/lib/constants/constants.js';

const COMMANDS = {
  seed: 'Sync locations + run seed data',
  clear: `Clear all RavenDB documents  ${YELLOW}⚠ DESTRUCTIVE${NC}`,
  'full-reset': `Clear + sync locations + seed  ${YELLOW}⚠ DESTRUCTIVE${NC}`,
  count: 'Show current record counts',
} as const;

type Command = keyof typeof COMMANDS;

function exec(cmd: string): void {
  execSync(cmd, {stdio: 'inherit', shell: BIN_BASH_PATH});
}

function confirm(message: string): Promise<boolean> {
  const readLineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    readLineInterface.question(`${YELLOW}${message} (y/N): ${NC}`, (answer) => {
      readLineInterface.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

function doEnsureDb(): void {
  console.log(`\n${BLUE}Ensuring RavenDB database exists...${NC}`);
  exec('tsx scripts/ensure_dms_sonix_db_exists.ts');
}

function doClear(): void {
  console.log(`\n${BLUE}Clearing RavenDB documents...${NC}`);
  exec('tsx scripts/clear-ravendb.ts');
  console.log(`${GREEN}✓ RavenDB cleared${NC}`);
}

function doSyncLocations(): void {
  console.log(`\n${BLUE}Syncing locations from Logto...${NC}`);
  exec('tsx scripts/sync-from-logto.ts');
}

async function run(command: Command, autoYes = false): Promise<void> {
  switch (command) {
    case 'seed': {
      doEnsureDb();
      doSyncLocations();
      console.log(`\n${BLUE}Running seed data...${NC}`);
      exec('node scripts/run-seed.cjs');
      break;
    }
    case 'clear': {
      const ok: boolean =
        autoYes || (await confirm('This will clear all RavenDB documents. Are you sure?'));
      if (!ok) {
        console.log('Aborted.');
        return;
      }
      doEnsureDb();
      doClear();
      break;
    }
    case 'full-reset': {
      const ok: boolean =
        autoYes ||
        (await confirm(
          'This will clear all RavenDB documents, sync locations, and run seed. Are you sure?',
        ));
      if (!ok) {
        console.log('Aborted.');
        return;
      }
      doEnsureDb();
      doClear();
      doSyncLocations();
      console.log(`\n${BLUE}Running seed data...${NC}`);
      exec('node scripts/run-seed.cjs');
      console.log(`\n${GREEN}✓ Full reset complete${NC}`);
      break;
    }
    case 'count': {
      exec('SEED_COUNT_ONLY=true node scripts/run-seed.cjs');
      break;
    }
  }
}

async function showMenu(): Promise<void> {
  if (!process.stdin.isTTY) {
    console.error(`${RED}Interactive menu requires a TTY.${NC}`);
    console.error(`Pass a command directly: npm run db -- <command>`);
    console.error(`Available: ${Object.keys(COMMANDS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n${BOLD}${BLUE}DB Dev Tools${NC}`);
  console.log('═'.repeat(55));

  const keys = Object.keys(COMMANDS) as Command[];
  for (const [i, key] of keys.entries()) {
    const desc = COMMANDS[key];
    console.log(`  ${BLUE}${i + 1}.${NC} ${key.padEnd(18)} ${desc}`);
  }
  console.log('');

  const readLineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readLineInterface.question(
    `Select option (1-${keys.length}) or Ctrl+C to exit: `,
    async (answer) => {
      readLineInterface.close();
      const index = Number.parseInt(answer, 10) - 1;
      if (index >= 0 && index < keys.length) {
        await run(keys[index]);
      } else {
        console.log(`${RED}Invalid option${NC}`);
      }
    },
  );
}

const main = async () => {
  const args = process.argv.slice(2);
  const arg = args[0] as Command | undefined;
  const autoYes = args.includes('--yes') || args.includes('-y');

  if (arg) {
    if (!(arg in COMMANDS)) {
      console.error(`${RED}Unknown command: ${arg}${NC}`);
      console.error(`Available: ${Object.keys(COMMANDS).join(', ')}`);
      process.exit(1);
    }
    await run(arg, autoYes);
  } else {
    await showMenu();
  }
};

main().catch((err) => {
  console.error(`${RED}Error:${NC}`, err instanceof Error ? err.message : err);
  process.exit(1);
});
