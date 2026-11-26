import {type CurrencyCode, SUPPORTED_CURRENCIES} from '@dms/data-models';
import {ApiProperty} from '@nestjs/swagger';
import {IsIn, IsInt} from 'class-validator';

/**
 * DTO for a monetary value. Used as a nested object on any DTO field that carries money.
 * Decorate the parent field with @ValidateNested() and @Type(() => MoneyDto).
 *
 * `amount` is an integer in the currency's minor unit (cents for USD/CAD/EUR).
 * `currency` must be a supported ISO 4217 code.
 */
export class MoneyDto {
  @ApiProperty({description: 'Amount in minor units (cents). 1299 = $12.99.', example: 1299})
  @IsInt()
  amount!: number;

  @ApiProperty({description: 'ISO 4217 currency code.', example: 'USD', enum: SUPPORTED_CURRENCIES})
  @IsIn(SUPPORTED_CURRENCIES)
  currency!: CurrencyCode;
}

/**
 * Variant of MoneyDto that allows negative amounts.
 * Use for fields that can legitimately be negative: net trade, rebates, add-ons.
 */
export class SignedMoneyDto {
  @ApiProperty({description: 'Amount in minor units (cents). May be negative.', example: -5000})
  @IsInt()
  amount!: number;

  @ApiProperty({description: 'ISO 4217 currency code.', example: 'USD', enum: SUPPORTED_CURRENCIES})
  @IsIn(SUPPORTED_CURRENCIES)
  currency!: CurrencyCode;
}
