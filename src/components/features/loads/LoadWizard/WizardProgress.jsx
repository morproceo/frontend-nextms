import { Check } from 'lucide-react';

export function WizardProgress({ steps, currentStep, onStepClick, isStepComplete }) {
  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-surface-tertiary" />
      <div
        className="absolute top-4 left-0 h-0.5 bg-accent transition-all duration-500"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      />

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isComplete = isStepComplete(index);
          const isCurrent = index === currentStep;
          const isPast = index < currentStep;
          const canClick = isPast || (isComplete && index <= currentStep + 1);

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => canClick && onStepClick(index)}
              disabled={!canClick}
              className={`
                flex flex-col items-center group
                ${canClick ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              {/* Circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  transition-all duration-300 relative z-10
                  ${
                    isComplete && !isCurrent
                      ? 'bg-success text-white'
                      : isCurrent
                      ? 'bg-accent text-white ring-4 ring-accent/20'
                      : 'bg-surface-secondary text-text-tertiary border-2 border-surface-tertiary'
                  }
                `}
              >
                {isComplete && !isCurrent ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-body-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-2 text-small font-medium transition-colors
                  ${
                    isCurrent
                      ? 'text-text-primary'
                      : isPast
                      ? 'text-text-secondary'
                      : 'text-text-tertiary'
                  }
                  ${canClick ? 'group-hover:text-text-primary' : ''}
                `}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WizardProgress;
