import {killPort, waitForPortOpen} from '@nx/node/utils';

let __TEARDOWN_MESSAGE__: string;

export default async function setup() {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await waitForPortOpen(port, {host});

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';

  // Return teardown function that Vitest will call after all tests
  return async function teardown() {
    // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
    await killPort(port);
    console.log(globalThis.__TEARDOWN_MESSAGE__);
  };
}
