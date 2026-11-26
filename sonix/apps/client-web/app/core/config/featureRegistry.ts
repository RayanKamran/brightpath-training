export type FeatureStatus = 'complete' | 'partial' | 'not-started';

export type FeatureCategory = 'inventory' | 'admin';

export type Feature = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  route: string;
  category: FeatureCategory;
  status: FeatureStatus;
};

export const CATEGORY_LABEL_KEYS: Record<FeatureCategory, string> = {
  inventory: 'navigation:categories.inventory',
  admin: 'navigation:categories.admin',
};

export const STATUS_CONFIG: Record<
  FeatureStatus,
  {labelKey: string; color: string; chipColor: 'success' | 'warning' | 'default'}
> = {
  complete: {labelKey: 'navigation:status.complete', color: '#d32f2f', chipColor: 'success'},
  partial: {labelKey: 'navigation:status.inProgress', color: '#ed6c02', chipColor: 'warning'},
  'not-started': {
    labelKey: 'navigation:status.notStarted',
    color: 'text.disabled',
    chipColor: 'default',
  },
};

export const FEATURES: Feature[] = [
  // Inventory
  {
    id: 'parts-inventory',
    nameKey: 'navigation:features.partsInventory.name',
    descriptionKey: 'navigation:features.partsInventory.description',
    route: '/parts',
    category: 'inventory',
    status: 'partial',
  },
  {
    id: 'work-order',
    nameKey: 'navigation:features.workOrder.name',
    descriptionKey: 'navigation:features.workOrder.description',
    route: '/work-orders',
    category: 'inventory',
    status: 'not-started',
  },

  // Admin & Settings
  {
    id: 'locations',
    nameKey: 'navigation:features.locations.name',
    descriptionKey: 'navigation:features.locations.description',
    route: '/locations',
    category: 'admin',
    status: 'partial',
  },
  {
    id: 'users',
    nameKey: 'navigation:features.users.name',
    descriptionKey: 'navigation:features.users.description',
    route: '/users',
    category: 'admin',
    status: 'partial',
  },
  {
    id: 'system-config',
    nameKey: 'navigation:features.systemConfig.name',
    descriptionKey: 'navigation:features.systemConfig.description',
    route: '/system-config',
    category: 'admin',
    status: 'not-started',
  },
  {
    id: 'integrations',
    nameKey: 'navigation:features.integrations.name',
    descriptionKey: 'navigation:features.integrations.description',
    route: '/integrations',
    category: 'admin',
    status: 'not-started',
  },
];

/** Returns features grouped by category, preserving category order. */
export function getFeaturesByCategory(): Map<FeatureCategory, Feature[]> {
  const categoryOrder: FeatureCategory[] = ['inventory', 'admin'];

  const map = new Map<FeatureCategory, Feature[]>();
  for (const category of categoryOrder) {
    map.set(category, []);
  }

  for (const feature of FEATURES) {
    const list = map.get(feature.category);
    if (list) {
      list.push(feature);
    }
  }

  return map;
}

/** Returns the feature matching a given route, or undefined if not found. */
export function getFeatureByRoute(route: string): Feature | undefined {
  return FEATURES.find((f) => f.route === route);
}

/** Returns the feature matching a given id, or undefined if not found. */
export function getFeatureById(id: string): Feature | undefined {
  return FEATURES.find((f) => f.id === id);
}
