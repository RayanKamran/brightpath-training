import type {RegisterUserDto, RegisterUserResponse} from '@dms/data-models';
import {
  BadRequestException,
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
  Res,
  ServiceUnavailableException,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {Response} from 'express';
import {Auth} from '../auth/auth.decorator';
import {AuthInfo} from '../auth/auth-utils';
import {Public} from '../auth/public.decorator';
import {LocationListResponseDto} from '../location/dto/location-list.query.dto';
import {LocationService} from '../location/location.service';
import {UpdateUserDto} from './dto/update-user-profile.dto';
import {UserContextResponseDto} from './dto/user-context-response.dto';
import {UserResponseDto} from './dto/user-response.dto';
import {toUserDto, toUserDtoList} from './user.mapper';
import {UserService} from './user.service';

export interface SalespersonListItemDto {
  id: string;
  displayName: string;
  email: string;
}

const ALLOWED_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_PHOTO_BYTES = 20 * 1024 * 1024; // 20 MB — client compresses before upload

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly _userService: UserService,
    private readonly _locationService: LocationService,
  ) {}

  /**
   * POST /api/user/register
   * Register a new user in Logto and create profile in ids_db
   * This endpoint is public (no authentication required)
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Public endpoint — no authentication required. Creates user in Logto and ids_db.',
  })
  @ApiResponse({status: 201, description: 'User registered successfully'})
  @ApiResponse({status: 400, description: 'Invalid input'})
  public async register(@Body() registerDto: RegisterUserDto): Promise<RegisterUserResponse> {
    return await this._userService.registerUser(registerDto);
  }

  /**
   * POST /api/user/sync/from-logto
   */
  @Post('sync/from-logto')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Sync users from Logto'})
  @ApiResponse({status: 200, description: 'Sync results'})
  public async syncFromLogto(
    @Auth() auth: AuthInfo,
  ): Promise<{success: boolean; synced: number; failed: number; message: string}> {
    const result = await this._userService.syncAllFromLogto(auth.sub);
    return {
      success: true,
      synced: result.synced,
      failed: result.failed,
      message: `Synchronized ${result.synced} users from Logto. ${result.failed} failed.`,
    };
  }

  /**
   * GET /api/user/search
   */
  @Get('search')
  @ApiOperation({summary: 'Search users by name or email'})
  @ApiQuery({name: 'q', required: false, description: 'Search term'})
  @ApiResponse({status: 200, description: 'Matching users'})
  public async search(@Query('q') q?: string): Promise<SalespersonListItemDto[]> {
    const all = await this._userService.findAll();
    const term: string | undefined = q?.trim().toLowerCase();
    const filtered = term
      ? all.filter(
          (u) =>
            u.displayName?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term) ||
            u.username?.toLowerCase().includes(term),
        )
      : all;
    return filtered
      .filter((u) => !u.isDeleted)
      .slice(0, 50)
      .map((u) => ({id: u.id, displayName: u.displayName ?? u.email, email: u.email}));
  }

  /**
   * GET /api/user/profile
   * Get the authenticated user's profile
   * Automatically creates profile if user exists in Logto but not in ids_db
   * Syncs cached fields (email, username, lastLoginAt) from Logto
   */
  @Get('profile')
  @ApiOperation({
    summary: "Get the authenticated user's profile",
    description:
      'Auto-creates profile if user exists in Logto but not in ids_db. Syncs cached fields from Logto.',
  })
  @ApiResponse({status: 200, description: 'User profile', type: UserResponseDto})
  public async getProfile(@Auth() auth: AuthInfo): Promise<UserResponseDto> {
    await this._userService.getOrCreateUserProfile(auth.sub);
    return await this._userService.syncFromLogto(auth.sub);
  }

  /**
   * GET /api/user/context
   * Returns the authenticated user's profile and locations atomically.
   */
  @Get('context')
  @ApiOperation({summary: 'Get authenticated user context (profile + locations)'})
  @ApiResponse({status: 200, type: UserContextResponseDto})
  @ApiResponse({status: 403, description: 'No locations assigned'})
  @ApiResponse({status: 503, description: 'Location service unavailable'})
  public async getUserContext(@Auth() auth: AuthInfo): Promise<UserContextResponseDto> {
    const [profileResult, locationsResult] = await Promise.allSettled([
      this._userService.getOrCreateUserProfile(auth.sub),
      this._locationService.getUserLocations(auth.sub),
    ]);

    if (locationsResult.status === 'rejected') {
      throw new ServiceUnavailableException('Location service unavailable');
    }

    if (locationsResult.value.length === 0) {
      throw new ForbiddenException({
        type: 'urn:dms:auth:no-locations',
        title: 'No locations assigned',
      });
    }

    const profile = profileResult.status === 'fulfilled' ? toUserDto(profileResult.value) : null;

    return {profile, locations: locationsResult.value};
  }

  /**
   * PATCH /api/user/profile
   */
  @Patch('profile')
  @ApiOperation({summary: "Update the authenticated user's own profile"})
  @ApiResponse({status: 200, description: 'Updated user profile'})
  public async updateProfile(
    @Auth() auth: AuthInfo,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return toUserDto(await this._userService.updateUserProfile(auth.sub, dto));
  }

  /**
   * GET /api/user/profile/photo
   * Get the authenticated user's own profile photo (public — auth is optional)
   */
  @Public()
  @Get('profile/photo')
  @ApiOperation({summary: "Get the authenticated user's profile photo"})
  @ApiResponse({status: 200, description: 'Photo binary'})
  @ApiResponse({status: 404, description: 'No photo uploaded'})
  public async getOwnPhoto(
    @Auth() auth: AuthInfo,
    @Res({passthrough: true}) res: Response,
  ): Promise<StreamableFile> {
    const photo = await this._userService.getProfilePhoto(auth.sub);
    if (!photo) {
      throw new NotFoundException('No profile photo uploaded');
    }
    res.setHeader('Content-Type', photo.contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return new StreamableFile(photo.data);
  }

  /**
   * POST /api/user/profile/photo
   * Upload the authenticated user's own profile photo
   */
  @Post('profile/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({schema: {type: 'object', properties: {photo: {type: 'string', format: 'binary'}}}})
  @ApiOperation({summary: "Upload the authenticated user's profile photo"})
  @ApiResponse({status: 200, description: 'Updated user profile'})
  public async uploadOwnPhoto(
    @Auth() auth: AuthInfo,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    this._validatePhoto(file);
    return toUserDto(
      await this._userService.saveProfilePhoto(auth.sub, file.buffer, file.mimetype),
    );
  }

  /**
   * DELETE /api/user/profile/photo
   * Delete the authenticated user's own profile photo
   */
  @Delete('profile/photo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: "Delete the authenticated user's profile photo"})
  @ApiResponse({status: 200, description: 'Updated user profile'})
  public async deleteOwnPhoto(@Auth() auth: AuthInfo): Promise<UserResponseDto> {
    return toUserDto(await this._userService.deleteProfilePhoto(auth.sub));
  }

  /**
   * GET /api/user
   */
  @Get()
  @ApiOperation({summary: 'List all users'})
  @ApiResponse({status: 200, description: 'All user profiles'})
  public async findAll(): Promise<UserResponseDto[]> {
    return toUserDtoList(await this._userService.findAll());
  }

  /**
   * GET /api/user/locations
   * Get locations for authenticated user
   */
  @Get('locations')
  @ApiOperation({summary: 'Get user locations'})
  @ApiResponse({status: 200, description: 'User locations'})
  public async getUserLocations(@Auth() auth: AuthInfo): Promise<LocationListResponseDto[]> {
    return await this._locationService.getUserLocations(auth.sub);
  }

  /**
   * GET /api/user/:logtoUserId
   */
  @Get(':logtoUserId')
  @ApiOperation({summary: 'Get user by Logto user ID'})
  @ApiResponse({status: 200, description: 'User profile'})
  @ApiResponse({status: 404, description: 'User not found'})
  public async findOne(@Param('logtoUserId') logtoUserId: string): Promise<UserResponseDto> {
    return toUserDto(await this._userService.findByLogtoId(logtoUserId));
  }

  /**
   * GET /api/user/:logtoUserId/photo
   * Returns the user's profile photo (public)
   */
  @Public()
  @Get(':logtoUserId/photo')
  @ApiOperation({summary: 'Get user profile photo'})
  @ApiResponse({status: 200, description: 'Photo binary'})
  @ApiResponse({status: 404, description: 'No photo uploaded'})
  public async getPhoto(
    @Param('logtoUserId') logtoUserId: string,
    @Res({passthrough: true}) res: Response,
  ): Promise<StreamableFile> {
    const photo = await this._userService.getProfilePhoto(logtoUserId);
    if (!photo) {
      throw new NotFoundException('No profile photo uploaded');
    }
    res.setHeader('Content-Type', photo.contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return new StreamableFile(photo.data);
  }

  /**
   * POST /api/user/:logtoUserId/photo
   * Upload a user's profile photo
   */
  @Post(':logtoUserId/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({schema: {type: 'object', properties: {photo: {type: 'string', format: 'binary'}}}})
  @ApiOperation({summary: 'Upload user profile photo'})
  @ApiResponse({status: 200, description: 'Updated user profile'})
  public async uploadPhoto(
    @Param('logtoUserId') logtoUserId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    this._validatePhoto(file);
    return toUserDto(
      await this._userService.saveProfilePhoto(logtoUserId, file.buffer, file.mimetype),
    );
  }

  /**
   * DELETE /api/user/:logtoUserId/photo
   * Delete a user's profile photo
   */
  @Delete(':logtoUserId/photo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Delete user profile photo'})
  @ApiResponse({status: 200, description: 'Updated user profile'})
  public async deletePhoto(@Param('logtoUserId') logtoUserId: string): Promise<UserResponseDto> {
    return toUserDto(await this._userService.deleteProfilePhoto(logtoUserId));
  }

  /**
   * PATCH /api/user/:logtoUserId
   */
  @Patch(':logtoUserId')
  @ApiOperation({summary: 'Update user profile'})
  @ApiResponse({status: 200, description: 'Updated user profile'})
  public async update(
    @Param('logtoUserId') logtoUserId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return toUserDto(await this._userService.updateUserProfile(logtoUserId, dto));
  }

  private _validatePhoto(file: Express.Multer.File | undefined): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!ALLOWED_PHOTO_TYPES.has(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new BadRequestException('File too large: max 5 MB');
    }
  }
}
