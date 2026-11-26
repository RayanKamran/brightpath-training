# Design Standards — DMS Sonix Frontend

> Applies to `apps/client-web/`. Read alongside `docs/CODING_STANDARD.md`.

---

## Material UI (MUI)

### Always Use the `sx` Prop

Use `sx` for **all** component styling. Never use `styled()`, inline `style={{}}`, or external CSS files for MUI components.

```typescript
// ✅ Correct
<Box sx={{p: 3, display: 'flex', gap: 2}}>
  <Paper sx={{width: '100%', mb: 2, borderRadius: 2}}>
    <Typography sx={{fontWeight: 600, color: 'primary.main'}}>
      Content
    </Typography>
  </Paper>
</Box>

// ❌ Wrong — no styled(), no inline style
const StyledBox = styled(Box)({padding: 24}); // never
<Box style={{padding: 24}}>                   // never
```

Why `sx` over `styled()`:
- Direct access to theme tokens (`primary.main`, `text.secondary`, `action.selected`)
- Responsive syntax: `sx={{width: {xs: '100%', md: '50%'}}}`
- Better performance (runtime optimization vs. CSS-in-JS class generation)

### Responsive Breakpoints

```typescript
// Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
<Box sx={{
  display: 'grid',
  gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)'},
  gap: 2,
}}>
```

### Theme Tokens — Prefer Over Raw Values

```typescript
// ✅ Theme tokens
sx={{color: 'text.secondary', bgcolor: 'action.selected', borderColor: 'divider'}}

// ❌ Raw values (loses dark mode + theme customization)
sx={{color: '#666', backgroundColor: '#f5f5f5'}}
```

### Path Imports Only

MUI components must use **path imports** to avoid loading the entire library:

```typescript
import Button from '@mui/material/Button';         // ✅
import Typography from '@mui/material/Typography';  // ✅
import {Button} from '@mui/material';              // ❌ barrel import
```

### CSS Variables

All custom CSS variables use the `--ids-` prefix:

```css
:root {
  --ids-brand-primary: #1976d2;
  --ids-sidebar-width: 240px;
}
```

---

## Form Architecture (React Hook Form + Valibot)

Features with create/edit forms follow a consistent four-layer pattern:

```
Schema → Mapper → Form Component → Page (Route Module)
```

### Layer 1: Schema (`schemas/{feature}Schema.ts`)

Valibot schemas define validation rules. Separate schemas for create vs update when field requirements differ:

```typescript
import * as v from 'valibot';

export const partCreateSchema = v.object({
  partNumber: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  description: v.pipe(v.string(), v.minLength(1)),
  status: v.enum(PartStatus),
  listPrice: v.optional(v.number()),
});

export const partUpdateSchema = v.object({
  description: v.pipe(v.string(), v.minLength(1)),
  // partNumber is disabled on update — not included here
});
```

### Layer 2: Mapper (`mappers/{feature}FormMapper.ts`)

Transforms between API shape and form shape:

```typescript
// API response → form default values
export function buildDefaultValues(part: PartDetail | null, options: FormOptions): PartFormValues {
  return {
    partNumber: part?.partNumber ?? '',
    description: part?.description ?? '',
    listPrice: part?.listPrice ? part.listPrice.amount / 100 : null,
    // ...
  };
}

// Form values → API request body
export function transformToApiPayload(values: PartFormValues, mode: 'create' | 'update', locale: string): CreatePartDto | UpdatePartDto {
  return {
    description: values.description,
    listPrice: values.listPrice != null ? {amount: Math.round(values.listPrice * 100), currency: 'USD'} : null,
    // ...
  };
}
```

### Layer 3: Form Component (`{Feature}Form.tsx`)

Uses `FormProvider` + `useForm` with `valibotResolver`. Section components access form state via `useFormContext()` — no prop drilling:

