import type {PagedResponseDto} from '@dms/data-models';
import {Controller, Get, Param, Query} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {PartDetailResponseDto} from './dto/part-detail.dto';
import {PartListQueryDto, PartWithInventoryResponseDto} from './dto/part-list.query.dto';
import {PartService} from './part.service';

@ApiTags('parts')
@ApiBearerAuth()
@Controller('parts')
export class PartController {
  constructor(private readonly _partService: PartService) {}

  /**
   * GET /api/parts
   */
  @Get()
  @ApiOperation({
    summary: 'List all parts with inventory',
    description:
      'Get all parts with pagination and inventory for a specific location. Location ID is required for multi-tenant data isolation. Includes inventory quantities, bins, and primary vendor information.',
  })
  @ApiResponse({status: 200, description: 'Paginated list of parts with inventory'})
  @ApiResponse({status: 400, description: 'Bad Request - locationId is required'})
  public async findAll(
    @Query() query: PartListQueryDto,
  ): Promise<PagedResponseDto<PartWithInventoryResponseDto>> {
    return await this._partService.findAllWithInventory(query);
  }

  /**
   * GET /api/parts/:partNumber
   */
  @Get(':partNumber')
  @ApiOperation({
    summary: 'Get part by part number',
    description:
      'Retrieve a single part with full detail including all editable fields, vendors, and inventory.',
  })
  @ApiResponse({status: 200, description: 'Part found', type: PartDetailResponseDto})
  @ApiResponse({status: 404, description: 'Part not found'})
  public async findOne(@Param('partNumber') partNumber: string): Promise<PartDetailResponseDto> {
    return await this._partService.findOne(partNumber);
  }
}
