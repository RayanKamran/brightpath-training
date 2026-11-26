import {DmsBaseResponseDto} from '@dms/data-models';
import {ApiProperty} from '@nestjs/swagger';
import {IsNotEmpty, IsString, Matches, MaxLength} from 'class-validator';

/**
 * Part Base DTO - Contains common catalog fields shared across part DTOs
 */
export class PartBaseDto {
  @ApiProperty({description: 'Part number (unique identifier)'})
  @IsNotEmpty({message: 'Part number is required'})
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9\-_.]+$/, {
    message: 'Part number must contain only letters, numbers, hyphens, dots, or underscores',
  })
  partNumber!: string;

  @ApiProperty({description: 'Part description'})
  @IsNotEmpty({message: 'Part description is required'})
  @IsString()
  description!: string;
}

/**
 * Part Base Response DTO - Used for Part API responses
 */
export class PartBaseResponseDto extends DmsBaseResponseDto {
  @ApiProperty({description: 'Part number'})
  partNumber!: string;

  @ApiProperty({description: 'Part description'})
  description!: string;
}
