import type {PartFormValues} from '../schemas/partSchema';
import type {PartCreateInput} from '../types/part';

/** Create-form defaults (spec: Frontend Form Defaults): active, EA / EA, ratio 1.000. */
export function buildDefaultValues(): PartFormValues {
  return {
    partNumber: '',
    description: '',
    status: 'active',
    listPrice: '',
    priceGroup: '',
    glGroup: '',
    taxCode: '',
    sellUom: 'EA',
    purchaseUom: 'EA',
    salePurchaseRatio: '1',
    shippingWeight: '',
    shippingUnit: '',
    caseQty: '',
    minQty: '',
    maxQty: '',
    minDays: '',
    minOrder: '',
    onHandQty: '',
    pogNumber: '',
    popCode: '',
    comments: '',
    bypassPriceUpdate: false,
    serialized: false,
    vendors: [],
  };
}

const num = (value: string): number | undefined => (value === '' ? undefined : Number(value));
/** Dollars typed in the form become integer cents on the wire. */
const cents = (value: string): number | undefined =>
  value === '' ? undefined : Math.round(Number(value) * 100);
const text = (value: string): string | undefined =>
  value.trim() === '' ? undefined : value.trim();

/** Create mode omits empty optional fields entirely (spec: transformToApiPayload). */
export function transformToCreatePayload(
  values: PartFormValues,
  locationId: string | undefined,
): PartCreateInput {
  const payload: PartCreateInput = {
    partNumber: values.partNumber.trim(),
    description: values.description.trim(),
    status: values.status,
    vendors: values.vendors.map((v) => ({
      vendorNumber: v.vendorNumber.trim(),
      vendorPartNumber: text(v.vendorPartNumber),
      isPrimary: v.isPrimary,
      cost: cents(v.cost),
    })),
    locationId,
    onHandQty: num(values.onHandQty),
    listPrice: cents(values.listPrice),
    sellUom: text(values.sellUom),
    purchaseUom: text(values.purchaseUom),
    salePurchaseRatio: num(values.salePurchaseRatio),
    priceGroup: text(values.priceGroup),
    glGroup: text(values.glGroup),
    taxCode: text(values.taxCode),
    shippingWeight: num(values.shippingWeight),
    shippingUnit: text(values.shippingUnit),
    caseQty: num(values.caseQty),
    minQty: num(values.minQty),
    maxQty: num(values.maxQty),
    minDays: num(values.minDays),
    minOrder: num(values.minOrder),
    pogNumber: text(values.pogNumber),
    popCode: text(values.popCode),
    comments: text(values.comments),
    serialized: values.serialized,
    bypassPriceUpdate: values.bypassPriceUpdate,
  };
  return JSON.parse(JSON.stringify(payload)) as PartCreateInput;
}
