import {StringNormalizer} from '../common/normalizers/string.normalizer';
import type {LocationUserDto} from './dto/location.dto';
import type {LocationCreateResponseDto} from './dto/location-create.dto';
import type {LocationListResponseDto} from './dto/location-list.query.dto';
import type {Location as DbLocation} from './entities/location.entity';

export function toLocationCreateResponseDto(
  location: DbLocation | LocationCreateResponseDto,
): LocationCreateResponseDto {
  return {
    id: location.id,
    name: location.name,
    displayName: StringNormalizer.toTrimmedOrNull(location.displayName),
    logtoId: StringNormalizer.toTrimmedOrNull(location.logtoId),
    description: StringNormalizer.toTrimmedOrNull(location.description),
    active: location.active,
    addresses: (location as DbLocation).addresses ?? [],
    contacts: (location as DbLocation).contacts ?? [],
  };
}

export function toLocationCreateResponseDtoList(
  locations: Array<DbLocation | LocationCreateResponseDto>,
): LocationCreateResponseDto[] {
  return locations.map(toLocationCreateResponseDto);
}

export function toLocationListResponseDto(location: LocationUserDto): LocationListResponseDto {
  const dto: LocationListResponseDto = {
    id: location.id || '',
    name: location.name,
    displayName: location.displayName,
    logtoId: location.logtoId,
    description: location.description ?? null,
    active: location.active,
    addresses: location.addresses ?? [],
    contacts: location.contacts ?? [],
  };

  if (location.roles !== undefined) {
    dto.roles = location.roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      customData: role.customData,
    }));
  }

  return dto;
}

export function toLocationListResponseDtoList(
  locations: LocationUserDto[],
): LocationListResponseDto[] {
  return locations.map(toLocationListResponseDto);
}
