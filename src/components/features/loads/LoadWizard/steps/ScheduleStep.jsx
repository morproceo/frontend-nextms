import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Package, Scale, Layers } from 'lucide-react';

export function ScheduleStep({ formData, updateFormData, onComplete, isValid }) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const prevValidRef = useRef(isValid);

  // Auto-advance only after user interaction and step becomes valid
  useEffect(() => {
    if (hasInteracted && isValid && !prevValidRef.current) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
    prevValidRef.current = isValid;
  }, [hasInteracted, isValid, onComplete]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHasInteracted(true);
    updateFormData({ [name]: value });
  };

  return (
    <div className="space-y-8">
      {/* Schedule Section */}
      <div className="space-y-6">
        <h3 className="text-body font-medium text-text-primary flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          Schedule
        </h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Pickup */}
          <div className="space-y-4">
            <p className="text-small font-medium text-success uppercase tracking-wide">
              Pickup
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-small text-text-secondary mb-1">Date</label>
                <input
                  type="date"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleChange}
                  className="
                    w-full px-4 py-3 bg-surface-secondary border-0 rounded-lg
                    text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20
                  "
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-small text-text-tertiary mb-1">From</label>
                  <input
                    type="time"
                    name="pickup_time_start"
                    value={formData.pickup_time_start}
                    onChange={handleChange}
                    className="
                      w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm
                      text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20
                    "
                  />
                </div>
                <div>
                  <label className="block text-small text-text-tertiary mb-1">To</label>
                  <input
                    type="time"
                    name="pickup_time_end"
                    value={formData.pickup_time_end}
                    onChange={handleChange}
                    className="
                      w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm
                      text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20
                    "
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-4">
            <p className="text-small font-medium text-error uppercase tracking-wide">
              Delivery
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-small text-text-secondary mb-1">Date</label>
                <input
                  type="date"
                  name="delivery_date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  className="
                    w-full px-4 py-3 bg-surface-secondary border-0 rounded-lg
                    text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20
                  "
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-small text-text-tertiary mb-1">From</label>
                  <input
                    type="time"
                    name="delivery_time_start"
                    value={formData.delivery_time_start}
                    onChange={handleChange}
                    className="
                      w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm
                      text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20
                    "
                  />
                </div>
                <div>
                  <label className="block text-small text-text-tertiary mb-1">To</label>
                  <input
                    type="time"
                    name="delivery_time_end"
                    value={formData.delivery_time_end}
                    onChange={handleChange}
                    className="
                      w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm
                      text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-surface-tertiary" />

      {/* Cargo Section */}
      <div className="space-y-6">
        <h3 className="text-body font-medium text-text-primary flex items-center gap-2">
          <Package className="w-4 h-4 text-accent" />
          Cargo Details
          <span className="text-small text-text-tertiary font-normal">(Optional)</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-small text-text-secondary mb-1">Commodity</label>
            <input
              type="text"
              name="commodity"
              value={formData.commodity}
              onChange={handleChange}
              placeholder="e.g., General Freight, Produce, Electronics"
              className="
                w-full px-4 py-3 bg-surface-secondary border-0 rounded-lg
                text-text-primary placeholder:text-text-tertiary
                focus:outline-none focus:ring-2 focus:ring-accent/20
              "
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-small text-text-secondary mb-1">
                <Scale className="w-3 h-3" />
                Weight (lbs)
              </label>
              <input
                type="number"
                name="weight_lbs"
                value={formData.weight_lbs}
                onChange={handleChange}
                placeholder="40,000"
                className="
                  w-full px-4 py-3 bg-surface-secondary border-0 rounded-lg
                  text-text-primary placeholder:text-text-tertiary
                  focus:outline-none focus:ring-2 focus:ring-accent/20
                "
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-small text-text-secondary mb-1">
                <Layers className="w-3 h-3" />
                Pieces
              </label>
              <input
                type="number"
                name="pieces"
                value={formData.pieces}
                onChange={handleChange}
                placeholder="24"
                className="
                  w-full px-4 py-3 bg-surface-secondary border-0 rounded-lg
                  text-text-primary placeholder:text-text-tertiary
                  focus:outline-none focus:ring-2 focus:ring-accent/20
                "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleStep;
