/**
 * CostCalculator - Cost-Per-Mile Calculator
 *
 * Inspired by motorcarrierhq.com. Lets orgs input operating costs
 * to calculate true cost/mile, then save to org settings.
 *
 * Sections:
 * - Variable costs (fuel, driver pay)
 * - Fixed monthly costs (insurance, payments, repairs)
 * - Fixed annual costs (accounting, IRP, subscriptions)
 * - Summary (total cost/mile, recommended min rate)
 */

import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import {
  Fuel,
  User,
  Shield,
  Truck,
  Wrench,
  Calculator,
  Save,
  CheckCircle,
  DollarSign,
  TrendingUp,
  FileText,
  CreditCard,
  Box
} from 'lucide-react';

function CostInput({ label, icon: Icon, value, onChange, placeholder, suffix, prefix = '$' }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-text-tertiary" />}
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-body-sm">
            {prefix}
          </span>
        )}
        <input
          type="number"
          step="any"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-14' : 'pr-3'} py-2 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-text-tertiary">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-3">
      <h3 className="text-body-sm font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="text-[11px] text-text-tertiary mt-0.5">{description}</p>
      )}
    </div>
  );
}

export function CostCalculator({
  costForm,
  onUpdateForm,
  costPerMile,
  saving,
  onSave,
  saved,
  costSettings
}) {
  const n = (v) => parseFloat(v) || 0;

  // Compute breakdown for display
  const fuelCostPerMile = n(costForm.fuelPricePerGallon) / (n(costForm.milesPerGallon) || 6);
  const variableCostPerMile = fuelCostPerMile + n(costForm.driverPayPerMile);

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
  const fixedCostPerMile = (monthlyFixed + annualFixed / 12) / milesPerMonth;

  const minProfitPerMile = 0.55;
  const recommendedMinRate = costPerMile + minProfitPerMile;

  const lastSaved = costSettings?.updatedAt
    ? new Date(costSettings.updatedAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Variable Costs */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <SectionHeader
            title="Variable Costs"
            description="Costs that change with every mile driven"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CostInput
              label="Diesel Price"
              icon={Fuel}
              value={costForm.fuelPricePerGallon}
              onChange={(v) => onUpdateForm('fuelPricePerGallon', v)}
              placeholder="4.50"
              suffix="/gallon"
            />
            <CostInput
              label="Miles Per Gallon"
              icon={Truck}
              value={costForm.milesPerGallon}
              onChange={(v) => onUpdateForm('milesPerGallon', v)}
              placeholder="6"
              prefix=""
              suffix="MPG"
            />
            <div className="sm:col-span-2">
              <CostInput
                label="Driver Pay"
                icon={User}
                value={costForm.driverPayPerMile}
                onChange={(v) => onUpdateForm('driverPayPerMile', v)}
                placeholder="0.65"
                suffix="/mile"
              />
            </div>
          </div>
          {n(costForm.fuelPricePerGallon) > 0 && (
            <div className="mt-3 p-2.5 bg-accent/5 rounded-lg">
              <p className="text-[11px] text-text-tertiary">
                Fuel cost: <span className="font-semibold text-text-secondary">${fuelCostPerMile.toFixed(3)}/mile</span>
                {n(costForm.driverPayPerMile) > 0 && (
                  <> + Driver: <span className="font-semibold text-text-secondary">${n(costForm.driverPayPerMile).toFixed(3)}/mile</span></>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fixed Monthly Costs */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <SectionHeader
            title="Fixed Monthly Costs"
            description="Monthly expenses divided by miles driven per month"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CostInput
              label="Insurance Premium"
              icon={Shield}
              value={costForm.insuranceMonthly}
              onChange={(v) => onUpdateForm('insuranceMonthly', v)}
              placeholder="2,000"
              suffix="/month"
            />
            <CostInput
              label="Workers Comp"
              icon={Shield}
              value={costForm.workersCompMonthly}
              onChange={(v) => onUpdateForm('workersCompMonthly', v)}
              placeholder="500"
              suffix="/month"
            />
            <CostInput
              label="Tractor Payment"
              icon={Truck}
              value={costForm.tractorPaymentMonthly}
              onChange={(v) => onUpdateForm('tractorPaymentMonthly', v)}
              placeholder="2,500"
              suffix="/month"
            />
            <CostInput
              label="Trailer Payment"
              icon={Box}
              value={costForm.trailerPaymentMonthly}
              onChange={(v) => onUpdateForm('trailerPaymentMonthly', v)}
              placeholder="800"
              suffix="/month"
            />
            <CostInput
              label="Repairs & Maintenance"
              icon={Wrench}
              value={costForm.repairsMonthly}
              onChange={(v) => onUpdateForm('repairsMonthly', v)}
              placeholder="1,250"
              suffix="/month"
            />
            <CostInput
              label="Other Monthly"
              icon={CreditCard}
              value={costForm.otherMonthly}
              onChange={(v) => onUpdateForm('otherMonthly', v)}
              placeholder="0"
              suffix="/month"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fixed Annual Costs */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <SectionHeader
            title="Fixed Annual Costs"
            description="Yearly expenses divided by 12 months, then by monthly miles"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CostInput
              label="Accounting / Tax Prep"
              icon={FileText}
              value={costForm.accountingAnnual}
              onChange={(v) => onUpdateForm('accountingAnnual', v)}
              placeholder="3,000"
              suffix="/year"
            />
            <CostInput
              label="IRP / Registration"
              icon={FileText}
              value={costForm.irpAnnual}
              onChange={(v) => onUpdateForm('irpAnnual', v)}
              placeholder="2,000"
              suffix="/year"
            />
            <div className="sm:col-span-2">
              <CostInput
                label="Subscriptions / Software"
                icon={CreditCard}
                value={costForm.subscriptionsAnnual}
                onChange={(v) => onUpdateForm('subscriptionsAnnual', v)}
                placeholder="1,200"
                suffix="/year"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Miles Per Month */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <SectionHeader
            title="Monthly Mileage"
            description="Used to divide fixed costs into a per-mile amount"
          />
          <CostInput
            label="Miles Per Month"
            icon={TrendingUp}
            value={costForm.milesPerMonth}
            onChange={(v) => onUpdateForm('milesPerMonth', v)}
            placeholder="10,000"
            prefix=""
            suffix="miles"
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-accent/30">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-body-sm font-semibold text-text-primary">Cost Breakdown</h3>
              <p className="text-[11px] text-text-tertiary">Live calculation as you type</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5">
              <span className="text-body-sm text-text-secondary">Variable costs</span>
              <span className="text-body-sm font-medium text-text-primary">${variableCostPerMile.toFixed(3)}/mi</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-body-sm text-text-secondary">Fixed costs</span>
              <span className="text-body-sm font-medium text-text-primary">${fixedCostPerMile.toFixed(3)}/mi</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-body font-semibold text-text-primary">Total Cost Per Mile</span>
                <span className="text-headline font-bold text-accent">${costPerMile.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Min profit target */}
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-body-sm font-medium text-green-400">Recommended Min Rate</p>
                <p className="text-[11px] text-text-tertiary">
                  Cost/mile + $0.55 min profit target
                </p>
              </div>
              <span className="text-title-sm font-bold text-green-400">
                ${recommendedMinRate.toFixed(2)}/mi
              </span>
            </div>
          </div>

          {/* Save button */}
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={onSave}
              loading={saving}
              disabled={saving || costPerMile <= 0}
              className="flex-1"
            >
              {saved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Cost Per Mile
                </>
              )}
            </Button>
          </div>

          {lastSaved && (
            <p className="text-[11px] text-text-tertiary text-center mt-2 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Last saved: {lastSaved}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CostCalculator;
