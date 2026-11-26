import {Controller, Get} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Public} from '../auth/public.decorator';

@ApiTags('system-health')
@Controller('SystemHealth')
export class SystemHealthController {
  @Public()
  @Get('ping')
  @ApiOperation({summary: 'Health check ping'})
  @ApiResponse({status: 200, description: 'Service is alive'})
  public ping() {
    return {
      message: 'pong',
    };
  }

  @Public()
  @Get('server-time')
  @ApiOperation({summary: 'Get current server time'})
  @ApiResponse({status: 200, description: 'Current server timestamp'})
  public serverTime() {
    return {
      serverTime: new Date().toISOString(),
    };
  }
}
