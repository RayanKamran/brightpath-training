import {ApiProperty} from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  logtoUserId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({required: false, nullable: true})
  username!: string | null;

  @ApiProperty({required: false, nullable: true})
  nickname!: string | null;

  @ApiProperty({required: false, nullable: true})
  displayName!: string | null;

  @ApiProperty({required: false, nullable: true})
  bio!: string | null;

  @ApiProperty({required: false, nullable: true})
  preferredLanguage!: string | null;

  @ApiProperty({required: false, nullable: true})
  timezone!: string | null;

  @ApiProperty()
  emailNotifications!: boolean;

  @ApiProperty()
  smsNotifications!: boolean;

  @ApiProperty()
  marketingEmails!: boolean;

  @ApiProperty()
  profileCompleteness!: number;

  @ApiProperty({required: false, nullable: true})
  lastLoginAt!: Date | null;

  @ApiProperty()
  hasProfilePhoto!: boolean;
}
