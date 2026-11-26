import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class LocationAddressInputDto {
  @ApiPropertyOptional({
    description: 'Address type',
    enum: ['physical', 'mailing', 'billing', 'shipping'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({description: 'Whether this is the primary address'})
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiProperty({description: 'Street address line 1'})
  @IsString()
  addressLine1!: string;

  @ApiPropertyOptional({description: 'Street address line 2'})
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({description: 'City / locality'})
  @IsString()
  locality!: string;

  @ApiPropertyOptional({description: 'State / region'})
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({description: 'Postal / ZIP code'})
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({description: 'ISO 3166-1 alpha-2 country code'})
  @IsString()
  country!: string;

  @ApiPropertyOptional({description: 'Country display name'})
  @IsOptional()
  @IsString()
  countryName?: string;

  @ApiPropertyOptional({description: 'Location ID this address belongs to'})
  @IsOptional()
  @IsString()
  locationId?: string;
}

export class LocationContactInputDto {
  @ApiProperty({description: 'Contact type', enum: ['phone', 'email', 'web']})
  @IsIn(['phone', 'email', 'web'])
  type!: 'phone' | 'email' | 'web';

  @ApiPropertyOptional({description: 'Contact label (e.g. "Main", "Fax")'})
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({description: 'Contact value (phone number, email address, or URL)'})
  @IsString()
  value!: string;
}

/**
 * Location Base DTO - Input properties with validators
 * Used for creating and updating locations
 */
export class LocationBaseDto {
  @ApiProperty({description: 'Location name/code', example: 'LOC_HQ', maxLength: 200})
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Display name',
    example: 'Headquarters',
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  displayName!: string | null;

  @ApiPropertyOptional({description: 'Logto Organization ID', maxLength: 100, nullable: true})
  @IsOptional()
  @IsString()
  @MaxLength(100)
  logtoId!: string | null;

  @ApiPropertyOptional({description: 'Location description', nullable: true})
  @IsOptional()
  @IsString()
  description!: string | null;

  @ApiPropertyOptional({description: 'Whether location is active', default: true})
  @IsOptional()
  @IsBoolean()
  active!: boolean;

  @ApiPropertyOptional({
    description: 'Physical addresses for this location',
    type: [LocationAddressInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => LocationAddressInputDto)
  addresses?: LocationAddressInputDto[];

  @ApiPropertyOptional({
    description: 'Contact details for this location',
    type: [LocationContactInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => LocationContactInputDto)
  contacts?: LocationContactInputDto[];
}

/**
 * Location Base Response DTO - Used for API responses
 */
export class LocationBaseResponseDto {
  @ApiProperty({description: 'Location UUID'})
  id!: string;

  @ApiProperty({description: 'Location name/code', example: 'LOC_HQ'})
  name!: string;

  @ApiProperty({description: 'Display name', nullable: true})
  displayName!: string | null;

  @ApiProperty({description: 'Logto Organization ID', nullable: true})
  logtoId!: string | null;

  @ApiProperty({description: 'Location description', nullable: true})
  description!: string | null;

  @ApiProperty({description: 'Whether location is active'})
  active!: boolean;

  @ApiProperty({description: 'Physical addresses', type: [LocationAddressInputDto]})
  addresses!: LocationAddressInputDto[];

  @ApiProperty({description: 'Contact details', type: [LocationContactInputDto]})
  contacts!: LocationContactInputDto[];
}
