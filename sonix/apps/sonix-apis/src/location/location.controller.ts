import type {PagedResponseDto} from '@dms/data-models';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {Auth} from '../auth/auth.decorator';
import {AuthInfo} from '../auth/auth-utils';
import {LocationCreateDto, LocationCreateResponseDto} from './dto/location-create.dto';
import {LocationListQueryDto, LocationListResponseDto} from './dto/location-list.query.dto';
import {LocationUpdateDto, LocationUpdateResponseDto} from './dto/location-update.dto';
import {LocationService} from './location.service';
import {LocationDbService} from './location-db.service';
import {LocationsCacheService} from './locations-cache.service';

@ApiTags('location')
@ApiBearerAuth()
@Controller('locations')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly locationsCache: LocationsCacheService,
    private readonly locationDbService: LocationDbService,
  ) {}

  /**
   * GET /api/locations
   */
  @Get()
  @ApiOperation({
    summary: 'Get user locations',
    description: 'Retrieve all locations the authenticated user has access to',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user locations with roles',
    type: [LocationListResponseDto],
  })
  async getUserLocations(@Auth() auth: AuthInfo): Promise<LocationListResponseDto[]> {
    return await this.locationService.getUserLocations(auth.sub);
  }

  /**
   * POST /api/locations/cache/refresh
   */
  @Post('cache/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh cache',
    description: 'Manually refresh the locations cache from database',
  })
  @ApiResponse({status: 200, description: 'Cache refreshed successfully'})
  async refreshCache(): Promise<{
    success: boolean;
    message: string;
    cacheInfo: {
      count: number;
      lastLoadedAt: Date | null;
      isLoading: boolean;
    };
  }> {
    await this.locationsCache.refresh();
    const cacheInfo = this.locationsCache.getCacheInfo();

    return {
      success: true,
      message: `Cache refreshed successfully. Loaded ${cacheInfo.count} locations.`,
      cacheInfo,
    };
  }

  /**
   * GET /api/locations/cache/info
   */
  @Get('cache/info')
  @ApiOperation({
    summary: 'Get cache info',
    description: 'Get information about the locations cache',
  })
  @ApiResponse({status: 200, description: 'Cache information retrieved'})
  async getCacheInfo(): Promise<{
    count: number;
    lastLoadedAt: Date | null;
    isLoading: boolean;
  }> {
    return this.locationsCache.getCacheInfo();
  }

  /**
   * POST /api/locations/db
   */
  @Post('db')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({summary: 'Create location', description: 'Create a new location in the database'})
  @ApiResponse({
    status: 201,
    description: 'Location created successfully',
    type: LocationCreateResponseDto,
  })
  @ApiResponse({status: 400, description: 'Invalid input'})
  @ApiResponse({status: 409, description: 'Location already exists'})
  async createDbLocation(
    @Body() dto: LocationCreateDto,
    @Auth() auth: AuthInfo,
  ): Promise<LocationCreateResponseDto> {
    return await this.locationDbService.create(dto, auth.sub);
  }

  /**
   * GET /api/locations/db
   */
  @Get('db')
  @ApiOperation({
    summary: 'List all locations',
    description: 'Get all locations from database with optional filtering',
  })
  @ApiResponse({status: 200, description: 'Paginated list of locations'})
  async findAllDbLocations(
    @Query() query: LocationListQueryDto,
  ): Promise<PagedResponseDto<LocationCreateResponseDto>> {
    return await this.locationDbService.findAll({
      active: query.active === 'true' ? true : query.active === 'false' ? false : undefined,
      searchTerm: query.searchTerm,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  /**
   * GET /api/locations/db/:id
   */
  @Get('db/:id')
  @ApiOperation({
    summary: 'Get location by ID',
    description: 'Retrieve a single location by its UUID',
  })
  @ApiResponse({status: 200, description: 'Location found', type: LocationCreateResponseDto})
  @ApiResponse({status: 404, description: 'Location not found'})
  async findOneDbLocation(@Param('id') id: string): Promise<LocationCreateResponseDto> {
    return await this.locationDbService.findOne(id);
  }

  /**
   * POST /api/locations/sync/from-logto
   */
  @Post('sync/from-logto')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync from Logto',
    description: 'Synchronize all Logto Organizations to database locations',
  })
  @ApiResponse({status: 200, description: 'Sync completed successfully'})
  async syncFromLogto(@Auth() auth: AuthInfo): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    message: string;
  }> {
    const result = await this.locationDbService.syncAllFromLogto(auth.sub);
    return {
      success: true,
      synced: result.synced,
      failed: result.failed,
      message: `Synchronized ${result.synced} locations from Logto. ${result.failed} failed.`,
    };
  }

  /**
   * PATCH /api/locations/db/:id
   */
  @Patch('db/:id')
  @ApiOperation({summary: 'Update location', description: 'Update an existing location'})
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: LocationUpdateResponseDto,
  })
  @ApiResponse({status: 400, description: 'Invalid input'})
  @ApiResponse({status: 404, description: 'Location not found'})
  async updateDbLocation(
    @Param('id') id: string,
    @Body() dto: LocationUpdateDto,
    @Auth() auth: AuthInfo,
  ): Promise<LocationUpdateResponseDto> {
    return await this.locationDbService.update(id, dto, auth.sub);
  }

  /**
   * DELETE /api/locations/db/:id
   */
  @Delete('db/:id')
  @ApiOperation({
    summary: 'Delete location',
    description: 'Soft delete a location (marks as inactive)',
  })
  @ApiResponse({
    status: 200,
    description: 'Location deleted successfully',
    type: LocationCreateResponseDto,
  })
  @ApiResponse({status: 404, description: 'Location not found'})
  async removeDbLocation(
    @Param('id') id: string,
    @Auth() auth: AuthInfo,
  ): Promise<LocationCreateResponseDto> {
    return await this.locationDbService.remove(id, auth.sub);
  }

  /**
   * GET /api/locations/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get location details',
    description: 'Get location details with user access validation',
  })
  @ApiResponse({
    status: 200,
    description: 'Location details retrieved',
    type: LocationCreateResponseDto,
  })
  @ApiResponse({status: 403, description: 'User does not have access to this location'})
  @ApiResponse({status: 404, description: 'Location not found'})
  async getLocationById(
    @Auth() auth: AuthInfo,
    @Param('id') locationId: string,
  ): Promise<LocationCreateResponseDto> {
    return await this.locationService.getLocationById(auth.sub, locationId);
  }

  /**
   * POST /api/locations/:id/verify-access
   */
  @Post(':id/verify-access')
  @ApiOperation({
    summary: 'Verify location access',
    description: 'Check if user has access to a location',
  })
  @ApiResponse({status: 200, description: 'Access verification result'})
  async verifyLocationAccess(
    @Auth() auth: AuthInfo,
    @Param('id') locationId: string,
  ): Promise<{hasAccess: boolean; location?: LocationCreateResponseDto}> {
    try {
      const location = await this.locationService.getLocationById(auth.sub, locationId);
      return {hasAccess: true, location: location};
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        return {hasAccess: false};
      }
      throw error;
    }
  }
}
