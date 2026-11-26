import {Module} from '@nestjs/common';
import {AccessTokenGuard} from './access-token.guard';

@Module({
  providers: [AccessTokenGuard],
  exports: [AccessTokenGuard],
})
export class AuthModule {}
