// DAT-style equipment short-codes used in the load board "Truck" column.
//
// Backend stores `equipment_requirements.types` as an array of long names
// (`flatbed`, `dry_van`, `reefer`, `step_deck`, `power_only`, ...). The
// board renders the short codes (F, V, R, SD, PO) so the truck column
// stays narrow.

export const EQUIPMENT_CODES = {
  flatbed: 'F',
  dry_van: 'V',
  van: 'V',
  reefer: 'R',
  refrigerated: 'R',
  step_deck: 'SD',
  stepdeck: 'SD',
  power_only: 'PO',
  powr: 'PO',
  conestoga: 'C',
  hotshot: 'HS',
  rgn: 'RGN',
  lowboy: 'LB',
  tanker: 'T'
};

export const EQUIPMENT_LABELS = {
  F: 'Flatbed',
  V: 'Dry van',
  R: 'Reefer',
  SD: 'Step deck',
  PO: 'Power only'
};

export const FILTER_CHIPS = ['F', 'V', 'R', 'SD', 'PO'];

export function codesForLoad(load) {
  const types = load?.equipment_requirements?.types;
  if (!Array.isArray(types) || types.length === 0) return [];
  return Array.from(
    new Set(
      types
        .map((t) => EQUIPMENT_CODES[String(t).toLowerCase()])
        .filter(Boolean)
    )
  );
}

export function codeToBackendType(code) {
  // Reverse — used by the filter chips. Picks the canonical long name.
  const reverse = {
    F: 'flatbed',
    V: 'dry_van',
    R: 'reefer',
    SD: 'step_deck',
    PO: 'power_only'
  };
  return reverse[code] || null;
}
