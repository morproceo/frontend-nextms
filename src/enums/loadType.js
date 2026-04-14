/**
 * Load Type
 * Mirrors backend/src/enums/loadType.js
 *
 * STANDARD loads count toward RPM metrics.
 * Other types (trailer rentals, etc.) have revenue included in totals
 * but are excluded from per-mile calculations.
 */

export const LoadType = Object.freeze({
  STANDARD: 'standard',
  TRAILER_RENTAL: 'trailer_rental'
});

export const LoadTypeLabels = Object.freeze({
  [LoadType.STANDARD]: 'Standard Load',
  [LoadType.TRAILER_RENTAL]: 'Trailer Rental'
});

export const LoadTypeColors = Object.freeze({
  [LoadType.STANDARD]: 'blue',
  [LoadType.TRAILER_RENTAL]: 'amber'
});

export const LoadTypeDescriptions = Object.freeze({
  [LoadType.STANDARD]: 'Regular per-mile freight load — counts toward rate-per-mile metrics',
  [LoadType.TRAILER_RENTAL]: 'Broker-owned trailer move for a flat fee — excluded from rate-per-mile metrics'
});

/**
 * Load types whose revenue/miles count toward RPM calculations.
 * Types NOT in this array: their revenue still counts in total revenue,
 * but they are excluded from rate-per-mile aggregations.
 */
export const LoadTypesIncludedInRpm = Object.freeze([
  LoadType.STANDARD
]);

/**
 * Check if a load type should count toward RPM metrics
 */
export const includesInRpm = (loadType) => {
  if (!loadType) return true; // safe fallback for legacy data
  return LoadTypesIncludedInRpm.includes(loadType);
};
