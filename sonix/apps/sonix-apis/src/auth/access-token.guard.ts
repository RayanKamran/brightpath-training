import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {extractBearerTokenFromHeaders} from './auth-utils';
import {createAuthInfo, validateJwt} from './jwt-validator';
import {IS_PUBLIC_KEY} from './public.decorator';

/**
 * NestJS Guard to validate Logto access tokens
 * Apply this to controllers or routes that need authentication
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly _reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this._reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();

    try {
      const token = extractBearerTokenFromHeaders(req.headers);
      const payload = await validateJwt(token);

      // Store auth info in request for use in controllers
      req.auth = createAuthInfo(payload);

      return true;
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) {
        const error = err as {status: number; message: string};
        if (error.status === 401) {
          throw new UnauthorizedException(error.message);
        }
        throw new ForbiddenException(error.message);
      }
      throw new UnauthorizedException('Invalid or missing token');
    }
  }
}
