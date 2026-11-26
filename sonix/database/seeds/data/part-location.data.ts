import {partSeedData} from './part.data.js';

export type PartLocationSeedData = {
  id: string;
  partSeedId: string;
  binSeedId: string;
  locationName: string;
  onHandQty: number;
};

export const partLocationSeedData: PartLocationSeedData[] = partSeedData.flatMap(
  (part, partIndex) =>
    part.locations.flatMap((location, locationIndex) =>
      location.bins.map((bin, binIndex) => ({
        id: `pl-${partIndex + 1}-${locationIndex + 1}-${binIndex + 1}`,
        partSeedId: part.partNumber,
        binSeedId: `${location.locationName}/${bin.binCode}`,
        locationName: location.locationName,
        onHandQty: bin.numOnHand,
      })),
    ),
);
