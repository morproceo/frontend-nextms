/**
 * exportCsv - CSV export utility
 *
 * Takes rows + column definitions and triggers a CSV file download.
 * Follows the blob-download pattern from useExpenseExport.
 */

/**
 * Escape a CSV field value
 * Wraps in quotes if it contains commas, quotes, or newlines
 */
function escapeField(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export data as a CSV file download
 *
 * @param {Array<Object>} rows - Array of data objects
 * @param {Array<{label: string, accessor: function}>} columns - Column definitions
 * @param {string} filename - Download filename (without .csv extension)
 *
 * @example
 * exportToCSV(loads, [
 *   { label: 'Reference', accessor: row => row.reference_number },
 *   { label: 'Revenue', accessor: row => row.financials?.revenue },
 * ], 'loads-report');
 */
export function exportToCSV(rows, columns, filename) {
  if (!rows || rows.length === 0) return;

  // Header row
  const header = columns.map(col => escapeField(col.label)).join(',');

  // Data rows
  const dataRows = rows.map(row =>
    columns.map(col => escapeField(col.accessor(row))).join(',')
  );

  const csv = [header, ...dataRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

  // Trigger download
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
