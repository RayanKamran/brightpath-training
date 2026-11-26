import {ApiProperty} from '@nestjs/swagger';
import {LocationCreateDto} from './location-create.dto';

export class LocationRoleDto {
  @ApiProperty({description: 'Role ID'})
  id!: string;

  @ApiProperty({description: 'Role name'})
  name!: string;

  @ApiProperty({description: 'Role description', required: false})
  description?: string;

  @ApiProperty({description: 'Custom role data', required: false})
  customData?: Record<string, unknown>;
}

export class LocationUserDto extends LocationCreateDto {
  @ApiProperty({description: 'Location UUID'})
  id!: string;
  @ApiProperty({
    description: 'User roles at this location',
    type: [LocationRoleDto],
    required: false,
  })
  roles?: LocationRoleDto[];
}
