#!/usr/bin/env tsx
/**
 * DMS Dev Tools — CLI dispatcher for infrequently-used utility commands
 *
 * Usage:
 *   npm run tools                         → show grouped help menu
 *   npm run tools -- <command>            → run command directly
 *
 * Examples:
 *   npm run tools -- logto:seed
 *   npm run tools -- misc:gen-erd
 *   npm run tools -- training:present
 *
 * Note: e2e commands → npm run e2e
 *       http commands → npm run http
 */

import {execSync} from 'node:child_process';

const RED = '\u001b[31m';
const BLUE = '\u001b[34m';
const BOLD = '\u001b[1m';
const DIM = '\u001b[2m';
const NC = '\u001b[0m';

function exec(cmd: string): void {
  execSync(cmd, {stdio: 'inherit', shell: '/bin/bash'});
}

type CommandEntry = {
  description: string;
  run: () => void;
};

type CommandGroup = {
  title: string;
  commands: Record<string, CommandEntry>;
};

const GROUPS: CommandGroup[] = [
  {
    title: 'LOGTO',
    commands: {
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
        run: () => exec('tsx scripts/sync-locations.ts'),
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
          exec('bash ./scripts/logto-import-db.sh ./logto/init_config/logto_db_init_config.sql'),
      },
      'logto:update-creds': {
        description: 'Update Logto credentials in .env',
        run: () => exec('bash ./scripts/update-logto-credentials.sh'),
      },
    },
  },
  {
    title: 'MISC',
    commands: {
      'misc:logo-data-url': {
        description: 'Convert logo SVG → base64 data URL',
        run: () =>
          exec('bash ./scripts/svg-to-data-uri.sh apps/client-web/public/dms-logo-2025.svg'),
      },
      init: {
        description: 'Copy .env.example → .env (first-time setup)',
        run: () => exec('cp -i .env.example .env'),
      },
    },
  },
  {
    title: 'TRAINING',
    commands: {
      'training:present': {
        description: 'Start Marp training slide presentation server',
        run: () =>
          exec(
            'npx @marp-team/marp-cli --theme docs/training/ids-training-marp-theme.css --html -s docs/training',
          ),
      },
      'training:gen-pdfs': {
        description: 'Export training slides as PDFs',
        run: () =>
          exec(
            'npx @marp-team/marp-cli slides --theme docs/training/ids-training-marp-theme.css --allow-local-files --pdf docs/training',
          ),
      },
      'training:gen-pptxs': {
        description: 'Export training slides as PPTXs',
        run: () =>
          exec(
            'npx @marp-team/marp-cli slides --theme docs/training/ids-training-marp-theme.css --allow-local-files --pptx docs/training',
          ),
      },
    },
  },
];

const ALL_COMMANDS: Record<string, CommandEntry> = Object.fromEntries(
  GROUPS.flatMap((g) => Object.entries(g.commands)),
);

function printHelp(): void {
  console.log(`\n${BOLD}${BLUE}DMS Dev Tools${NC}`);
  console.log('═'.repeat(60));

  for (const group of GROUPS) {
    console.log(`\n  ${BOLD}${group.title}${NC}`);
    for (const [name, entry] of Object.entries(group.commands)) {
      console.log(`    ${name.padEnd(26)} ${DIM}${entry.description}${NC}`);
    }
  }

  console.log(`\n${DIM}Usage: npm run tools -- <command>${NC}\n`);
}

const main = () => {
  const arg = process.argv[2];

  if (!arg) {
    printHelp();
    return;
  }

  const command = ALL_COMMANDS[arg];
  if (!command) {
    console.error(`${RED}Unknown command: ${arg}${NC}`);
    console.error(`Run ${BOLD}npm run tools${NC} to see all available commands.`);
    process.exit(1);
  }

  command.run();
};

main();
