# Authentication with Logto

This directory contains the JWT authentication implementation for the sonix-apis, following the [Logto NestJS guide](https://docs.logto.io/api-protection/nodejs/nestjs).

## Overview

All API endpoints are protected by default and require a valid Logto access token. The `AccessTokenGuard` is applied globally to all routes.

## How It Works

1. Client obtains an access token from Logto (via sign-in flow)
2. Client includes token in `Authorization` header: `Bearer <access_token>`
3. Guard validates the JWT signature, issuer, and expiration
4. If valid, request proceeds with `req.auth` populated with user info
5. If invalid/missing, returns 401 Unauthorized or 403 Forbidden

## Files

- `access-token.guard.ts` - NestJS guard that validates JWT tokens
- `jwt-validator.ts` - JWT validation logic using `jose` library
- `auth-utils.ts` - Utilities for token extraction and error handling
- `auth.decorator.ts` - Decorator to inject auth info into route handlers
- `public.decorator.ts` - Decorator to mark routes as public (no auth required)
- `auth.module.ts` - NestJS module that exports auth components

## Usage

### Protected Routes (Default)

All routes are protected by default. No additional code needed:

```typescript
import {Controller, Get} from '@nestjs/common';
import {Auth, AuthInfo} from '../auth';

@Controller('customer')
export class CustomerController {
  @Get()
  findAll(@Auth() auth: AuthInfo) {
    // Access authenticated user info
    console.log('User ID:', auth.sub);
    console.log('Scopes:', auth.scopes);
    console.log('Organization:', auth.organizationId);
    
    return this.customerService.findAll();
  }
}
```

### Public Routes

Mark routes that should be accessible without authentication:

```typescript
import {Controller, Post} from '@nestjs/common';
import {Public} from '../auth';

@Controller('user')
export class UserController {
  @Public()
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    // This endpoint does not require authentication
    return this.userService.register(dto);
  }
}
```

### Accessing Auth Info

Use the `@Auth()` decorator to inject authentication information:

```typescript
import {Auth, AuthInfo} from '../auth';

@Get(':id')
getCustomer(@Param('id') id: string, @Auth() auth: AuthInfo) {
  // auth.sub - User ID (subject)
  // auth.clientId - Client application ID
  // auth.organizationId - Organization ID (if applicable)
  // auth.scopes - Array of permissions
  // auth.audience - Array of audiences
  
  return this.customerService.findOne(id, auth.sub);
}
```

## Configuration

Environment variables (set in `.env` or `.env.local`):

```bash
LOGTO_ENDPOINT=http://localhost:3001
```

The guard automatically uses:
- JWKS URI: `${LOGTO_ENDPOINT}/oidc/jwks`
- Issuer: `${LOGTO_ENDPOINT}/oidc`

## Permission Models

The current implementation supports basic JWT validation. To add permission checks:

### Option 1: Validate Audience (API Resources)

Edit `jwt-validator.ts` to check the audience claim:

```typescript
function verifyPayload(payload: JWTPayload): void {
  const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
  
  if (!audiences.includes('https://api.your-app.com')) {
    throw new AuthorizationError('Invalid audience');
  }
}
```

### Option 2: Validate Scopes (Permissions)

Edit `jwt-validator.ts` to check required scopes:

```typescript
function verifyPayload(payload: JWTPayload): void {
  const requiredScopes = ['read:customers', 'write:customers'];
  const scopes = (payload.scope as string)?.split(' ') ?? [];
  
  if (!requiredScopes.every((scope) => scopes.includes(scope))) {
    throw new AuthorizationError('Insufficient permissions');
  }
}
```

### Option 3: Per-Route Permission Checks

Create a custom decorator for specific permission requirements:

```typescript
// permissions.guard.ts
import {SetMetadata} from '@nestjs/common';

export const REQUIRED_SCOPES_KEY = 'requiredScopes';
export const RequireScopes = (...scopes: string[]) => SetMetadata(REQUIRED_SCOPES_KEY, scopes);

// Usage in controller:
@RequireScopes('read:customers', 'write:customers')
@Get()
findAll(@Auth() auth: AuthInfo) {
  // Only accessible if user has required scopes
}
```

## Testing

### Get an Access Token

From your React app's browser console:

```javascript
// After signing in, extract token from localStorage or network tab
const token = localStorage.getItem('access_token');
console.log(token);
```

### Test with curl

```bash
curl -H "Authorization: Bearer <your-access-token>" \
  http://localhost:3000/api/customer
```

### Test with Postman

1. Set Authorization Type to "Bearer Token"
2. Paste your access token
3. Send request

### Expected Responses

**Valid Token (200 OK)**:
```json
{
  "data": [...],
  "message": "Success"
}
```

**Missing Token (401 Unauthorized)**:
```json
{
  "statusCode": 401,
  "message": "Authorization header is missing"
}
```

**Invalid Token (401 Unauthorized)**:
```json
{
  "statusCode": 401,
  "message": "Invalid or missing token"
}
```

**Insufficient Permissions (403 Forbidden)**:
```json
{
  "statusCode": 403,
  "message": "Insufficient scope"
}
```

## Troubleshooting

### "Authorization header is missing"

- Ensure client sends `Authorization: Bearer <token>` header
- Check token is being extracted properly in client app

### "Invalid or missing token"

- Token may be expired (check token `exp` claim)
- Token signature verification failed (check LOGTO_ENDPOINT matches issuer)
- Decode token at https://logto.io/jwt-decoder to inspect claims

### "JWKS URI not reachable"

- Ensure Logto is running: `docker ps | grep logto`
- Check LOGTO_ENDPOINT environment variable
- Verify network connectivity to Logto

## Security Notes

- **Never** commit `.env.local` files containing secrets
- Tokens are validated against Logto's public keys (JWKS)
- Token expiration is checked automatically
- Guard is applied globally - mark exceptions with `@Public()`
- For production, consider:
  - Rate limiting on authentication endpoints
  - Logging failed authentication attempts
  - Monitoring for suspicious patterns
  - Implementing refresh token rotation

## Further Reading

- [Logto NestJS Guide](https://docs.logto.io/api-protection/nodejs/nestjs)
- [JWT Best Practices](https://auth.wiki/jwt)
- [Role-Based Access Control](https://docs.logto.io/authorization/role-based-access-control)
