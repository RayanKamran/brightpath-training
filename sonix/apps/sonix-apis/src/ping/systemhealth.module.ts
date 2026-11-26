import {Module} from '@nestjs/common';
import {SystemHealthController} from './systemhealth.controller';

@Module({
  controllers: [SystemHealthController],
})
export class SystemHealthModule {}
