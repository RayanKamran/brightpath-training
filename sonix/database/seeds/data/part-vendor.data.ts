import {partSeedData} from './part.data.js';

type MoneyValue = {amount: number; currency: string};

export type PartVendorSeedData = {
  id: string;
  partId: string;
  vendorId: string;
  vendorPartNumber?: string;
  cost?: MoneyValue;
  setPrimaryVendor: boolean;
};

export const partVendorSeedData: PartVendorSeedData[] = partSeedData.flatMap((part, partIndex) =>
  part.vendors.map((vendor, vendorIndex) => ({
    id: `pv-${partIndex + 1}-${vendorIndex + 1}`,
    partId: `parts/${part.partNumber}`,
    vendorId: `vendors/${vendor.vendorCode}`,
    vendorPartNumber: vendor.vendorPartNumber,
    cost: vendor.cost,
    setPrimaryVendor: vendor.isPrimary,
  })),
);
