import 'dotenv/config';
import {DeleteByQueryOperation, DocumentStore} from 'ravendb';

const COLLECTIONS = [
  'bins',
  'uoms',
  'customers',
  'locations',
  'parts',
  'part-locations',
  'part-vendors',
  'users',
  'vendors',
];

async function main(): Promise<void> {
  const store = new DocumentStore(
    process.env.RAVENDB_URL || 'http://localhost:8080',
    process.env.RAVENDB_DATABASE || 'dms_sonix',
  );
  store.initialize();

  try {
    for (const collection of COLLECTIONS) {
      const op = await store.operations.send(new DeleteByQueryOperation(`from '${collection}'`));
      await op.waitForCompletion();
      console.log(`  Cleared: ${collection}`);
    }
    console.log('RavenDB demo collections cleared.');
  } finally {
    store.dispose();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
