/**
 * useComplianceCommandCenter - Domain hook for Compliance Command Center
 *
 * Composes:
 * - Compliance summary (KPI stats)
 * - Driver alerts (expiring/expired docs)
 * - Truck alerts (expiring/expired inspections, registrations)
 * - Trailer alerts (expiring/expired inspections, registrations)
 * - Company permits (FMCSA checklist)
 * - Tab navigation (dashboard, drivers, equipment, company permits)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import complianceApi from '../../api/compliance.api';
import driversApi from '../../api/drivers.api';
import trucksApi from '../../api/trucks.api';
import trailersApi from '../../api/trailers.api';

export function useComplianceCommandCenter() {
  // ---- Tabs ----
  const [activeTab, setActiveTab] = useState('dashboard');

  // ---- Loading / Error ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // ---- Data ----
  const [summary, setSummary] = useState(null);
  const [driverAlerts, setDriverAlerts] = useState([]);
  const [truckAlerts, setTruckAlerts] = useState([]);
  const [trailerAlerts, setTrailerAlerts] = useState([]);
  const [companyPermits, setCompanyPermits] = useState([]);
  const [permitDocuments, setPermitDocuments] = useState({}); // { [permitKey]: Document[] }

  // ---- Fetch all data on mount ----
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, driversRes, trucksRes, trailersRes, permitsRes] = await Promise.all([
        complianceApi.getComplianceSummary(),
        driversApi.getDriversNeedingAttention(),
        trucksApi.getTrucksNeedingAttention(),
        trailersApi.getTrailersNeedingAttention(),
        complianceApi.getCompanyPermits()
      ]);

      setSummary(summaryRes.data);
      setDriverAlerts(driversRes.data || []);
      setTruckAlerts(trucksRes.data || []);
      setTrailerAlerts(trailersRes.data || []);
      setCompanyPermits(permitsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---- KPI stats ----
  const kpis = useMemo(() => {
    if (!summary) return null;

    const totalAlerts =
      (summary.drivers?.expiringSoon || 0) + (summary.drivers?.expired || 0) +
      (summary.trucks?.expiringSoon || 0) + (summary.trucks?.expired || 0) +
      (summary.trailers?.expiringSoon || 0) + (summary.trailers?.expired || 0);

    const driverAlertCount = (summary.drivers?.expiringSoon || 0) + (summary.drivers?.expired || 0);
    const equipmentAlertCount =
      (summary.trucks?.expiringSoon || 0) + (summary.trucks?.expired || 0) +
      (summary.trailers?.expiringSoon || 0) + (summary.trailers?.expired || 0);

    return {
      totalAlerts,
      driverAlerts: driverAlertCount,
      equipmentAlerts: equipmentAlertCount,
      permitsCompliant: summary.companyPermits?.completed || 0,
      permitsTotal: summary.companyPermits?.total || 0
    };
  }, [summary]);

  // ---- Combined alerts for Dashboard tab ----
  const allAlerts = useMemo(() => {
    const now = new Date();
    const alerts = [];

    // Process driver alerts
    driverAlerts.forEach(driver => {
      const name = `${driver.first_name} ${driver.last_name}`;
      const fields = [
        { key: 'license_expiry', label: 'CDL License' },
        { key: 'medical_card_expiry', label: 'Medical Card' },
        { key: 'drug_test_expiry', label: 'Drug Test' },
        { key: 'mvr_expiry', label: 'MVR' }
      ];

      fields.forEach(field => {
        if (driver[field.key]) {
          const expiry = new Date(driver[field.key]);
          const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 30) {
            alerts.push({
              id: `driver-${driver.id}-${field.key}`,
              type: 'driver',
              entityId: driver.id,
              entityName: name,
              field: field.label,
              expiryDate: driver[field.key],
              daysUntil,
              severity: daysUntil <= 0 ? 'expired' : 'expiring'
            });
          }
        }
      });
    });

    // Process truck alerts
    truckAlerts.forEach(truck => {
      const fields = [
        { key: 'annual_inspection_expiry', label: 'Annual Inspection' },
        { key: 'registration_expiry', label: 'Registration' },
        { key: 'insurance_expiry', label: 'Insurance' },
        { key: 'irp_expiry', label: 'IRP' },
        { key: 'ifta_expiry', label: 'IFTA' },
        { key: 'next_service_date', label: 'Next Service' }
      ];

      fields.forEach(field => {
        if (truck[field.key]) {
          const expiry = new Date(truck[field.key]);
          const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 30) {
            alerts.push({
              id: `truck-${truck.id}-${field.key}`,
              type: 'truck',
              entityId: truck.id,
              entityName: truck.unit_number || `Truck #${truck.id.slice(0, 8)}`,
              field: field.label,
              expiryDate: truck[field.key],
              daysUntil,
              severity: daysUntil <= 0 ? 'expired' : 'expiring'
            });
          }
        }
      });
    });

    // Process trailer alerts
    trailerAlerts.forEach(trailer => {
      const fields = [
        { key: 'annual_inspection_expiry', label: 'Annual Inspection' },
        { key: 'registration_expiry', label: 'Registration' },
        { key: 'insurance_expiry', label: 'Insurance' },
        { key: 'next_service_date', label: 'Next Service' }
      ];

      fields.forEach(field => {
        if (trailer[field.key]) {
          const expiry = new Date(trailer[field.key]);
          const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 30) {
            alerts.push({
              id: `trailer-${trailer.id}-${field.key}`,
              type: 'trailer',
              entityId: trailer.id,
              entityName: trailer.unit_number || `Trailer #${trailer.id.slice(0, 8)}`,
              field: field.label,
              expiryDate: trailer[field.key],
              daysUntil,
              severity: daysUntil <= 0 ? 'expired' : 'expiring'
            });
          }
        }
      });
    });

    // Sort: expired first (most overdue), then expiring soon (soonest first)
    alerts.sort((a, b) => a.daysUntil - b.daysUntil);

    return alerts;
  }, [driverAlerts, truckAlerts, trailerAlerts]);

  // ---- Save company permits ----
  const saveCompanyPermits = useCallback(async (permits) => {
    setSaving(true);
    try {
      const res = await complianceApi.updateCompanyPermits(permits);
      setCompanyPermits(res.data || permits);
      // Refetch summary to update KPIs
      const summaryRes = await complianceApi.getComplianceSummary();
      setSummary(summaryRes.data);
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  // ---- Permit document operations ----
  const fetchPermitDocuments = useCallback(async (permitKey) => {
    try {
      const res = await complianceApi.getPermitDocuments(permitKey);
      setPermitDocuments(prev => ({ ...prev, [permitKey]: res.data || [] }));
    } catch (err) {
      console.error(`Failed to fetch documents for permit ${permitKey}:`, err);
    }
  }, []);

  const uploadPermitDoc = useCallback(async (permitKey, file, options = {}, onProgress) => {
    const result = await complianceApi.uploadPermitDocument(permitKey, file, options, onProgress);
    // Refresh that permit's documents
    await fetchPermitDocuments(permitKey);
    return result;
  }, [fetchPermitDocuments]);

  const deletePermitDoc = useCallback(async (permitKey, documentId) => {
    await complianceApi.deletePermitDocument(documentId);
    // Refresh that permit's documents
    await fetchPermitDocuments(permitKey);
  }, [fetchPermitDocuments]);

  return {
    // Tabs
    activeTab,
    setActiveTab,

    // KPIs
    kpis,
    summary,

    // Alerts
    allAlerts,
    driverAlerts,
    truckAlerts,
    trailerAlerts,

    // Company Permits
    companyPermits,
    saveCompanyPermits,
    saving,

    // Permit Documents
    permitDocuments,
    fetchPermitDocuments,
    uploadPermitDoc,
    deletePermitDoc,

    // Overall
    loading,
    error,
    refetch: fetchAll
  };
}

export default useComplianceCommandCenter;
