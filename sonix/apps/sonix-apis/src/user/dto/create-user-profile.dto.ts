import type {CreateUserDto as ICreateUserDto} from '@dms/data-models';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for creating a new user profile in RavenDB
 */
export class CreateUserDto implements ICreateUserDto {
  @IsUUID()
  logtoUserId!: string;

  @IsEmail()
  @MaxLength(500)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  username?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  preferredLanguage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string | null;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  profileCompleteness?: number;
}
