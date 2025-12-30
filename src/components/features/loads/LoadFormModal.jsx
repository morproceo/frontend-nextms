import { useState } from 'react';
import { X, Sparkles, PenLine } from 'lucide-react';
import { LoadWizard } from './LoadWizard';

/**
 * LoadFormModal - Modal wrapper for creating new loads
 * Shows mode selection (AI/Manual) first, then the wizard
 */
export function LoadFormModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState(null); // null = selection, 'ai' = AI mode, 'manual' = manual mode

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === null ? 'New Load' : mode === 'ai' ? 'AI Import' : 'Create Load'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white dark:bg-gray-900">
          {mode === null ? (
            // Mode Selection
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                How would you like to create this load?
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* AI Mode */}
                <button
                  onClick={() => handleSelectMode('ai')}
                  className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI Import</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload a rate confirmation and let AI extract all the details
                  </p>
                </button>

                {/* Manual Mode */}
                <button
                  onClick={() => handleSelectMode('manual')}
                  className="group p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    <PenLine className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Manual Entry</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Enter load details step by step
                  </p>
                </button>
              </div>
            </div>
          ) : (
            // Wizard
            <LoadWizard
              isModal={true}
              onClose={handleBack}
              onSuccess={handleSuccess}
              initialMode={mode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default LoadFormModal;