```typescript
export function PartForm({initialData, options, mode}: PartFormProps) {
  const methods = useForm<PartFormValues>({
    resolver: valibotResolver(mode === 'create' ? partCreateSchema : partUpdateSchema),
    defaultValues: buildDefaultValues(initialData, options),
  });

  return (
    <FormProvider {...methods}>
      <form id="part-form" onSubmit={methods.handleSubmit(onSubmit)}>
        <PartIdentitySection />
        <PricingSection />
        {/* A hidden submit button lets the page-level Save button trigger the form */}
        <button type="submit" style={{display: 'none'}} />
      </form>
    </FormProvider>
  );
}
```

### Layer 4: Page (`{Feature}Create.tsx` / `{Feature}Edit.tsx`)

Route module with `clientLoader` (pre-fetch dropdown options) and `clientAction` (handle form submission). Uses `useActionData` and `useNavigation` for submit state:

```typescript
export async function clientLoader({context}: ClientLoaderFunctionArgs) {
  const resolvedLocation = context.get(RESOLVED_LOCATION_CONTEXT);
  // pre-fetch options needed by the form
  return {vendors: await vendorQueries.fetchAll({token: resolvedLocation.locationToken})};
}

export async function clientAction({request}: ClientActionFunctionArgs) {
  const formData = await request.formData();
  // parse, validate, call API
}

export default function PartCreate() {
  const {vendors} = useLoaderData<typeof clientLoader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <>
      <PartForm mode="create" options={{vendors}} />
      <Button
        form="part-form"
        type="submit"
        disabled={isSubmitting}
        variant="contained"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </>
  );
}
```

---

## Search & Filtering — Type-Ahead Pattern

The standard search bar pattern used in list pages (PartList, etc.):

### Behavior Rules

1. **Debounced** — 300ms delay before the API call fires. Never call the API on every keystroke.
2. **Minimum length** — activate full-text search only when the trimmed value is ≥ 2 characters
3. **Page reset** — when the search term changes, reset to page 1 automatically
4. **URL sync** — search term and page are stored in URL params (`?search=belt&page=1`) so the user can share/bookmark results and the browser Back button works
5. **Placeholder data** — keep the previous results visible while fetching new results (no flash to empty state)

### Implementation Pattern

```typescript
// Read from URL params
const [searchParams, setSearchParams] = useSearchParams();
const searchTerm = searchParams.get('search') ?? '';
const page = parseInt(searchParams.get('page') ?? '1', 10);

// Debounce the search term
const debouncedSearch = useDebouncedValue(searchTerm, 300);

// Update URL on input change (resets page to 1)
function handleSearchChange(value: string) {
  setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    next.set('search', value);
    next.set('page', '1');  // always reset page on new search
    return next;
  });
}

// TanStack Query — keeps previous data visible during refetch
const {data, isLoading} = useQuery({
  queryKey: PART_QUERY_KEYS.list(locationId, {page, pageSize, searchTerm: debouncedSearch}),
  queryFn: ({signal}) => partQueries.fetchAll({locationId, searchTerm: debouncedSearch, page, pageSize, signal, token: locationToken}),
  enabled: !!locationId && !!locationToken,
  placeholderData: (previousData) => previousData,  // keep previous results visible
});
```

---

## Data Grid (MUI X DataGrid)

### Server-Side Pagination

All list pages use server-side pagination (`paginationMode="server"`). The frontend never loads all records:

```typescript
<DataGrid
  rows={parts}
  columns={columns}
  rowCount={data?.total ?? 0}
  paginationMode="server"
  paginationModel={{page: page - 1, pageSize}}   // DataGrid is 0-indexed; URL is 1-indexed
  onPaginationModelChange={({page: p, pageSize: ps}) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p + 1));
      next.set('pageSize', String(ps));
      return next;
    });
  }}
  pageSizeOptions={[10, 25, 50, 100]}
  loading={isFetching}
/>
```

Key notes:
- DataGrid pages are 0-indexed; URL params and API calls use 1-indexed pages — always convert
- `rowCount` must be the total record count from the server (not the current page length) for pagination controls to work
- Fixed row height calculated to show exactly N rows avoids layout collapse in flex containers — measure container with `ResizeObserver` if needed

### Row Click Navigation

