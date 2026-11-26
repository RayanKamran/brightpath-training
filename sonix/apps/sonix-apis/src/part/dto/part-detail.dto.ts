import type {Money} from '@dms/data-models';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {PartWithInventoryResponseDto} from './part-list.query.dto';

/**
 * Bin data returned in the part detail response.
 */
export class PartDetailBinDto {
  @ApiProperty({description: 'Bin number/code'})
  binNumber!: string;

  @ApiPropertyOptional({description: 'Bin description'})
  description!: string | null;

  @ApiProperty({description: 'Whether this is the primary/main bin'})
  isMain!: boolean;
}

/**
 * Vendor data returned in the part detail response.
 */
export class PartDetailVendorDto {
  @ApiProperty({description: 'Vendor number'})
  vendorNumber!: string;

  @ApiProperty({description: 'Vendor name'})
  vendorName!: string;

  @ApiPropertyOptional({description: 'Vendor-specific part number'})
  vendorPartNumber!: string | null;

  @ApiProperty({description: 'Vendor cost'})
  cost!: Money | null;

  @ApiProperty({description: 'Whether this is the primary vendor'})
  isPrimary!: boolean;
}

/**
 * Full Part Detail Response DTO — extends inventory DTO with all editable fields.
 * Used by GET /api/parts/:partNumber for the edit form.
 */
export class PartDetailResponseDto extends PartWithInventoryResponseDto {
  @ApiPropertyOptional({description: 'Purchase unit of measure code'})
  purchaseUom!: string | null;

  @ApiPropertyOptional({description: 'Sale-to-purchase ratio'})
  salePurchaseRatio!: number | null;

  @ApiPropertyOptional({description: 'Internal notes / comments'})
  comments!: string | null;

  @ApiPropertyOptional({description: 'Shipping weight'})
  shippingWeight!: number | null;

  @ApiPropertyOptional({description: 'Shipping unit code'})
  shippingUnit!: string | null;

  @ApiPropertyOptional({description: 'Case quantity'})
  caseQty!: number | null;

  @ApiPropertyOptional({description: 'Minimum stocking quantity'})
  minQty!: number | null;

  @ApiPropertyOptional({description: 'Maximum stocking quantity'})
  maxQty!: number | null;

  @ApiPropertyOptional({description: 'Minimum days of supply'})
  minDays!: number | null;

  @ApiPropertyOptional({description: 'Minimum order quantity'})
  minOrder!: number | null;

  @ApiPropertyOptional({description: 'Bypass vendor price updates'})
  bypassPriceUpdate!: boolean;

  @ApiPropertyOptional({description: 'Prompt for serial number'})
  promptForSerialNumber!: boolean;

  @ApiPropertyOptional({description: 'Average cost'})
  avgCost!: Money | null;

  @ApiPropertyOptional({description: 'Sale category / price group code'})
  priceGroup!: string | null;

  @ApiPropertyOptional({description: 'GL group code'})
  glGroup!: string | null;

  @ApiPropertyOptional({description: 'Tax code'})
  taxCode!: string | null;

  @ApiPropertyOptional({description: 'Planogram number (max 8 chars, uppercase)'})
  pogNumber!: string | null;

  @ApiPropertyOptional({description: 'Popularity/classification code'})
  popCode!: string | null;

  @ApiPropertyOptional({description: 'Alternate part numbers'})
  alternatePartNumbers!: string[];

  @ApiPropertyOptional({description: 'Date last received (PO receiving)', nullable: true})
  lastReceived!: Date | null;

  @ApiPropertyOptional({description: 'Date last sold (invoice/work order)', nullable: true})
  lastSold!: Date | null;

  @ApiProperty({description: 'Bins at the requested location', type: [PartDetailBinDto]})
  bins!: PartDetailBinDto[];

  @ApiProperty({description: 'All vendors on this part', type: [PartDetailVendorDto]})
  vendors!: PartDetailVendorDto[];
}
