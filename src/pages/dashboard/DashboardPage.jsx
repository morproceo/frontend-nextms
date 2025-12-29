import { useOrg } from '../../contexts/OrgContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  Package,
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export function DashboardPage() {
  const { currentOrg } = useOrg();

  // Placeholder stats - would come from API
  const stats = [
    {
      name: 'Active Loads',
      value: '24',
      change: '+12%',
      changeType: 'positive',
      icon: Package
    },
    {
      name: 'Available Trucks',
      value: '8',
      change: '-2',
      changeType: 'negative',
      icon: Truck
    },
    {
      name: 'Active Drivers',
      value: '12',
      change: '+3',
      changeType: 'positive',
      icon: Users
    },
    {
      name: 'Revenue (MTD)',
      value: '$48,250',
      change: '+18%',
      changeType: 'positive',
      icon: DollarSign
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-title text-text-primary">Dashboard</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Welcome back to {currentOrg?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} padding="default">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-text-secondary">{stat.name}</p>
                <p className="text-headline text-text-primary mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-error" />
                  )}
                  <span
                    className={`text-small font-medium ${
                      stat.changeType === 'positive' ? 'text-success' : 'text-error'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-small text-text-tertiary">vs last month</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-accent" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Loads */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Loads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-surface-tertiary last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-text-primary">
                        Load #LD-100{i}
                      </p>
                      <p className="text-small text-text-tertiary">
                        Chicago, IL → Miami, FL
                      </p>
                    </div>
                  </div>
                  <Badge variant={i === 1 ? 'blue' : i === 2 ? 'green' : 'yellow'}>
                    {i === 1 ? 'In Transit' : i === 2 ? 'Delivered' : 'Dispatched'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left">
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-accent" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Create New Load
              </span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left">
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-success" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Add Driver
              </span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left">
              <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-warning" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Add Truck
              </span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
