import { useState } from 'react';
import { X, Sparkles, PenLine } from 'lucide-react';
import { LoadWizard } from './LoadWizard';

/**
 * LoadFormModal - Modal wrapper for creating new loads
 * Shows mode selection (AI/Manual) first, then the wizard
 */
export function LoadFormModal({ isOpen, onClose, onSuccess, prefill = null }) {
  const [mode, setMode] = useState(null); // null = selection, 'ai' = AI mode, 'manual' = manual mode

  // Skip mode selection when prefill is provided (from LogIQ)
  const effectiveMode = prefill && mode === null ? 'manual' : mode;

  if (!isOpen) return null;

  const handleClose = () => {
    setMode(null);
    onClose();
  };

  const handleSuccess = (load) => {
    setMode(null);
    onSuccess?.(load);
    onClose();
  };

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
  };

  const handleBack = () => {
    setMode(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />

      {/* Modal — full-screen sheet on mobile, centered card on desktop */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {effectiveMode === null ? 'New Load' : effectiveMode === 'ai' ? 'AI Import' : 'Create Load'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-6 bg-white">
          {effectiveMode === null ? (
            // Mode Selection
            <div className="space-y-4">
              <p className="text-gray-600 text-center mb-6">
                How would you like to create this load?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* AI Mode */}
                <button
                  onClick={() => handleSelectMode('ai')}
                  className="group p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 bg-gray-50 hover:bg-blue-50:bg-blue-900/20 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200:bg-blue-900/50 transition-colors">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI Import</h3>
                  <p className="text-sm text-gray-500">
                    Upload a rate confirmation and let AI extract all the details
                  </p>
                </button>

                {/* Manual Mode */}
                <button
                  onClick={() => handleSelectMode('manual')}
                  className="group p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 bg-gray-50 hover:bg-blue-50:bg-blue-900/20 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-4 group-hover:bg-blue-100:bg-blue-900/30 transition-colors">
                    <PenLine className="w-6 h-6 text-gray-600 group-hover:text-blue-600:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Manual Entry</h3>
                  <p className="text-sm text-gray-500">
                    Enter load details step by step
                  </p>
                </button>
              </div>
            </div>
          ) : (
            // Wizard
            <LoadWizard
              isModal={true}
              onClose={prefill ? handleClose : handleBack}
              onSuccess={handleSuccess}
              initialMode={effectiveMode}
              prefill={prefill}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default LoadFormModal;
