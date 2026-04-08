/**
 * FuelCardAssignmentTimeline - Vertical timeline of fuel card assignments
 *
 * Shows assignment history newest first with driver, truck, date range,
 * active badge, and notes.
 */

import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { User, Truck, Clock } from 'lucide-react';

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export function FuelCardAssignmentTimeline({ assignments, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 mx-auto mb-2 text-text-tertiary opacity-50" />
        <p className="text-body-sm text-text-tertiary">No assignment history yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-surface-tertiary" />

      <div className="space-y-4">
        {assignments.map((assignment, index) => {
          const isActive = !assignment.returned_at;
          const driverName = assignment.driver
            ? `${assignment.driver.first_name || ''} ${assignment.driver.last_name || ''}`.trim()
            : 'Unknown Driver';
          const truckUnit = assignment.truck?.unit_number;
          const startDate = formatDate(assignment.assigned_at);
          const endDate = formatDate(assignment.returned_at);

          return (
            <div key={assignment.id || index} className="relative pl-10">
              {/* Timeline dot */}
              <div
                className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 ${
                  isActive
                    ? 'bg-success border-success'
                    : 'bg-surface-primary border-surface-tertiary'
                }`}
              />

              <div className={`p-3 rounded-lg ${isActive ? 'bg-success/5 border border-success/20' : 'bg-surface-secondary'}`}>
                {/* Driver + Truck */}
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                  <span className="text-body-sm font-medium text-text-primary">{driverName}</span>
                  {truckUnit && (
                    <>
                      <Truck className="w-3.5 h-3.5 text-text-tertiary shrink-0 ml-1" />
                      <span className="text-body-sm text-text-secondary">#{truckUnit}</span>
                    </>
                  )}
                </div>

                {/* Date range */}
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-small text-text-secondary">
                    {startDate}
                    {' \u2014 '}
                    {isActive ? (
                      <Badge variant="green" size="sm">Active</Badge>
                    ) : (
                      endDate
                    )}
                  </p>
                </div>

                {/* Assigned by / Returned by */}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  {assignment.assigned_by_user && (
                    <p className="text-[11px] text-text-tertiary">
                      Assigned by {assignment.assigned_by_user.first_name || assignment.assigned_by_user.email || 'Unknown'}
                    </p>
                  )}
                  {assignment.returned_by_user && (
                    <p className="text-[11px] text-text-tertiary">
                      Returned by {assignment.returned_by_user.first_name || assignment.returned_by_user.email || 'Unknown'}
                    </p>
                  )}
                </div>

                {/* Notes */}
                {assignment.notes && (
                  <p className="text-small text-text-tertiary mt-1 italic">
                    {assignment.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FuelCardAssignmentTimeline;
