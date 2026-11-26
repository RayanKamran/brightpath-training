# Locations Cache Service

## Overview

The `LocationsCacheService` provides a high-performance in-memory cache of all Logto organizations (which represent DMS Locations in our system). This service:

- **Automatically loads** all organizations from Logto on server startup
- **Provides fast lookups** by location ID or name
- **Can be refreshed** on-demand while the server is running
- **Minimizes direct "organization" terminology** by encapsulating it within the cache

## Purpose

This cache was created to:

1. **Improve performance**: Avoid repeated API calls to Logto for organization lookups
2. **Enable validation**: Quickly verify if a location exists and get its details
3. **Provide consistency**: Single source of truth for location data across the application
4. **Abstract terminology**: Hide Logto's "organization" concept behind our "location" domain terminology

## Usage

### In Services

```typescript
import {Injectable} from '@nestjs/common';
import {LocationsCacheService} from '../location/locations-cache.service';

@Injectable()
export class MyService {
  constructor(private readonly locationsCache: LocationsCacheService) {}

  async myMethod(locationId: string) {
    // Look up a location by ID
    const location = this.locationsCache.getById(locationId);
    
    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }

    console.log(`Working with location: ${location.name}`);
  }
}
```

### With AuthInfo

The `AuthInfo` class now provides helper methods to work with locations:

```typescript
import {AuthInfo} from '../auth';
import {LocationsCacheService} from '../location/locations-cache.service';

@Injectable()
export class CustomerService {
  constructor(private readonly locationsCache: LocationsCacheService) {}

  async findOne(id: string, auth?: AuthInfo): Promise<Customer> {
    // Use AuthInfo helper methods
    if (auth?.locationId) {
      const location = this.locationsCache.getById(auth.locationId);
      
      if (!location) {
        throw new ForbiddenException('Access denied: Invalid location');
      }

      // Use location name in logs instead of raw ID
      console.log(`User accessing customer from location: ${location.name}`);
    }

    // ... rest of method
  }
}
```

## API Methods

### `getById(locationId: string): Location | null`

Look up a location by its ID (Logto organization ID).

```typescript
const location = locationsCache.getById('i5fjpgjjfon8');
// Returns: { id: 'i5fjpgjjfon8', name: 'ACME Location AAA', ... } or null
```

### `getByName(name: string): Location | null`

Look up a location by name (case-insensitive).

```typescript
const location = locationsCache.getByName('ACME Location AAA');
// Returns: { id: 'i5fjpgjjfon8', name: 'ACME Location AAA', ... } or null
```

### `getAll(): Location[]`

Get all cached locations.

```typescript
const allLocations = locationsCache.getAll();
// Returns: Array of all location objects
```

### `exists(locationId: string): boolean`

Check if a location exists without retrieving it.

```typescript
if (locationsCache.exists(locationId)) {
  // Location exists in cache
}
```

### `refresh(): Promise<void>`

Manually refresh the cache by reloading all organizations from Logto.

```typescript
await locationsCache.refresh();
```

### `getCacheInfo(): CacheInfo`

Get metadata about the cache state.

```typescript
const info = locationsCache.getCacheInfo();
// Returns: { count: 5, lastLoadedAt: Date, isLoading: false }
```

## HTTP Endpoints

### Refresh Cache

```bash
POST /api/locations/cache/refresh
```

Manually trigger a cache refresh. Useful after adding/modifying organizations in Logto.

**Response:**
```json
{
  "success": true,
  "message": "Cache refreshed successfully. Loaded 5 locations.",
  "cacheInfo": {
    "count": 5,
    "lastLoadedAt": "2025-12-02T10:30:00.000Z",
    "isLoading": false
  }
}
```

### Get Cache Info

```bash
GET /api/locations/cache/info
```

Get information about the current cache state.

**Response:**
```json
{
  "count": 5,
  "lastLoadedAt": "2025-12-02T10:30:00.000Z",
  "isLoading": false
}
```

## Lifecycle

The cache is automatically initialized when the NestJS application starts:

1. **Server starts** → `onModuleInit()` is called
2. **Cache loads** → All organizations fetched from Logto
3. **Cache ready** → Lookups are now fast and in-memory
4. **Manual refresh** → Can be triggered via HTTP endpoint or service method

## Module Integration

To use the `LocationsCacheService` in your module:

```typescript
import {Module} from '@nestjs/common';
import {LocationModule} from '../location/location.module';

@Module({
  imports: [
    LocationModule, // Import to access LocationsCacheService
  ],
  // ... your module config
})
export class YourModule {}
```

The service is automatically exported from `LocationModule`.

## Performance Characteristics

- **Initial load**: ~100-500ms (depends on number of organizations and network latency)
- **Lookup by ID**: O(1) - constant time via Map
- **Lookup by name**: O(1) - constant time via Map (case-insensitive)
- **Memory usage**: Minimal - typically < 1MB for hundreds of locations

## Error Handling

The cache service handles errors gracefully:

- **Load failure on startup**: Error is logged and thrown (server won't start)
- **Refresh failure**: Error is logged and thrown (existing cache remains intact)
- **Concurrent refresh**: Subsequent requests are ignored while refresh is in progress

## Best Practices

1. **Use cache for validation**: Check if locations exist before using them
2. **Use AuthInfo helpers**: Prefer `auth.locationId` over `auth.organizationId`
3. **Refresh after changes**: Call refresh endpoint after modifying organizations in Logto
4. **Log with names**: Use location names in logs instead of IDs for better readability

## Example: CustomerService Integration

```typescript
@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly locationsCache: LocationsCacheService,
  ) {}

  async findOne(id: string, auth?: AuthInfo): Promise<Customer> {
    // Validate user's location access
    if (auth?.locationId) {
      const location = this.locationsCache.getById(auth.locationId);
      
      if (!location) {
        throw new ForbiddenException(
          `Access denied: Location '${auth.locationId}' not found`
        );
      }

      // Log with meaningful location name
      console.log(
        `User ${auth.userId} accessing customer ${id} from location '${location.name}'`
      );
    }

    // ... rest of method
  }
}
```

## Related Files

- **Service**: `src/location/locations-cache.service.ts`
- **Controller**: `src/location/location.controller.ts` (cache endpoints)
- **Module**: `src/location/location.module.ts`
- **DTOs**: `src/location/dto/location.dto.ts`
- **Auth Utils**: `src/auth/auth-utils.ts` (AuthInfo helpers)
