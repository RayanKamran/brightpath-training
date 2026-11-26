import {type Money, PaginationQueryDto} from '@dms/data-models';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsNotEmpty, IsOptional, IsString, MaxLength} from 'class-validator';

export class PartListQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Location ID to filter parts (REQUIRED for multi-tenant data isolation)',
  })
  @IsNotEmpty()
  @IsString()
  locationId!: string;

  @ApiPropertyOptional({description: 'Search in part number and description', maxLength: 200})
  @IsOptional()
  @IsString()
  @MaxLength(200)
  searchTerm?: string;
}

/**
 * Simple Part Response DTO - Catalog info only
 */
export class PartResponseDto {
  @ApiProperty({description: 'Part number'})
  partNumber!: string;

  @ApiProperty({description: 'Part description'})
  description!: string;

  @ApiProperty({description: 'Created date'})
  createdDate!: Date;

  @ApiProperty({description: 'Updated date'})
  updatedDate!: Date;
}

/**
 * Part with Inventory Response DTO
 * Used for grid display - includes catalog + inventory at a specific location + vendor info
 */
export class PartWithInventoryResponseDto extends PartResponseDto {
  @ApiProperty({description: 'Document ID'})
  id!: string;

  @ApiProperty({description: 'Part status'})
  status!: string;

  @ApiProperty({description: 'List price', nullable: true})
  listPrice!: Money | null;

  @ApiProperty({description: 'Total on-hand across all locations'})
  totalOnHand!: number;

  @ApiProperty({description: 'Total committed across all locations'})
  totalCommitted!: number;

  @ApiProperty({description: 'Total special-order committed across all locations'})
  totalSpecialOrderCommitted!: number;

  @ApiProperty({description: 'Total on-order across all locations'})
  totalOnOrder!: number;

  @ApiProperty({description: 'Total backordered across all locations'})
  totalBackordered!: number;

  @ApiProperty({description: 'Total available across all locations'})
  totalAvailable!: number;

  @ApiProperty({description: 'Total net available across all locations'})
  totalNetAvailable!: number;

  @ApiProperty({description: 'Selling unit of measure code', nullable: true})
  sellUom!: string | null;

  @ApiProperty({description: 'Primary vendor name', nullable: true})
  primaryVendorName!: string | null;

  @ApiProperty({description: 'Primary vendor part number', nullable: true})
  primaryVendorPartNumber!: string | null;

  @ApiProperty({description: 'Primary bin number at this location', nullable: true})
  primaryBinNumber!: string | null;

  @ApiProperty({description: 'On-hand quantity at the requested location', nullable: true})
  locationOnHand!: number | null;

  @ApiProperty({description: 'Committed quantity at the requested location', nullable: true})
  locationCommitted!: number | null;

  @ApiProperty({description: 'On-order quantity at the requested location', nullable: true})
  locationOnOrder!: number | null;
}