```typescript
<DataGrid
  onRowClick={({row}) => navigate(`/parts/${row.partNumber}`)}
  // Make rows look clickable
  sx={{'& .MuiDataGrid-row': {cursor: 'pointer'}}}
/>
```

### Column Definitions (`columns.tsx`)

Keep column definitions in a separate `columns.tsx` file. Pass locale and formatting functions as parameters:

```typescript
export function buildColumns(t: TFunction, lang: string): GridColDef[] {
  return [
    {
      field: 'partNumber',
      headerName: t('partNumber'),
      renderCell: ({value}) => <Link to={`/parts/${value}`}>{value}</Link>,
    },
    {
      field: 'listPrice',
      headerName: t('listPrice'),
      valueFormatter: ({value}: {value: Money | null}) =>
        value ? formatCurrency(value.amount / 100, lang, 'USD', {minimumFractionDigits: 4, maximumFractionDigits: 4}) : '—',
    },
  ];
}
```

---

## Localization (i18n)

- Use `react-i18next` with `useTranslation(namespace)`
- Translation files in `app/locales/{lang}/{namespace}.json`
- English (`en/`) is the source of truth; French (`fr/`) is the secondary locale
- All user-visible strings must be translated — never hard-code English text in components
- Translation key naming: `feature.section.fieldName` (e.g. `create.fields.partNumber`, `edit.onHand`)

```typescript
const {t, i18n} = useTranslation('parts');
const lang = i18n.language;

// Use t() for labels
<Typography>{t('create.fields.partNumber')}</Typography>

// Use lang for number/date formatting
formatCurrency(amount, lang, 'USD');
new Date(part.lastSold).toLocaleDateString(lang);
```

---

## Loading & Error States

### Loading

Use `CircularProgress` centered in a `Box`:

```typescript
if (isLoading) {
  return (
    <Box sx={{p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <CircularProgress />
    </Box>
  );
}
```

### Errors

Use `QueryErrorAlert` (shared component) for TanStack Query errors. For business errors (record not found), use MUI `Alert`:

```typescript
if (error || !data) {
  return (
    <Box sx={{p: 3}}>
      <QueryErrorAlert error={error instanceof Error ? error : null} />
      {!error && <Alert severity="error">{t('partNotFound')}</Alert>}
    </Box>
  );
}
```

---

## Navigation (ComingSoon Pattern)

Menu items that are not yet implemented use `route: null` in the nav category definition, which triggers `ComingSoonDialog` when clicked. This lets us show the full navigation hierarchy to users without dead-end routes.

```typescript
const categories: NavCategory[] = [
  {
    key: 'inventory',
    label: t('navigation:inventory'),
    icon: <InventoryIcon />,
    items: [
      {label: t('navigation:partsInventory'), icon: <ChecklistIcon color="inherit" />, featureId: 'parts-inventory', route: '/parts'},   // implemented
      {label: t('navigation:unitInventory'), icon: <RvHookupIcon color="inherit" />, featureId: 'unit-inventory', route: null},           // coming soon
    ],
  },
];
```

`featureId` is used by `featureIconColor()` to determine the icon color. If the `featureId` is not registered in `featureRegistry.ts`, the color falls back to `'inherit'` — the correct default for coming-soon items.

---

## Breadcrumbs

Use the `Breadcrumb` shared component for all page breadcrumbs:

```typescript
<Breadcrumb
  items={[
    {label: t('title'), to: '/parts'},     // clickable link
    {label: part.partNumber},              // current page (not a link)
  ]}
/>
```

---

## Money Handling

Money values in the API and database are stored as **integer cents** (e.g. `$19.9900` = `199900` cents). Always divide by 100 when displaying, and multiply by 100 when sending to the API:

```typescript
// Display
formatCurrency(part.listPrice.amount / 100, lang, 'USD', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

// Input fields use MoneyField component which handles conversion internally
<MoneyField name="listPrice" label={t('create.fields.listPrice')} />
```

For form fields, use the `MoneyField` shared component (which stores and reads in cents internally). For display-only, use `formatCurrency()` from `core/formatters/formatCurrency`.
