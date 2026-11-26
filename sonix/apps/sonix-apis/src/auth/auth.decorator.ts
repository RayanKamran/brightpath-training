import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import {AuthInfo} from './auth-utils';

/**
 * Custom decorator to extract AuthInfo from request
 * Usage: @Auth() auth: AuthInfo
 */
export const Auth = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthInfo => {
  const request = ctx.switchToHttp().getRequest();
  return request.auth;
});
