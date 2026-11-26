import type {User as IUser, RegisterUserDto, RegisterUserResponse} from '@dms/data-models';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {createDmsBaseEntity, touchDmsBaseEntity} from '../common/entities/dms-base.entity';
import {RavenSessionFactory} from '../infrastructure/ravendb/session-factory';
import type {CreateUserDto} from './dto/create-user-profile.dto';
import type {UpdateUserDto} from './dto/update-user-profile.dto';
import {UserResponseDto} from './dto/user-response.dto';
import {User} from './entities/user.entity';
import {LogtoManagementClient} from './logto-management.client';
import {toUserDto} from './user.mapper';

@Injectable()
export class UserService {
  private readonly _logger = new Logger(UserService.name);

  public constructor(
    private readonly _logtoClient: LogtoManagementClient,
    private readonly _sessionFactory: RavenSessionFactory,
  ) {}

  public async registerUser(registerDto: RegisterUserDto): Promise<RegisterUserResponse> {
    this._logger.log(`Registering user: ${registerDto.email}`);

    if (!registerDto.email || !registerDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const logtoUser = await this._logtoClient.createUser({
      primaryEmail: registerDto.email,
      password: registerDto.password,
      name: `${registerDto.firstName} ${registerDto.lastName}`,
      username: registerDto.username,
    });

    await this.createUserProfile({
      logtoUserId: logtoUser.id,
      email: registerDto.email,
      username: registerDto.username ?? null,
      displayName: `${registerDto.firstName} ${registerDto.lastName}`,
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      profileCompleteness: 25,
    });

    return {
      userId: logtoUser.id,
      email: registerDto.email,
      message: 'User registered successfully',
    };
  }

  private async createUserProfile(createUserDto: CreateUserDto): Promise<IUser> {
    using session = this._sessionFactory.openSession();
    const existing: User | null = await session.load<User>(`users/${createUserDto.logtoUserId}`);
    if (existing) {
      throw new ConflictException('User profile already exists');
    }

    const user: User = {
      ...createDmsBaseEntity(createUserDto.logtoUserId),
      id: `users/${createUserDto.logtoUserId}`,
      ...createUserDto,
      emailNotifications: createUserDto.emailNotifications ?? true,
      smsNotifications: createUserDto.smsNotifications ?? false,
      marketingEmails: createUserDto.marketingEmails ?? false,
      profileCompleteness: createUserDto.profileCompleteness ?? 0,
    };

    await session.store(user, user.id);
    await session.saveChanges();
    return user;
  }

  public async findByLogtoId(logtoUserId: string): Promise<IUser> {
    using session = this._sessionFactory.openSession();
    const user: User | null = await session.load<User>(`users/${logtoUserId}`);
    if (!user) {
      throw new NotFoundException(`User profile not found for Logto ID: ${logtoUserId}`);
    }

    return user;
  }

  public async getOrCreateUserProfile(logtoUserId: string): Promise<IUser> {
    const existing: IUser | null = await this.findByLogtoId(logtoUserId).catch(() => null);
    if (existing) {
      return existing;
    }

    const logtoUser = await this._logtoClient.getUser(logtoUserId);
    return this.createUserProfile({
      logtoUserId,
      email: logtoUser.primaryEmail || 'unknown@example.com',
      username: logtoUser.username || null,
      displayName: logtoUser.name || null,
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      profileCompleteness: 25,
    });
  }

  public async findById(id: string): Promise<IUser> {
    using session = this._sessionFactory.openSession();
    const user: User | null = await session.load<User>(id);
    if (!user) {
      throw new NotFoundException(`User profile not found: ${id}`);
    }

    return user;
  }

  public async updateUserProfile(
    logtoUserId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<IUser> {
    using session = this._sessionFactory.openSession();
    const user: User | null = await session.load<User>(`users/${logtoUserId}`);
    if (!user) {
      throw new NotFoundException(`User profile not found for Logto ID: ${logtoUserId}`);
    }

    Object.assign(user, updateUserDto);
    touchDmsBaseEntity(user, logtoUserId);
    await session.store(user, user.id);
    await session.saveChanges();
    return user;
  }

  public async syncFromLogto(logtoUserId: string): Promise<UserResponseDto> {
    try {
      const logtoUser = await this._logtoClient.getUser(logtoUserId);
      using session = this._sessionFactory.openSession();
      const user: User | null = await session.load<User>(`users/${logtoUserId}`);
      if (!user) {
        throw new NotFoundException(`User profile not found for Logto ID: ${logtoUserId}`);
      }

      user.email = logtoUser.primaryEmail || user.email;
      user.username = logtoUser.username || user.username;
      if (logtoUser.lastSignInAt) {
        user.lastLoginAt = new Date(logtoUser.lastSignInAt);
      }

      touchDmsBaseEntity(user, logtoUserId);
      await session.store(user, user.id);
      await session.saveChanges();
      return toUserDto(user);
    } catch {
      const user: IUser = await this.findByLogtoId(logtoUserId);
      return toUserDto(user);
    }
  }

  public async deleteUserProfile(logtoUserId: string): Promise<void> {
    using session = this._sessionFactory.openSession();
    const user: User | null = await session.load<User>(`users/${logtoUserId}`);
    if (!user) {
      return;
    }

    user.isDeleted = true;
    user.updatedBy = logtoUserId;
    touchDmsBaseEntity(user, logtoUserId);
    await session.store(user, user.id);
    await session.saveChanges();
  }

  public async syncAllFromLogto(
    userId: string = 'system',
  ): Promise<{synced: number; failed: number}> {
    const logtoUsers = await this._logtoClient.getAllUsers();
    this._logger.log(`Fetched ${logtoUsers.length} users from Logto`);

    using session = this._sessionFactory.openSession();
    let synced: number = 0;
    let failed: number = 0;

    const existing: User[] = await session.query<User>({collection: 'users'}).all();
    const byLogtoId = new Map(existing.map((u) => [u.logtoUserId, u]));

    for (const logtoUser of logtoUsers) {
      try {
        const user: User | undefined = byLogtoId.get(logtoUser.id);
        if (user) {
          user.email = logtoUser.primaryEmail || user.email;
          user.username = logtoUser.username || user.username;
          user.displayName = logtoUser.name || user.displayName;
          if (logtoUser.lastSignInAt) {
            user.lastLoginAt = new Date(logtoUser.lastSignInAt);
          }
          touchDmsBaseEntity(user, userId);
        } else {
          const newUser: User = {
            ...createDmsBaseEntity(userId),
            id: `users/${logtoUser.id}`,
            logtoUserId: logtoUser.id,
            email: logtoUser.primaryEmail || '',
            username: logtoUser.username || null,
            displayName: logtoUser.name || null,
            emailNotifications: true,
            smsNotifications: false,
            marketingEmails: false,
            profileCompleteness: 25,
          };
          await session.store(newUser, newUser.id);
        }
        synced += 1;
      } catch (error) {
        this._logger.error(
          `Failed to sync user ${logtoUser.id}`,
          error instanceof Error ? error.stack : String(error),
        );
        failed += 1;
      }
    }

    await session.saveChanges();

    return {synced, failed};
  }

  public async getProfilePhoto(
    logtoUserId: string,
  ): Promise<{data: Buffer; contentType: string} | null> {
    const docId: string = `users/${logtoUserId}`;

    using session = this._sessionFactory.openSession();
    const exists: boolean = await session.advanced.attachments.exists(docId, 'profile-photo');
    if (!exists) {
      return null;
    }
    const result = await session.advanced.attachments.get(docId, 'profile-photo');
    if (!result) {
      return null;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of result.data) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
    }
    const data = Buffer.concat(chunks);
    const contentType: string = result.details.contentType || 'image/jpeg';
    result.dispose();
    return {data, contentType};
  }

  public async saveProfilePhoto(
    logtoUserId: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<IUser> {
    const docId: string = `users/${logtoUserId}`;

    using session = this._sessionFactory.openSession();
    const user: User | null = await session.load<User>(docId);
    if (!user) {
      throw new NotFoundException(`User not found: ${logtoUserId}`);
    }
    session.advanced.attachments.store(docId, 'profile-photo', buffer, contentType);

    user.hasProfilePhoto = true;
    touchDmsBaseEntity(user, logtoUserId);

    await session.store(user, docId);
    await session.saveChanges();

    return user;
  }

  public async deleteProfilePhoto(logtoUserId: string): Promise<IUser> {
    const docId: string = `users/${logtoUserId}`;

    using session = this._sessionFactory.openSession();
    const user: User | null = await session.load<User>(docId);
    if (!user) {
      throw new NotFoundException(`User not found: ${logtoUserId}`);
    }
    const exists: boolean = await session.advanced.attachments.exists(docId, 'profile-photo');
    if (exists) {
      session.advanced.attachments.delete(docId, 'profile-photo');
    }

    user.hasProfilePhoto = false;
    touchDmsBaseEntity(user, logtoUserId);

    await session.store(user, docId);
    await session.saveChanges();

    return user;
  }

  public async findAll(): Promise<IUser[]> {
    using session = this._sessionFactory.openSession();
    const all: User[] = await session.query<User>({collection: 'users'}).all();
    return all.sort((left, right) => right.createdDate.getTime() - left.createdDate.getTime());
  }
}
