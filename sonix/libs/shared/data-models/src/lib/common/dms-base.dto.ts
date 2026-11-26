import 'reflect-metadata';
import {ApiPropertyOptional} from '@nestjs/swagger';
import {IsOptional, IsString} from 'class-validator';

/**
 * Base DTO - Contains common properties for response DTOs only
 * No validators - this is for output/response contracts only
 */
export class DmsBaseDto {
  @ApiPropertyOptional({
    description: 'Location ID',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  locationId?: string | null;
}

export class DmsBaseResponseDto {
  @ApiPropertyOptional({
    description: 'Location ID',
    nullable: true,
  })
  locationId?: string | null;
}
