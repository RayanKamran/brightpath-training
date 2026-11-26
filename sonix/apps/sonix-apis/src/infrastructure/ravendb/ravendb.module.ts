import {Module} from '@nestjs/common';
import {RavenDocumentStoreProvider} from './document-store.provider';
import {RavenSessionFactory} from './session-factory';

@Module({
  providers: [RavenDocumentStoreProvider, RavenSessionFactory],
  exports: [RavenDocumentStoreProvider, RavenSessionFactory],
})
export class RavenDbModule {}
