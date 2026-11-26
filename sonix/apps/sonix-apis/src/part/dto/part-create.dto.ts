import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {PartBaseDto, PartBaseResponseDto} from './part-base.dto';

/**
 * A vendor on a new part. Cost is in cents (a plain number); the service stores it as Money.
 */
export class PartVendorCreateDto {
  @ApiProperty({description: 'Vendor number (resolves to vendors/{vendorNumber})'})
  @IsNotEmpty()
  @IsString()
  public vendorNumber!: string;

  @ApiPropertyOptional({description: "Vendor's own part number; defaults to the part number"})
  @IsOptional()
  @IsString()
  public vendorPartNumber?: string;

  @ApiProperty({description: 'Exactly one vendor must be primary'})
  @IsBoolean()
  public isPrimary!: boolean;

  @ApiPropertyOptional({description: 'Cost in cents; defaults to 0'})
  @IsOptional()
  @IsNumber()
  @Min(0)
  public cost?: number;
}

/**
 * A bin at the new part's location. Exactly one must be the main bin.
 */
export class PartBinCreateDto {
  @ApiProperty({description: 'Bin code (resolves to bins/{locationId}/{binCode})'})
  @IsNotEmpty()
  @IsString()
  public binCode!: string;

  @ApiProperty({description: 'Exactly one bin must be main'})
  @IsBoolean()
  public isMain!: boolean;
}

/**
 * POST /parts payload (DMSMOD-15). Field rules: docs/features/parts/part-create.md.
 */
export class PartCreateDto extends PartBaseDto {
  @ApiProperty({type: [PartVendorCreateDto], description: 'At least one; exactly one primary'})
  @IsArray()
  @ArrayMinSize(1, {message: 'At least one vendor is required'})
  @ValidateNested({each: true})
  @Type(() => PartVendorCreateDto)
  public vendors!: PartVendorCreateDto[];

  @ApiPropertyOptional({description: 'Defaults to "active"'})
  @IsOptional()
  @IsString()
  public status?: string;

  // ── Inventory ──────────────────────────────────────────────────────────────

  @ApiPropertyOptional({description: 'Location where inventory is created'})
  @IsOptional()
  @IsString()
  public locationId?: string;

  @ApiPropertyOptional({type: [PartBinCreateDto]})
  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => PartBinCreateDto)
  public bins?: PartBinCreateDto[];

  @ApiPropertyOptional({description: 'Initial quantity on hand; defaults to 0'})
  @IsOptional()
  @IsNumber()
  @Min(0)
  public onHandQty?: number;

  // ── Pricing / UOM ──────────────────────────────────────────────────────────

  @ApiPropertyOptional({description: 'List price in cents; defaults to 0'})
  @IsOptional()
  @IsNumber()
  @Min(0)
  public listPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public sellUom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public purchaseUom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  public salePurchaseRatio?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public priceGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public glGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public taxCode?: string;

  // ── Shipping / restocking ──────────────────────────────────────────────────

  @ApiPropertyOptional({description: 'Pounds; shippingUnit is required when > 0'})
  @IsOptional()
  @IsNumber()
  @Min(0)
  public shippingWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public shippingUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  public caseQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  public minQty?: number;

  @ApiPropertyOptional({description: 'Must be >= minQty when both are given'})
  @IsOptional()
  @IsNumber()
  @Min(0)
  public maxQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  public minDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  public minOrder?: number;

  @ApiPropertyOptional({description: 'Max 8 characters, stored uppercase'})
  @IsOptional()
  @IsString()
  @MaxLength(8)
  public pogNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public popCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public comments?: string;

  // ── Controls ───────────────────────────────────────────────────────────────

  @ApiPropertyOptional({description: 'Maps to promptForSerialNumber'})
  @IsOptional()
  @IsBoolean()
  public serialized?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  public bypassPriceUpdate?: boolean;

  @ApiPropertyOptional({type: [String]})
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  public alternatePartNumbers?: string[];
}

export class PartCreateResponseDto extends PartBaseResponseDto {}
