import type {PagedResponseDto} from '@dms/data-models';
import {BadRequestException, ConflictException, NotFoundException} from '@nestjs/common';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {RavenDocumentStoreProvider} from '../../infrastructure/ravendb/document-store.provider';
import {RavenSessionFactory} from '../../infrastructure/ravendb/session-factory';
import {PartWithInventoryResponseDto} from '../dto/part-list.query.dto';
import {Part, PartStatus} from '../entities/part.entity';
import {PartService} from '../part.service';

function createQueryChain(parts: Part[] = [], totalResults = 0) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ['whereEquals', 'search', 'orderBy', 'skip', 'take'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain['statistics'] = vi.fn().mockImplementation((cb: (s: {totalResults: number}) => void) => {
    cb({totalResults});
    return chain;
  });
  chain['all'] = vi.fn().mockResolvedValue(parts);
  return chain;
}

function createMockSession() {
  const session = {
    load: vi.fn(),
    store: vi.fn(),
    saveChanges: vi.fn(),
    dispose: vi.fn(),
    query: vi.fn().mockReturnValue(createQueryChain()),
    [Symbol.dispose]() {
      (this as {dispose: () => void}).dispose();
    },
  };
  return session;
}

function createMockSessionFactory(session: ReturnType<typeof createMockSession>) {
  return {openSession: vi.fn().mockReturnValue(session)} as unknown as RavenSessionFactory;
}

function createMockStoreProvider() {
  return {
    getStore: vi.fn().mockReturnValue({
      executeIndex: vi.fn().mockResolvedValue(undefined),
    }),
  } as unknown as RavenDocumentStoreProvider;
}

const mockPart = (overrides: Partial<Part> = {}): Part => ({
  id: 'parts/PART-001',
  partNumber: 'PART-001',
  description: 'Test Part',
  status: PartStatus.Active,
  totalOnHand: 0,
  totalCommitted: 0,
  totalSpecialOrderCommitted: 0,
  totalOnOrder: 0,
  totalBackordered: 0,
  totalAvailable: 0,
  totalNetAvailable: 0,
  vendors: [],
  locations: [],
  createdBy: 'user-123',
  updatedBy: 'user-123',
  createdDate: new Date(),
  updatedDate: new Date(),
  isDeleted: false,
  version: 1,
  ...overrides,
});

describe('PartService', () => {
  let service: PartService;
  let session: ReturnType<typeof createMockSession>;
  let storeProvider: RavenDocumentStoreProvider;

  beforeEach(async () => {
    session = createMockSession();
    storeProvider = createMockStoreProvider();
    service = new PartService(storeProvider, createMockSessionFactory(session));
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a part by part number', async () => {
      session.load.mockResolvedValue(mockPart());

      const result: PartWithInventoryResponseDto = await service.findOne('PART-001');

      expect(session.load).toHaveBeenCalledWith('parts/PART-001');
      expect(result.partNumber).toBe('PART-001');
    });

    it('should throw NotFoundException when part not found', async () => {
      session.load.mockResolvedValue(null);

      await expect(service.findOne('MISSING')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('MISSING')).rejects.toThrow(
        'Part with part number MISSING not found',
      );
    });

    it('should throw NotFoundException when part is soft-deleted', async () => {
      session.load.mockResolvedValue(mockPart({isDeleted: true}));

      await expect(service.findOne('PART-001')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllWithInventory', () => {
    const locationId: string = 'loc-123';

    it('should return parts with inventory for a location', async () => {
      const parts = [mockPart()];
      const queryChain = createQueryChain(parts, 1);
      session.query.mockReturnValue(queryChain);

      const result: PagedResponseDto<PartWithInventoryResponseDto> =
        await service.findAllWithInventory({locationId});

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(queryChain.whereEquals).toHaveBeenCalledWith('isDeleted', false);
      expect(queryChain.whereEquals).toHaveBeenCalledWith('locationIds', `locations/${locationId}`);
    });

    it('should apply search term filter', async () => {
      const queryChain = createQueryChain([], 0);
      session.query.mockReturnValue(queryChain);

      await service.findAllWithInventory({locationId, searchTerm: 'test'});

      expect(queryChain.search).toHaveBeenCalledWith('query', 'test*', 'AND');
    });

    it('should apply pagination', async () => {
      const queryChain = createQueryChain([], 0);
      session.query.mockReturnValue(queryChain);

      await service.findAllWithInventory({locationId, page: 3, pageSize: 25});

      expect(queryChain.skip).toHaveBeenCalledWith(50);
      expect(queryChain.take).toHaveBeenCalledWith(25);
    });

    it('should use defaults for page and pageSize', async () => {
      const queryChain = createQueryChain([], 0);
      session.query.mockReturnValue(queryChain);

      await service.findAllWithInventory({locationId});

      expect(queryChain.skip).toHaveBeenCalledWith(0);
      expect(queryChain.take).toHaveBeenCalledWith(50);
    });
  });

  describe('create', () => {
    const vendor = {id: 'vendors/V1', vendorNumber: 'V1', name: 'Vendor One'};
    const dto = (overrides: Record<string, unknown> = {}) =>
      ({
        partNumber: 'BRK-1',
        description: 'Brake pad',
        vendors: [{vendorNumber: 'V1', isPrimary: true, cost: 1299}],
        ...overrides,
      }) as never;

    it('stores parts/{partNumber} once with cost in cents and avgCost from the primary vendor', async () => {
      session.load.mockImplementation(async (ids: string | string[]) =>
        Array.isArray(ids) ? {'vendors/V1': vendor} : null,
      );

      const result = await service.create(dto(), 'user-1');

      expect(result).toEqual({partNumber: 'BRK-1', description: 'Brake pad', locationId: null});
      expect(session.store).toHaveBeenCalledTimes(1);
      const [stored, id] = session.store.mock.calls[0];
      expect(id).toBe('parts/BRK-1');
      expect(stored.vendors[0].cost).toEqual({amount: 1299, currency: 'USD'});
      expect(stored.avgCost).toEqual({amount: 1299, currency: 'USD'});
      expect(stored.status).toBe(PartStatus.Active);
      expect(stored.createdBy).toBe('user-1');
      expect(session.saveChanges).toHaveBeenCalledTimes(1);
    });

    it('is 409 when a live part already has the number', async () => {
      session.load.mockResolvedValue(mockPart({id: 'parts/BRK-1', partNumber: 'BRK-1'}));
      await expect(service.create(dto(), 'user-1')).rejects.toThrow(ConflictException);
      expect(session.store).not.toHaveBeenCalled();
    });

    it('is 400 for an unknown vendor, before writing', async () => {
      session.load.mockImplementation(async (ids: string | string[]) =>
        Array.isArray(ids) ? {'vendors/V1': null} : null,
      );
      await expect(service.create(dto(), 'user-1')).rejects.toThrow(BadRequestException);
      expect(session.store).not.toHaveBeenCalled();
    });

    it('is 400 when maxQty < minQty, without touching the database', async () => {
      await expect(service.create(dto({minQty: 5, maxQty: 2}), 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(session.load).not.toHaveBeenCalled();
    });

    it('is 404 for an unknown location', async () => {
      session.load.mockImplementation(async (ids: string | string[]) =>
        Array.isArray(ids) ? {'vendors/V1': vendor} : null,
      );
      await expect(service.create(dto({locationId: 'LOC_NOPE'}), 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
