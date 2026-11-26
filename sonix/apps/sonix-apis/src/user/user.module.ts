import {Module} from '@nestjs/common';
import {RavenDbModule} from '../infrastructure/ravendb/ravendb.module';
import {LocationModule} from '../location/location.module';
import {LogtoManagementClient} from './logto-management.client';
import {UserController} from './user.controller';
import {UserService} from './user.service';

@Module({
  imports: [RavenDbModule, LocationModule],
  controllers: [UserController],
  providers: [UserService, LogtoManagementClient],
  exports: [UserService],
})
export class UserModule {}
