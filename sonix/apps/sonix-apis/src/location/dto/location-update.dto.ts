import {PartialType} from '@nestjs/mapped-types';
import {LocationBaseDto, LocationBaseResponseDto} from './location-base.dto';

/**
 * DTO for updating an existing location
 * All fields from LocationBaseDto are optional
 */
export class LocationUpdateDto extends PartialType(LocationBaseDto) {}

export class LocationUpdateResponseDto extends LocationBaseResponseDto {}
