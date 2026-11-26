import {PaginationQueryDto} from '@dms/data-models';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsBooleanString, IsOptional, IsString, MaxLength} from 'class-validator';
import {LocationRoleDto} from './location.dto';
import {LocationBaseResponseDto} from './location-base.dto';

export class LocationListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({description: 'Filter by active status (true/false)'})
  @IsOptional()
  @IsBooleanString()
  active?: string;

  @ApiPropertyOptional({description: 'Search in name and description', maxLength: 200})
  @IsOptional()
  @IsString()
  @MaxLength(200)
  searchTerm?: string;
}

export class LocationListRoleDto extends LocationRoleDto {}

export class LocationListResponseDto extends LocationBaseResponseDto {
  @ApiProperty({
    description: 'User roles at this location',
    type: [LocationListRoleDto],
    required: false,
  })
  roles?: LocationListRoleDto[];
}
