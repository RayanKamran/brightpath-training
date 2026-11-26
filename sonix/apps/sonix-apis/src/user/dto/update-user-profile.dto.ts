import type {UpdateUserDto as IUpdateUserDto} from '@dms/data-models';
import {IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min} from 'class-validator';

/**
 * DTO for updating an existing user profile
 */
export class UpdateUserDto implements IUpdateUserDto {
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
