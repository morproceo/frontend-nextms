/**
 * Asset Status (Trucks/Trailers)
 */

export const AssetStatus = Object.freeze({
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive'
});

export const AssetStatusLabels = Object.freeze({
  [AssetStatus.ACTIVE]: 'Active',
  [AssetStatus.MAINTENANCE]: 'In Maintenance',
  [AssetStatus.INACTIVE]: 'Inactive'
});

export const AssetStatusColors = Object.freeze({
  [AssetStatus.ACTIVE]: 'green',
  [AssetStatus.MAINTENANCE]: 'yellow',
  [AssetStatus.INACTIVE]: 'gray'
});

export const TrailerType = Object.freeze({
  DRY_VAN: 'dry_van',
  REEFER: 'reefer',
  FLATBED: 'flatbed',
  STEP_DECK: 'step_deck',
  OTHER: 'other'
});

export const TrailerTypeLabels = Object.freeze({
  [TrailerType.DRY_VAN]: 'Dry Van',
  [TrailerType.REEFER]: 'Reefer',
  [TrailerType.FLATBED]: 'Flatbed',
  [TrailerType.STEP_DECK]: 'Step Deck',
  [TrailerType.OTHER]: 'Other'
});
