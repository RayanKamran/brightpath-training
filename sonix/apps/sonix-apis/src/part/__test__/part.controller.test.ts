import type {PagedResponseDto} from '@dms/data-models';
import {NotFoundException} from '@nestjs/common';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {PartListQueryDto, PartWithInventoryResponseDto} from '../dto/part-list.query.dto';
import {PartStatus} from '../entities/part.entity';
import {PartController} from '../part.controller';
import type {PartService} from '../part.service';

type PartServiceMock = {
  create: ReturnType<typeof vi.fn>;
  findAllWithInventory: ReturnType<typeof vi.fn>;
  findOne: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

describe('PartController', () => {
  let controller: PartController;
  let partServiceMock: PartServiceMock;

  beforeEach(() => {
    partServiceMock = {
      create: vi.fn(),
      findAllWithInventory: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
    };
    controller = new PartController(partServiceMock as unknown as PartService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    const query: PartListQueryDto = {
      locationId: 'test-org-id',
      page: 1,
      pageSize: 50,
    };

    const responseMock: PagedResponseDto<PartWithInventoryResponseDto> = {
      items: [
        {
          id: 'parts/PART-001',
          partNumber: 'PART-001',
          description: 'Test Part 1',
          status: PartStatus.Active,
          listPrice: null,
          sellUom: null,
          totalOnHand: 0,
          totalCommitted: 0,
          totalSpecialOrderCommitted: 0,
          totalOnOrder: 0,
          totalBackordered: 0,
          totalAvailable: 0,
          totalNetAvailable: 0,
          primaryVendorName: null,
          primaryVendorPartNumber: null,
          primaryBinNumber: null,
          locationOnHand: null,
          locationCommitted: null,
          locationOnOrder: null,
          createdDate: new Date(),
          updatedDate: new Date(),
        },
      ],
      page: 1,
      pageSize: 50,
      totalCount: 1,
      totalPages: 1,
    };

    it('should return paginated parts with inventory', async () => {
      partServiceMock.findAllWithInventory.mockResolvedValue(responseMock);

      const result: PagedResponseDto<PartWithInventoryResponseDto> =
        await controller.findAll(query);

      expect(result).toEqual(responseMock);
      expect(partServiceMock.findAllWithInventory).toHaveBeenCalledWith(query);
      expect(partServiceMock.findAllWithInventory).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    const partId: string = 'part-uuid';
    const partDtoMock: PartWithInventoryResponseDto = {
      id: 'parts/PART-001',
      partNumber: 'PART-001',
      description: 'Test Part',
      status: PartStatus.Active,
      listPrice: null,
      sellUom: null,
      totalOnHand: 0,
      totalCommitted: 0,
      totalSpecialOrderCommitted: 0,
      totalOnOrder: 0,
      totalAvailable: 0,
      totalNetAvailable: 0,
      totalBackordered: 0,
      primaryVendorName: null,
      primaryVendorPartNumber: null,
      primaryBinNumber: null,
      locationOnHand: null,
      locationCommitted: null,
      locationOnOrder: null,
      createdDate: new Date(),
      updatedDate: new Date(),
    };

    it('should return a part by ID', async () => {
      partServiceMock.findOne.mockResolvedValue(partDtoMock);

      const result: PartWithInventoryResponseDto = await controller.findOne(partId);

      expect(result).toEqual(partDtoMock);
      expect(partServiceMock.findOne).toHaveBeenCalledWith(partId);
      expect(partServiceMock.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when part not found', async () => {
      partServiceMock.findOne.mockRejectedValue(
        new NotFoundException(`Part with ID ${partId} not found`),
      );

      await expect(controller.findOne(partId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates through the service with the caller as author and sets Location', async () => {
      partServiceMock.create.mockResolvedValue({
        partNumber: 'BRK 1',
        description: 'Pad',
        locationId: null,
      });
      const res = {setHeader: vi.fn()};
      const dto = {partNumber: 'BRK 1', description: 'Pad', vendors: []} as never;

      const result = await controller.create(dto, {sub: 'user-1'} as never, res as never);

      expect(partServiceMock.create).toHaveBeenCalledWith(dto, 'user-1');
      expect(res.setHeader).toHaveBeenCalledWith('Location', '/api/parts/BRK%201');
      expect(result.partNumber).toBe('BRK 1');
    });
  });
});
