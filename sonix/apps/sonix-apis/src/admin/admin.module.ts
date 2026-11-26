import {Module} from '@nestjs/common';
import {RavenDbModule} from '../infrastructure/ravendb/ravendb.module';
import {AdminController} from './admin.controller';
import {AdminSeedService} from './admin-seed.service';

@Module({
  imports: [RavenDbModule],
  controllers: [AdminController],
  providers: [AdminSeedService],
})
export class AdminModule {}
