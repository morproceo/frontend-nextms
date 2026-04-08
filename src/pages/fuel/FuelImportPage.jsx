/**
 * FuelImportPage - Multi-step CSV import wizard for fuel transactions
 *
 * Steps:
 *   1. Upload CSV file + optional defaults (fuel card, driver, truck)
 *   2. Map CSV columns to system fields
 *   3. Review & confirm import
 *   4. Results summary
 *
 * Uses useFuelImporter hook for all state and logic.
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import {
  useFuelImporter,
  useFuelCardsList,
  useDriversList,
  useTrucksList
} from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import {
  Upload,
  FileText,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  List,
  MapPin,
  Eye
} from 'lucide-react';

const SYSTEM_FIELDS = [
  { id: '', label: '-- Skip this column --' },
  { id: 'transaction_date', label: 'Transaction Date' },
  { id: 'transaction_time', label: 'Transaction Time' },
  { id: 'reference_number', label: 'Reference Number' },
  { id: 'invoice_number', label: 'Invoice Number' },
  { id: 'merchant_name', label: 'Merchant Name' },
  { id: 'city', label: 'City' },
  { id: 'state', label: 'State' },
  { id: 'zip', label: 'ZIP Code' },
  { id: 'fuel_type', label: 'Fuel Type' },
  { id: 'gallons', label: 'Gallons' },
  { id: 'price_per_gallon', label: 'Price Per Gallon' },
  { id: 'fuel_amount', label: 'Fuel Amount' },
  { id: 'def_gallons', label: 'DEF Gallons' },
  { id: 'def_amount', label: 'DEF Amount' },
  { id: 'total_amount', label: 'Total Amount' },
  { id: 'tax_amount', label: 'Tax Amount' },
  { id: 'discount_amount', label: 'Discount Amount' },
  { id: 'odometer', label: 'Odometer' },
  { id: 'unit_number', label: 'Unit Number' },
  { id: 'notes', label: 'Notes' }
];

function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Upload' },
    { num: 2, label: 'Map Columns' },
    { num: 3, label: 'Review' },
    { num: 4, label: 'Results' }
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, idx) => (
        <div key={s.num} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-body-sm font-semibold ${
                currentStep === s.num
                  ? 'bg-accent text-white'
                  : currentStep > s.num
                  ? 'bg-green-100 text-green-700'
                  : 'bg-surface-secondary text-text-tertiary'
              }`}
            >
              {currentStep > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-body-sm hidden sm:inline ${
                currentStep === s.num
                  ? 'text-text-primary font-medium'
                  : 'text-text-tertiary'
              }`}
            >
              {s.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className="w-8 sm:w-12 h-px bg-surface-tertiary mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}

function UploadStep({ csvData, uploadFile, defaults, setDefaults }) {
  const { fuelCards, loading: cardsLoading } = useFuelCardsList();
  const { drivers, loading: driversLoading } = useDriversList();
  const { trucks, loading: trucksLoading } = useTrucksList();

  const cardOptions = useMemo(
    () => (fuelCards || []).map(c => ({ id: c.id, label: c.card_number, sublabel: c.provider })),
    [fuelCards]
  );

  const driverOptions = useMemo(
    () => (drivers || []).map(d => ({ id: d.id, label: `${d.first_name} ${d.last_name}` })),
    [drivers]
  );

  const truckOptions = useMemo(
    () => (trucks || []).map(t => ({ id: t.id, label: t.unit_number || t.vin, sublabel: `${t.year || ''} ${t.make || ''} ${t.model || ''}`.trim() })),
    [trucks]
  );

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.name.endsWith('.csv')) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <Card>
        <CardContent className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-surface-tertiary rounded-card p-10 text-center hover:border-accent/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {csvData ? (
              <div className="space-y-2">
                <FileText className="w-10 h-10 mx-auto text-accent" />
                <p className="text-body font-medium text-text-primary">
                  {csvData.fileName}
                </p>
                <p className="text-body-sm text-text-secondary">
                  {csvData.headers?.length} columns, {csvData.rows?.length} rows detected
                </p>
                <p className="text-small text-text-tertiary">
                  Click or drag to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 mx-auto text-text-tertiary" />
                <p className="text-body font-medium text-text-primary">
                  Drag and drop your CSV file here
                </p>
                <p className="text-body-sm text-text-secondary">
                  or click to browse
                </p>
                <p className="text-small text-text-tertiary">
                  Upload a CSV file from your fuel card provider (EFS, Comdata, WEX, etc.)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Optional defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Default Values (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-body-sm text-text-secondary">
            Assign defaults to all imported transactions. These can be overridden per-transaction later.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                Fuel Card
              </label>
              <SearchableSelect
                value={defaults.fuelCardId || ''}
                onChange={(item) => setDefaults(prev => ({ ...prev, fuelCardId: item?.id || null }))}
                options={cardOptions}
                placeholder="Select fuel card..."
                loading={cardsLoading}
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                Driver
              </label>
              <SearchableSelect
                value={defaults.driverId || ''}
                onChange={(item) => setDefaults(prev => ({ ...prev, driverId: item?.id || null }))}
                options={driverOptions}
                placeholder="Select driver..."
                loading={driversLoading}
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1">
                Truck
              </label>
              <SearchableSelect
                value={defaults.truckId || ''}
                onChange={(item) => setDefaults(prev => ({ ...prev, truckId: item?.id || null }))}
                options={truckOptions}
                placeholder="Select truck..."
                loading={trucksLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MapColumnsStep({ csvData, columnMapping, setMapping }) {
  const headers = csvData?.headers || [];
  const previewRows = useMemo(() => (csvData?.rows || []).slice(0, 5), [csvData]);

  // Build mapped headers for preview
  const mappedHeaders = useMemo(() => {
    return headers.map((h) => {
      const mapped = columnMapping[h];
      const field = SYSTEM_FIELDS.find(f => f.id === mapped);
      return field && field.id ? field.label : h;
    });
  }, [headers, columnMapping]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Map CSV Columns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-text-secondary mb-4">
            Match each CSV column to the corresponding system field.
          </p>
          <div className="space-y-3">
            {headers.map((header) => (
              <div
                key={header}
                className="grid grid-cols-2 gap-4 items-center py-2 border-b border-surface-tertiary last:border-0"
              >
                <div className="text-body-sm font-medium text-text-primary truncate" title={header}>
                  {header}
                </div>
                <select
                  value={columnMapping[header] || ''}
                  onChange={(e) => setMapping(header, e.target.value)}
                  className="w-full rounded-button border border-surface-tertiary bg-white px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  {SYSTEM_FIELDS.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview table */}
      {previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview (first {previewRows.length} rows)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr>
                  {mappedHeaders.map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-3 py-2 text-text-secondary font-medium bg-surface-secondary whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, ri) => (
                  <tr key={ri} className="border-t border-surface-tertiary">
                    {headers.map((h, ci) => (
                      <td key={ci} className="px-3 py-2 text-text-primary whitespace-nowrap">
                        {row[h] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReviewStep({ csvData, columnMapping, defaults }) {
  const mappedFields = useMemo(() => {
    return Object.entries(columnMapping)
      .filter(([, val]) => val)
      .map(([csv, system]) => {
        const field = SYSTEM_FIELDS.find(f => f.id === system);
        return { csv, system: field?.label || system };
      });
  }, [columnMapping]);

  const rowCount = csvData?.rows?.length || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-secondary rounded-card p-4 text-center">
              <p className="text-display-sm text-text-primary">{rowCount}</p>
              <p className="text-body-sm text-text-secondary">Rows to import</p>
            </div>
            <div className="bg-surface-secondary rounded-card p-4 text-center">
              <p className="text-display-sm text-text-primary">{mappedFields.length}</p>
              <p className="text-body-sm text-text-secondary">Fields mapped</p>
            </div>
            <div className="bg-surface-secondary rounded-card p-4 text-center">
              <p className="text-display-sm text-text-primary">
                {csvData?.headers?.length - mappedFields.length || 0}
              </p>
              <p className="text-body-sm text-text-secondary">Columns skipped</p>
            </div>
          </div>

          <div>
            <h4 className="text-body-sm font-medium text-text-primary mb-2">Mapped Fields</h4>
            <div className="flex flex-wrap gap-2">
              {mappedFields.map(({ csv, system }) => (
                <Badge key={csv} variant="info">
                  {csv} → {system}
                </Badge>
              ))}
            </div>
          </div>

          {(defaults.fuelCardId || defaults.driverId || defaults.truckId) && (
            <div>
              <h4 className="text-body-sm font-medium text-text-primary mb-2">Default Assignments</h4>
              <div className="flex flex-wrap gap-2">
                {defaults.fuelCardId && <Badge variant="secondary">Fuel Card assigned</Badge>}
                {defaults.driverId && <Badge variant="secondary">Driver assigned</Badge>}
                {defaults.truckId && <Badge variant="secondary">Truck assigned</Badge>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResultsStep({ results, onReset, onViewTransactions }) {
  if (!results) return null;

  const { imported = 0, skipped = 0, errors = [] } = results;
  const errorCount = errors.length;
  const hasErrors = errorCount > 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-display-sm text-text-primary">{imported}</p>
            <p className="text-body-sm text-text-secondary">Imported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-display-sm text-text-primary">{skipped}</p>
            <p className="text-body-sm text-text-secondary">Skipped</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <p className="text-display-sm text-text-primary">{errorCount}</p>
            <p className="text-body-sm text-text-secondary">Errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Error table */}
      {hasErrors && (
        <Card>
          <CardHeader>
            <CardTitle className="text-error">Errors</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-text-secondary font-medium bg-surface-secondary">
                    Row
                  </th>
                  <th className="text-left px-3 py-2 text-text-secondary font-medium bg-surface-secondary">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err, idx) => (
                  <tr key={idx} className="border-t border-surface-tertiary">
                    <td className="px-3 py-2 text-text-primary font-medium">{err.row}</td>
                    <td className="px-3 py-2 text-error">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Import More
        </Button>
        <Button onClick={onViewTransactions}>
          <List className="w-4 h-4 mr-2" />
          View Transactions
        </Button>
      </div>
    </div>
  );
}

export function FuelImportPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const {
    step,
    setStep,
    csvData,
    columnMapping,
    defaults,
    setDefaults,
    results,
    importing,
    uploadFile,
    setMapping,
    executeImport,
    reset
  } = useFuelImporter();

  const canGoNext = useMemo(() => {
    if (step === 1) return !!csvData;
    if (step === 2) {
      // At least one column must be mapped
      return Object.values(columnMapping).some(v => v);
    }
    if (step === 3) return !importing;
    return false;
  }, [step, csvData, columnMapping, importing]);

  const handleNext = useCallback(() => {
    if (step === 3) {
      executeImport();
    } else {
      setStep(step + 1);
    }
  }, [step, setStep, executeImport]);

  const handleBack = useCallback(() => {
    setStep(step - 1);
  }, [step, setStep]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const handleViewTransactions = useCallback(() => {
    navigate(orgUrl('/fuel/transactions'));
  }, [navigate, orgUrl]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(orgUrl('/fuel/transactions'))}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
        <h1 className="text-title text-text-primary">Import Fuel Transactions</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Import transactions from a CSV file in a few simple steps.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* Step content */}
      {step === 1 && (
        <UploadStep
          csvData={csvData}
          uploadFile={uploadFile}
          defaults={defaults}
          setDefaults={setDefaults}
        />
      )}

      {step === 2 && (
        <MapColumnsStep
          csvData={csvData}
          columnMapping={columnMapping}
          setMapping={setMapping}
        />
      )}

      {step === 3 && (
        <ReviewStep
          csvData={csvData}
          columnMapping={columnMapping}
          defaults={defaults}
        />
      )}

      {step === 4 && (
        <ResultsStep
          results={results}
          onReset={handleReset}
          onViewTransactions={handleViewTransactions}
        />
      )}

      {/* Navigation buttons (steps 1-3) */}
      {step < 4 && (
        <div className="flex items-center justify-between mt-8">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={importing}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <Button onClick={handleNext} disabled={!canGoNext || importing}>
            {importing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Importing...
              </>
            ) : step === 3 ? (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default FuelImportPage;
