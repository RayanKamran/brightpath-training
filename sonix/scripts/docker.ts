#!/usr/bin/env tsx
/**
 * Docker Tools — interactive CLI for Docker Compose management
 *
 * Usage:
 *   npm run docker                → interactive menu
 *   npm run docker -- up          → start all containers (detached)
 *   npm run docker -- down        → stop and remove containers
 *   npm run docker -- status      → show container status
 */

import {execSync} from 'node:child_process';
import readline from 'node:readline';
import {BLUE, BOLD, NC, RED} from '../libs/shared/data-models/src/lib/constants/console-colors.js';
import {BIN_BASH_PATH} from '../libs/shared/data-models/src/lib/constants/constants.js';

const COMMANDS = {
  up: 'Start all containers (detached)',
  down: 'Stop and remove containers',
  purge: 'Stop containers and remove all volumes',
  status: 'Show container status',
} as const;

type Command = keyof typeof COMMANDS;

function exec(cmd: string): void {
  execSync(cmd, {stdio: 'inherit', shell: BIN_BASH_PATH});
}

function run(command: Command): void {
  switch (command) {
    case 'up': {
      exec('docker-compose up -d');
      break;
    }
    case 'down': {
      exec('docker-compose down');
      break;
    }
    case 'purge': {
      exec('docker-compose down -v');
      break;
    }
    case 'status': {
      exec('bash ./scripts/docker-status.sh');
      break;
    }
  }
}

function showMenu(): void {
  if (!process.stdin.isTTY) {
    console.error(`${RED}Interactive menu requires a TTY.${NC}`);
    console.error(`Pass a command directly: npm run docker -- <command>`);
    console.error(`Available: ${Object.keys(COMMANDS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n${BOLD}${BLUE}Docker Tools${NC}`);
  console.log('═'.repeat(55));

  const keys = Object.keys(COMMANDS) as Command[];
  for (const [i, key] of keys.entries()) {
    console.log(`  ${BLUE}${i + 1}.${NC} ${key.padEnd(10)} ${COMMANDS[key]}`);
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
