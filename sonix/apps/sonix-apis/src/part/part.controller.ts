import type {PagedResponseDto} from '@dms/data-models';
import {Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res} from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import type {Response} from 'express';
import {Auth} from '../auth/auth.decorator';
import {AuthInfo} from '../auth/auth-utils';
import {PartCreateDto, PartCreateResponseDto} from './dto/part-create.dto';
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
   * POST /api/parts
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create part',
    description: 'Create a part with its vendors and, optionally, inventory at one location.',
  })
  @ApiResponse({status: 201, description: 'Part created', type: PartCreateResponseDto})
  @ApiResponse({status: 400, description: 'Invalid input or a vendor/bin rule broken'})
  @ApiResponse({status: 404, description: 'Location not found'})
  @ApiResponse({status: 409, description: 'Part already exists'})
  public async create(
    @Body() dto: PartCreateDto,
    @Auth() auth: AuthInfo,
    @Res({passthrough: true}) res: Response,
  ): Promise<PartCreateResponseDto> {
    const created = await this._partService.create(dto, auth.sub);
    res.setHeader('Location', `/api/parts/${encodeURIComponent(created.partNumber)}`);
    return created;
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
