import 'dotenv/config';
import {CreateDatabaseOperation, DocumentStore, GetDatabaseRecordOperation} from 'ravendb';

async function ensureIdsDmsDatabase(): Promise<void> {
  const url = process.env.RAVENDB_URL || 'http://localhost:8080';
  const database = process.env.RAVENDB_DATABASE || 'dms_sonix';

  const store = new DocumentStore(url, database);
  store.initialize();

  try {
    const existingDatabaseRecord = await store.maintenance.server.send(
      new GetDatabaseRecordOperation(database),
    );

    if (existingDatabaseRecord) {
      console.log(`RavenDB database already exists: ${database}`);
      return;
    }

    await store.maintenance.server.send(
      new CreateDatabaseOperation({
        databaseName: database,
      }),
    );

    console.log(`Created RavenDB database: ${database}`);
  } finally {
    store.dispose();
  }
}

ensureIdsDmsDatabase().catch((error: unknown) => {
  console.error('Failed to ensure RavenDB database exists.', error);
  process.exit(1);
});
