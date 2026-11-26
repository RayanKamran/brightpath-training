import {Module} from '@nestjs/common';
import {RavenDbModule} from '../infrastructure/ravendb/ravendb.module';
import {PartController} from './part.controller';
import {PartService} from './part.service';

@Module({
  imports: [RavenDbModule],
  controllers: [PartController],
  providers: [PartService],
  exports: [PartService],
})
export class PartModule {}
