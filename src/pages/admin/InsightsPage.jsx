import { useEffect, useMemo, useState } from 'react';
import {
  Users, Truck, Building2, TrendingUp, Loader2, Calendar
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import superAdminApi from '../../api/superAdmin.api';

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '12m', days: 365 }
];

function formatYmd(ymd) {
  const d = new Date(ymd + 'T00:00:00Z');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Kpi({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-small text-text-tertiary uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-text-tertiary" />
      </div>
      <div className="text-2xl font-semibold text-text-primary">
        {value?.toLocaleString?.() ?? value ?? '—'}
      </div>
      {sub != null && (
        <div className="text-small text-text-secondary mt-1">{sub}</div>
      )}
    </div>
  );
}

export default function InsightsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dash, setDash] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    superAdminApi.getStatsDashboard(days)
      .then((d) => { if (alive) setDash(d); })
      .catch((e) => { if (alive) setError(e?.response?.data?.message || e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [days]);

  const userSeries = useMemo(
    () => (dash?.userGrowth || []).map((r) => ({
      date: formatYmd(r.date),
      drivers: r.drivers,
      carriers: r.carriers
    })),
    [dash]
  );

  const orgSeries = useMemo(
    () => (dash?.orgGrowth || []).map((r) => ({
      date: formatYmd(r.date),
      orgs: r.count
    })),
    [dash]
  );

  const summary = dash?.summary || {};
  const driverShare = summary.totalUsers
    ? Math.round((summary.totalDrivers / summary.totalUsers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-title-lg text-text-primary">Insights</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Platform growth across users and organizations.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-surface-secondary rounded-button border border-surface-tertiary">
          <Calendar className="w-4 h-4 ml-2 text-text-tertiary" />
          {RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setDays(r.days)}
              className={[
                'px-3 py-1 rounded-button text-body-sm transition-colors',
                days === r.days
                  ? 'bg-surface-primary text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              ].join(' ')}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-card px-4 py-3 text-body-sm">
          {error}
        </div>
      )}

      {loading && !dash ? (
        <div className="flex items-center gap-2 text-text-secondary py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading insights…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              icon={Users}
              label="Total users"
              value={summary.totalUsers}
              sub={`+${summary.newUsers30?.toLocaleString?.() || 0} in 30d`}
            />
            <Kpi
              icon={Truck}
              label="Drivers"
              value={summary.totalDrivers}
              sub={`${driverShare}% of users`}
            />
            <Kpi
              icon={Building2}
              label="Organizations"
              value={summary.totalOrgs}
              sub={`${summary.activeOrgs?.toLocaleString?.() || 0} active`}
            />
            <Kpi
              icon={TrendingUp}
              label="New users · 7d"
              value={summary.newUsers7}
              sub={`${summary.newUsers30?.toLocaleString?.() || 0} in 30d`}
            />
          </div>

          <div className="bg-surface-primary border border-surface-tertiary rounded-card p-5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="text-body font-semibold text-text-primary">User signups</h2>
                <p className="text-small text-text-tertiary mt-0.5">
                  Daily new users, split by driver vs carrier
                </p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userSeries} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradDrivers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradCarriers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
                  <Area
                    type="monotone" dataKey="drivers" stroke="#3b82f6" strokeWidth={2}
                    fill="url(#gradDrivers)" stackId="1" name="Drivers"
                  />
                  <Area
                    type="monotone" dataKey="carriers" stroke="#10b981" strokeWidth={2}
                    fill="url(#gradCarriers)" stackId="1" name="Carriers / others"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-primary border border-surface-tertiary rounded-card p-5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="text-body font-semibold text-text-primary">Organization signups</h2>
                <p className="text-small text-text-tertiary mt-0.5">
                  New orgs per day · {summary.newOrgs30?.toLocaleString?.() || 0} in last 30 days
                </p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgSeries} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="orgs" fill="#6366f1" radius={[4, 4, 0, 0]} name="Orgs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
