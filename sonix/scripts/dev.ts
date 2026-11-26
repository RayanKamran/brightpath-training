#!/usr/bin/env tsx
/**
 * Dev Tools — interactive CLI for starting the development environment
 *
 * Usage:
 *   npm run dev                  → interactive menu
 *   npm run dev -- start         → docker up → apis → web (full dev environment)
 *   npm run dev -- apis          → start sonix-apis dev server only
 *   npm run dev -- web           → start client-web dev server only
 *   npm run dev -- stop          → stop all dev servers
 *   npm run dev -- status        → show dev environment status
 *
 * Shortcuts in package.json:
 *   npm run dev:apis             → tsx scripts/dev.ts apis
 *   npm run dev:web              → tsx scripts/dev.ts web
 */

import {execSync, spawn} from 'node:child_process';
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
  start: 'Start full dev environment: docker → apis → web',
  apis: 'Start sonix-apis dev server only',
  web: 'Start client-web dev server only',
  stop: 'Stop all running dev servers',
  status: 'Show dev environment status',
} as const;

type Command = keyof typeof COMMANDS;

function exec(cmd: string): void {
  execSync(cmd, {stdio: 'inherit', shell: BIN_BASH_PATH});
}

function runStart(): void {
  // Step 1: Start Docker (blocking — must be up before apps start)
  console.log(`\n${BLUE}[1/3]${NC} Starting Docker containers...`);
  try {
    exec('docker-compose up -d');
    console.log(`${GREEN}✓ Docker containers running${NC}\n`);
  } catch {
    console.error(`${RED}✗ Docker failed to start — aborting${NC}`);
    process.exit(1);
  }

  // Step 2: Spawn sonix-apis (background, non-blocking)
  console.log(`${BLUE}[2/3]${NC} Starting sonix-apis...`);
  const apis = spawn('nx', ['serve', 'sonix-apis'], {
    stdio: 'inherit',
    shell: true,
    env: {...process.env, NODE_NO_WARNINGS: '1'},
  });

  apis.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n${RED}✗ sonix-apis exited unexpectedly with code ${code}${NC}`);
    }
  });

  // Step 3: Spawn client-web (background, non-blocking)
  console.log(`${BLUE}[3/3]${NC} Starting client-web...\n`);
  const web = spawn('nx', ['dev', 'client-web'], {
    stdio: 'inherit',
    shell: true,
  });

  web.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n${RED}✗ client-web exited unexpectedly with code ${code}${NC}`);
    }
  });

  console.log(`${GREEN}Dev environment starting — press Ctrl+C to stop all${NC}\n`);

  // Graceful shutdown on Ctrl+C
  process.on('SIGINT', () => {
    console.log(`\n${YELLOW}Stopping dev servers...${NC}`);
    apis.kill('SIGTERM');
    web.kill('SIGTERM');
    process.exit(0);
  });

  // Keep the process alive until both children exit
  Promise.all([
    new Promise<void>((resolve) => apis.on('exit', () => resolve())),
    new Promise<void>((resolve) => web.on('exit', () => resolve())),
  ]).then(() => {
    console.log(`\n${YELLOW}All dev servers have exited${NC}`);
    process.exit(0);
  });
}

function run(command: Command): void {
  switch (command) {
    case 'start': {
      runStart();
      break;
    }
    case 'apis': {
      exec('nx serve sonix-apis');
      break;
    }
    case 'web': {
      exec('nx dev client-web');
      break;
    }
    case 'stop': {
      exec('bash ./scripts/stop-dev-servers.sh');
      break;
    }
    case 'status': {
      exec('bash ./scripts/dev-status.sh');
      break;
    }
  }
}

function showMenu(): void {
  if (!process.stdin.isTTY) {
    console.error(`${RED}Interactive menu requires a TTY.${NC}`);
    console.error(`Pass a command directly: npm run dev -- <command>`);
    console.error(`Available: ${Object.keys(COMMANDS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n${BOLD}${BLUE}Dev Tools${NC}`);
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
