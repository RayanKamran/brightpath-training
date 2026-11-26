#!/usr/bin/env tsx

import {execSync} from 'node:child_process';
import process from 'node:process';
import {createInterface} from 'node:readline/promises';
import {BLUE, BOLD, NC, RED} from '../libs/shared/data-models/src/lib/constants/console-colors.js';
import {BIN_BASH_PATH} from '../libs/shared/data-models/src/lib/constants/constants.js';

const DIM = '\u001b[2m';

type CommandEntry = {
  description: string;
  run: () => void;
};

const COMMANDS: Record<string, CommandEntry> = {
  'logto:seed': {
    description: 'Seed Logto with test users and organizations',
    run: () => exec('tsx scripts/seed-logto.ts'),
  },
  'logto:seed:clean': {
    description: 'Remove Logto seed data',
    run: () => exec('tsx scripts/seed-logto.ts --clean'),
  },
  'logto:sync': {
    description: 'Sync Logto organizations → DMS DB locations',
    run: () => exec('tsx scripts/sync-from-logto.ts'),
  },
  'logto:db:export': {
    description: 'Export Logto DB backup',
    run: () => exec('bash ./scripts/logto-export-db.sh'),
  },
  'logto:db:export-init': {
    description: 'Export Logto init config snapshot',
    run: () => exec('bash ./scripts/logto-export-db.sh -IC'),
  },
  'logto:db:import-init': {
    description: 'Import Logto init config snapshot',
    run: () =>
      exec('bash ./scripts/logto-import-db.sh ./logto/init_config/logto_db_init_config.sql --yes'),
  },
  'logto:update-creds': {
    description: 'Update Logto credentials in .env',
    run: () => exec('bash ./scripts/update-logto-credentials.sh'),
  },
  'logto:logo-data-url': {
    description: 'Convert logo SVG → base64 data URL',
    run: () => exec('bash ./scripts/svg-to-data-uri.sh apps/client-web/public/dms-logo-2025.svg'),
  },
};

const COMMAND_KEYS = Object.keys(COMMANDS);

function exec(cmd: string): void {
  execSync(cmd, {stdio: 'inherit', shell: BIN_BASH_PATH});
}

function printMenu(): void {
  console.log(`\n${BOLD}${BLUE}LOGTO Commands${NC}`);
  console.log('═'.repeat(60));

  COMMAND_KEYS.forEach((key, index) => {
    const number: string = String(index + 1).padStart(2, ' ');
    console.log(` ${number}) ${key.padEnd(24)} ${DIM}${COMMANDS[key].description}${NC}`);
  });

  console.log(` ${String(COMMAND_KEYS.length + 1).padStart(2, ' ')}) Exit`);
}

function printHelp(): void {
  console.log(`\n${BOLD}${BLUE}Usage${NC}`);
  console.log(`  npm run logto            ${DIM}# interactive menu${NC}`);
  console.log(`  npm run logto -- <cmd>   ${DIM}# direct command${NC}`);
  console.log(`\n${BOLD}Available commands${NC}`);

  for (const key of COMMAND_KEYS) {
    console.log(`  - ${key.padEnd(24)} ${DIM}${COMMANDS[key].description}${NC}`);
  }

  console.log();
}

function runCommand(commandName: string): void {
  const command: CommandEntry = COMMANDS[commandName];

  if (!command) {
    console.error(`${RED}Unknown command: ${commandName}${NC}`);
    printHelp();
    process.exit(1);
  }

  command.run();
}

async function runInteractive(): Promise<void> {
  const readLineInterface = createInterface({input: process.stdin, output: process.stdout});

  try {
    while (true) {
      printMenu();
      const answer: string = (await readLineInterface.question('\nSelect an option: ')).trim();
      const choiceNumber: number = Number(answer);
      const exitNumber: number = COMMAND_KEYS.length + 1;

      if (!Number.isInteger(choiceNumber) || choiceNumber < 1 || choiceNumber > exitNumber) {
        console.log(`${RED}Invalid selection.${NC}`);
        continue;
      }

      if (choiceNumber === exitNumber) {
        console.log(`${DIM}Exiting LOGTO menu.${NC}`);
        return;
      }

      const selectedCommand: string = COMMAND_KEYS[choiceNumber - 1];
      console.log(`\n${BOLD}Running:${NC} ${selectedCommand}`);
      runCommand(selectedCommand);
    }
  } finally {
    readLineInterface.close();
  }
}

const arg: string | undefined = process.argv[2];

if (arg) {
  runCommand(arg);
} else {
  await runInteractive();
}
