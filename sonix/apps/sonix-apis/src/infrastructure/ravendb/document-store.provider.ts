import {Injectable, OnModuleDestroy} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {DocumentStore, type IDocumentStore} from 'ravendb';

const inferCollectionFromDocumentId = (entity: object): string => {
  const withId = entity as {id?: unknown};
  if (typeof withId.id !== 'string') {
    return 'objects';
  }

  const [prefix] = withId.id.split('/');
  if (!prefix) {
    return 'objects';
  }

  return prefix.toLowerCase();
};

@Injectable()
export class RavenDocumentStoreProvider implements OnModuleDestroy {
  private readonly _store: IDocumentStore;

  public constructor(private readonly _config: ConfigService) {
    const url = this._config.get<string>('RAVENDB_URL') ?? 'http://localhost:8080';
    const database = this._config.get<string>('RAVENDB_DATABASE') ?? 'dms_sonix';
    this._store = new DocumentStore(url, database);
    this._store.conventions.findCollectionNameForObjectLiteral = inferCollectionFromDocumentId;
    this._store.initialize();
  }

  public getStore(): IDocumentStore {
    return this._store;
  }

  public async onModuleDestroy(): Promise<void> {
    this._store.dispose();
  }
}
