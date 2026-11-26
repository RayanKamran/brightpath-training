import {Controller, HttpCode, HttpStatus, Post} from '@nestjs/common';
import {AdminSeedService, type SeedResult} from './admin-seed.service';

@Controller('admin')
export class AdminController {
  public constructor(private readonly _seedService: AdminSeedService) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  public async seed(): Promise<SeedResult> {
    return this._seedService.seed();
  }
}
