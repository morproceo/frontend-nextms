/**
 * useDispatchCommandCenter - Domain hook for Dispatch Command Center
 *
 * Composes:
 * - Timeline data (active loads with events)
 * - KPI stats (active loads, in transit, delivered, avg RPM)
 * - LogIQ (profitability calculator using Mapbox + org cost/mile or P&L fallback)
 * - Tab navigation (timeline, map, finances)
 * - Map data (load route locations from route_cache)
 * - Cost calculator (operating cost breakdown → cost/mile)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatchTimeline, useCostSettings, useSaveCostSettings } from '../api/useDispatchApi';
import { useLoadStats } from '../api/useLoadsApi';
import { usePnlReport } from '../api/usePnlApi';
import mapApi from '../../api/map.api';

const DEFAULT_COST_FORM = {
  fuelPricePerGallon: '',
  milesPerGallon: '',
  driverPayPerMile: '',
  insuranceMonthly: '',
  workersCompMonthly: '',
  tractorPaymentMonthly: '',
  trailerPaymentMonthly: '',
  repairsMonthly: '1250',
  accountingAnnual: '',
  irpAnnual: '2000',
  subscriptionsAnnual: '',
  otherMonthly: '',
  milesPerMonth: '10000'
};

const MIN_PROFIT_PER_MILE = 0.55;

export function useDispatchCommandCenter() {
  // ---- Tabs ----
  const [activeTab, setActiveTab] = useState('timeline');

  // ---- Timeline ----
  const [timelineDays, setTimelineDays] = useState(7);
  const { timeline, loading: timelineLoading, error: timelineError, fetchTimeline } = useDispatchTimeline();

  // ---- KPIs ----
  const { stats, loading: statsLoading, fetchStats } = useLoadStats();

  // ---- P&L for fallback cost per mile ----
  const { report: pnlReport, fetchPnl } = usePnlReport();

  // ---- Cost Settings ----
  const { costSettings, loading: costSettingsLoading, fetchCostSettings } = useCostSettings();
  const { saveCostSettings: saveCostSettingsApi, saving: savingCost } = useSaveCostSettings();
  const [costForm, setCostForm] = useState(DEFAULT_COST_FORM);
  const [costSaved, setCostSaved] = useState(false);

  // ---- Load Judge (LogIQ) state ----
  const [judgeForm, setJudgeForm] = useState({
    originAddress: '', originCity: '', originState: '', originZip: '',
    destAddress: '', destCity: '', destState: '', destZip: '',
    rate: ''
  });
  const [judgeResult, setJudgeResult] = useState(null);
  const [judging, setJudging] = useState(false);
  const [judgeError, setJudgeError] = useState(null);

  // ---- Fetch all data on mount ----
  useEffect(() => {
    fetchTimeline({ days: timelineDays });
    fetchStats();
    fetchPnl({});
    fetchCostSettings();
  }, []);

  // Refetch timeline when days filter changes
  useEffect(() => {
    fetchTimeline({ days: timelineDays });
  }, [timelineDays]);

  // Populate cost form from saved settings
  useEffect(() => {
    if (costSettings) {
      setCostForm(prev => ({
        ...prev,
        fuelPricePerGallon: costSettings.fuelPricePerGallon?.toString() || '',
        milesPerGallon: costSettings.milesPerGallon?.toString() || '',
        driverPayPerMile: costSettings.driverPayPerMile?.toString() || '',
        insuranceMonthly: costSettings.insuranceMonthly?.toString() || '',
        workersCompMonthly: costSettings.workersCompMonthly?.toString() || '',
        tractorPaymentMonthly: costSettings.tractorPaymentMonthly?.toString() || '',
        trailerPaymentMonthly: costSettings.trailerPaymentMonthly?.toString() || '',
        repairsMonthly: costSettings.repairsMonthly?.toString() || prev.repairsMonthly,
        accountingAnnual: costSettings.accountingAnnual?.toString() || '',
        irpAnnual: costSettings.irpAnnual?.toString() || prev.irpAnnual,
        subscriptionsAnnual: costSettings.subscriptionsAnnual?.toString() || '',
        otherMonthly: costSettings.otherMonthly?.toString() || '',
        milesPerMonth: costSettings.milesPerMonth?.toString() || prev.milesPerMonth
      }));
    }
  }, [costSettings]);

  // ---- Active timeline: real data only (no demo fallback) ----
  const activeTimeline = useMemo(() => {
    return timeline || [];
  }, [timeline]);

  // ---- Computed KPIs (from stats API, with timeline-derived fallback) ----
  const kpis = useMemo(() => {
    if (stats?.counts) {
      const c = stats.counts;
      return {
        activeLoads: (c.booked || 0) + (c.dispatched || 0) + (c.inTransit || 0),
        inTransit: c.inTransit || 0,
        delivered: c.delivered || 0,
        avgRpm: stats.revenue?.totalMiles > 0
          ? (stats.revenue.total / stats.revenue.totalMiles).toFixed(2)
          : '0.00'
      };
    }

    // Fallback: derive KPIs from activeTimeline data
    if (activeTimeline && activeTimeline.length > 0) {
      const counts = { booked: 0, dispatched: 0, inTransit: 0, delivered: 0 };
      let totalRevenue = 0;
      let totalMiles = 0;
      activeTimeline.forEach(load => {
        const s = load.status?.toLowerCase();
        if (s === 'booked') counts.booked++;
        else if (s === 'dispatched') counts.dispatched++;
        else if (s === 'in_transit') counts.inTransit++;
        else if (s === 'delivered') counts.delivered++;
        if (load.revenue) totalRevenue += parseFloat(load.revenue) || 0;
        if (load.miles) totalMiles += parseInt(load.miles) || 0;
      });
      return {
        activeLoads: counts.booked + counts.dispatched + counts.inTransit,
        inTransit: counts.inTransit,
        delivered: counts.delivered,
        avgRpm: totalMiles > 0 ? (totalRevenue / totalMiles).toFixed(2) : '0.00'
      };
    }

    return null;
  }, [stats, activeTimeline]);

  // ---- Org cost per mile (saved settings preferred, P&L fallback) ----
  const orgCostPerMile = useMemo(() => {
    if (costSettings?.calculatedCostPerMile > 0) {
      return costSettings.calculatedCostPerMile;
    }
    return pnlReport?.metrics?.costPerMile || 0;
  }, [costSettings, pnlReport]);

  // ---- Cost calculator: compute cost/mile live ----
  const costPerMile = useMemo(() => {
    const n = (v) => parseFloat(v) || 0;
    const fuelCostPerMile = n(costForm.fuelPricePerGallon) / (n(costForm.milesPerGallon) || 6);
    const driverPay = n(costForm.driverPayPerMile);
    const variableCost = fuelCostPerMile + driverPay;

    const milesPerMonth = n(costForm.milesPerMonth) || 10000;
    const monthlyFixed = n(costForm.insuranceMonthly)
      + n(costForm.workersCompMonthly)
      + n(costForm.tractorPaymentMonthly)
      + n(costForm.trailerPaymentMonthly)
      + n(costForm.repairsMonthly)
      + n(costForm.otherMonthly);
    const annualFixed = n(costForm.accountingAnnual)
      + n(costForm.irpAnnual)
      + n(costForm.subscriptionsAnnual);
    const fixedCost = (monthlyFixed + annualFixed / 12) / milesPerMonth;

    return Math.round((variableCost + fixedCost) * 100) / 100;
  }, [costForm]);

  // Update cost form field
  const updateCostForm = useCallback((field, value) => {
    setCostForm(prev => ({ ...prev, [field]: value }));
    setCostSaved(false);
  }, []);

  // Save cost settings
  const saveCost = useCallback(async () => {
    const n = (v) => parseFloat(v) || 0;
    const data = {
      fuelPricePerGallon: n(costForm.fuelPricePerGallon),
      milesPerGallon: n(costForm.milesPerGallon),
      driverPayPerMile: n(costForm.driverPayPerMile),
      insuranceMonthly: n(costForm.insuranceMonthly),
      workersCompMonthly: n(costForm.workersCompMonthly),
      tractorPaymentMonthly: n(costForm.tractorPaymentMonthly),
      trailerPaymentMonthly: n(costForm.trailerPaymentMonthly),
      repairsMonthly: n(costForm.repairsMonthly),
      accountingAnnual: n(costForm.accountingAnnual),
      irpAnnual: n(costForm.irpAnnual),
      subscriptionsAnnual: n(costForm.subscriptionsAnnual),
      otherMonthly: n(costForm.otherMonthly),
      milesPerMonth: n(costForm.milesPerMonth)
    };

    try {
      await saveCostSettingsApi(data);
      setCostSaved(true);
      fetchCostSettings();
    } catch {
      // error handled by mutation hook
    }
  }, [costForm, saveCostSettingsApi, fetchCostSettings]);

  // ---- Map data: derive locations from timeline route_cache ----
  const mapLocations = useMemo(() => {
    if (!activeTimeline || activeTimeline.length === 0) return [];

    return activeTimeline
      .filter(load => {
        const rc = load.route_cache;
        // Support both `route_cache.route` (map service format) and `route_cache.geometry` (legacy)
        const geo = rc?.route || rc?.geometry;
        return geo?.coordinates?.length > 0;
      })
      .map(load => {
        const rc = load.route_cache;
        const geo = rc.route || rc.geometry;
        const coords = geo.coordinates;
        return {
          id: load.id,
          reference_number: load.reference_number,
          status: load.status?.toUpperCase(),
          lane: load.lane,
          driver: load.driver,
          truck: load.truck,
          revenue: load.revenue,
          miles: load.miles,
          rpm: load.rpm,
          pickup_date: load.pickup_date,
          delivery_date: load.delivery_date,
          route: geo,
          pickup: coords[0]
            ? { lng: coords[0][0], lat: coords[0][1] }
            : null,
          delivery: coords.length > 1
            ? { lng: coords[coords.length - 1][0], lat: coords[coords.length - 1][1] }
            : null
        };
      });
  }, [activeTimeline]);

  // ---- Update judge form field ----
  const updateJudgeForm = useCallback((field, value) => {
    setJudgeForm(prev => ({ ...prev, [field]: value }));
    setJudgeResult(null);
    setJudgeError(null);
  }, []);

  // ---- LogIQ calculation (uses org cost/mile + $0.55 min profit) ----
  const judgeLoad = useCallback(async () => {
    const { originAddress, originCity, originState, originZip, destAddress, destCity, destState, destZip, rate } = judgeForm;

    if (!originCity || !originState || !destCity || !destState || !rate) {
      setJudgeError('Please fill in all fields (city, state, and rate are required)');
      return;
    }

    const rateNum = parseFloat(rate);
    if (isNaN(rateNum) || rateNum <= 0) {
      setJudgeError('Please enter a valid rate');
      return;
    }

    setJudging(true);
    setJudgeError(null);

    try {
      const routeResult = await mapApi.calculateMiles(
        { address: originAddress || undefined, city: originCity, state: originState, zip: originZip || undefined },
        { address: destAddress || undefined, city: destCity, state: destState, zip: destZip || undefined }
      );

      const routeData = routeResult?.data || routeResult;

      if (!routeData?.success || !routeData?.distanceMiles) {
        setJudgeError(routeData?.error || 'Could not calculate route. Check the addresses.');
        setJudging(false);
        return;
      }

      const miles = routeData.distanceMiles;
      const durationHours = routeData.durationHours;
      const rpm = rateNum / miles;
      const costMile = orgCostPerMile;
      const hasCostData = costMile > 0;
      const netPerMile = rpm - costMile;
      const meetsMinProfit = netPerMile >= MIN_PROFIT_PER_MILE;
      const isGood = hasCostData ? meetsMinProfit : true;
      const totalProfit = netPerMile * miles;
      const minimumRate = Math.ceil((costMile + MIN_PROFIT_PER_MILE) * miles);
      const targetMarginPercent = 15;
      const suggestedRate = Math.ceil((costMile * miles) / (1 - targetMarginPercent / 100));
      const costSource = costSettings?.calculatedCostPerMile > 0 ? 'settings' : 'pnl';

      setJudgeResult({
        miles: Math.round(miles),
        durationHours: Math.round(durationHours * 10) / 10,
        rate: rateNum,
        rpm: Math.round(rpm * 100) / 100,
        costPerMile: costMile,
        netPerMile: Math.round(netPerMile * 100) / 100,
        totalProfit: Math.round(totalProfit),
        isGood,
        hasCostData,
        meetsMinProfit,
        minimumRate,
        suggestedRate,
        targetMarginPercent,
        minProfitPerMile: MIN_PROFIT_PER_MILE,
        costSource,
        routeGeometry: routeData.route || null,
        locations: routeData.locations || []
      });
    } catch (err) {
      setJudgeError(err.response?.data?.error?.message || err.message || 'Failed to calculate route');
    } finally {
      setJudging(false);
    }
  }, [judgeForm, orgCostPerMile, costSettings]);

  // Reset judge
  const resetJudge = useCallback(() => {
    setJudgeForm({
      originAddress: '', originCity: '', originState: '', originZip: '',
      destAddress: '', destCity: '', destState: '', destZip: '',
      rate: ''
    });
    setJudgeResult(null);
    setJudgeError(null);
  }, []);

  // Create load from LogIQ results — navigates to load wizard with pre-filled data
  // ---- Create Load modal (from LogIQ) ----
  const [showCreateLoadModal, setShowCreateLoadModal] = useState(false);
  const [createLoadPrefill, setCreateLoadPrefill] = useState(null);

  const createLoadFromJudge = useCallback(() => {
    setCreateLoadPrefill({
      shipper_name: judgeForm.originCity ? `${judgeForm.originCity}, ${judgeForm.originState}` : '',
      shipper_address: judgeForm.originAddress || '',
      shipper_city: judgeForm.originCity || '',
      shipper_state: judgeForm.originState || '',
      shipper_zip: judgeForm.originZip || '',
      consignee_name: judgeForm.destCity ? `${judgeForm.destCity}, ${judgeForm.destState}` : '',
      consignee_address: judgeForm.destAddress || '',
      consignee_city: judgeForm.destCity || '',
      consignee_state: judgeForm.destState || '',
      consignee_zip: judgeForm.destZip || '',
      revenue: judgeForm.rate || '',
      miles: judgeResult?.miles?.toString() || '',
    });
    setShowCreateLoadModal(true);
  }, [judgeForm, judgeResult]);

  const closeCreateLoadModal = useCallback(() => {
    setShowCreateLoadModal(false);
    setCreateLoadPrefill(null);
  }, []);

  // Refetch all
  const refetch = useCallback(() => {
    fetchTimeline({ days: timelineDays });
    fetchStats();
    fetchCostSettings();
  }, [timelineDays]);

  return {
    // Tabs
    activeTab,
    setActiveTab,

    // Timeline
    timeline: activeTimeline,
    timelineLoading,
    timelineDays,
    setTimelineDays,

    // KPIs
    kpis,
    kpisLoading: statsLoading,

    // Map
    mapLocations,

    // Cost Calculator
    costForm,
    updateCostForm,
    costPerMile,
    savingCost,
    saveCost,
    costSaved,
    costSettings,
    costSettingsLoading,

    // LogIQ
    judgeForm,
    updateJudgeForm,
    judgeResult,
    judgeLoad,
    judging,
    judgeError,
    resetJudge,
    createLoadFromJudge,
    showCreateLoadModal,
    createLoadPrefill,
    closeCreateLoadModal,
    orgCostPerMile,

    // Overall
    loading: timelineLoading || statsLoading,
    error: timelineError,

    // Actions
    refetch
  };
}

export default useDispatchCommandCenter;
