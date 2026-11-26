import type {Money} from '@dms/data-models';

export type Part = {
  id: string;
  partNumber: string;
  description: string;
  status: string;
  listPrice: Money | null;
  sellUom: string | null;
  totalOnHand: number | null;
  totalCommitted: number | null;
  totalOnOrder: number | null;
  totalBackordered: number | null;
  totalAvailable: number | null;
  primaryVendorName: string | null;
  primaryVendorPartNumber: string | null;
  primaryBinNumber: string | null;
  locationOnHand: number | null;
  locationCommitted: number | null;
  locationOnOrder: number | null;
  createdDate: string;
  updatedDate: string;
};

export type PartListResponse = {
  items: Part[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PartSearchCriteria = {
  locationId: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
  token?: string | null;
  refreshToken?: () => Promise<string | null>;
};

export type PartVendorInput = {
  vendorNumber: string;
  vendorPartNumber?: string;
  cost?: number;
  isPrimary: boolean;
};

export type PartStatusCodeOption = {
  code: string;
  description: string;
};

export type GlGroupOption = {
  code: string;
  description: string;
};

export type TaxCodeOption = {
  code: string;
  description: string;
  rate: number | null;
};

export type SaleCategoryOption = {
  code: string;
  description: string;
  defaultGlGroupCode: string | null;
};

export type ShipWeightCodeOption = {
  code: string;
  description: string;
};

export type PartDetailVendor = {
  vendorNumber: string;
  vendorName: string;
  vendorPartNumber: string | null;
  cost: Money | null;
  isPrimary: boolean;
};

/** Full part detail from GET /api/parts/:partNumber — used for the edit form. */
export type PartDetail = Part & {
  purchaseUom: string | null;
  salePurchaseRatio: number | null;
  comments: string | null;
  shippingWeight: number | null;
  shippingUnit: string | null;
  caseQty: number | null;
  minQty: number | null;
  maxQty: number | null;
  minDays: number | null;
  minOrder: number | null;
  bypassPriceUpdate: boolean;
  promptForSerialNumber: boolean;
  avgCost: Money | null;
  priceGroup: string | null;
  glGroup: string | null;
  taxCode: string | null;
  pogNumber: string | null;
  popCode: string | null;
  alternatePartNumbers: string[];
  totalSpecialOrderCommitted: number;
  totalNetAvailable: number;
  lastReceived: string | null;
  lastSold: string | null;
  bins: PartDetailBin[];
  vendors: PartDetailVendor[];
};

export type PartDetailBin = {
  binNumber: string;
  description: string | null;
  isMain: boolean;
};

/** POST /parts payload. Money fields are cents. */
export type PartCreateInput = {
  partNumber: string;
  description: string;
  status?: string;
  vendors: Array<{
    vendorNumber: string;
    vendorPartNumber?: string;
    isPrimary: boolean;
    cost?: number;
  }>;
  locationId?: string;
  onHandQty?: number;
  listPrice?: number;
  sellUom?: string;
  purchaseUom?: string;
  salePurchaseRatio?: number;
  priceGroup?: string;
  glGroup?: string;
  taxCode?: string;
  shippingWeight?: number;
  shippingUnit?: string;
  caseQty?: number;
  minQty?: number;
  maxQty?: number;
  minDays?: number;
  minOrder?: number;
  pogNumber?: string;
  popCode?: string;
  comments?: string;
  serialized?: boolean;
  bypassPriceUpdate?: boolean;
};

export type PartCreateResult = {partNumber: string; description: string; locationId: string | null};
