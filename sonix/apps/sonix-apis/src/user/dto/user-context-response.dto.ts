import {ApiProperty} from '@nestjs/swagger';
import {LocationListResponseDto} from '../../location/dto/location-list.query.dto';
import {UserResponseDto} from './user-response.dto';

export class UserContextResponseDto {
  @ApiProperty({
    type: UserResponseDto,
    nullable: true,
    description: 'User profile (null if fetch failed)',
  })
  profile!: UserResponseDto | null;

  @ApiProperty({type: [LocationListResponseDto], description: 'Locations the user has access to'})
  locations!: LocationListResponseDto[];
}
