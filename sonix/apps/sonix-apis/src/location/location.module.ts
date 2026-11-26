import {Module} from '@nestjs/common';
import {RavenDbModule} from '../infrastructure/ravendb/ravendb.module';
import {LogtoManagementClient} from '../user/logto-management.client';
import {LocationController} from './location.controller';
import {LocationService} from './location.service';
import {LocationDbService} from './location-db.service';
import {LocationsCacheService} from './locations-cache.service';

@Module({
  imports: [RavenDbModule],
  controllers: [LocationController],
  providers: [LocationService, LocationDbService, LocationsCacheService, LogtoManagementClient],
  exports: [LocationService, LocationDbService, LocationsCacheService],
})
export class LocationModule {}
