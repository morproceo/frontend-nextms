/**
 * FileUpload Component
 * Reusable drag-and-drop file upload with progress indicator
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from './Button';

const FILE_ICONS = {
  'image/jpeg': Image,
  'image/png': Image,
  'image/webp': Image,
  'image/gif': Image,
  'application/pdf': FileText,
  default: File
};

export function FileUpload({
  accept = 'image/*,application/pdf',
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUpload,
  onError,
  disabled = false,
  className = '',
  label = 'Upload a file',
  hint = 'PDF, PNG, JPG up to 10MB'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = useCallback((file) => {
    if (!file) return 'No file selected';

    if (file.size > maxSize) {
      return `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`;
    }

    // Check accept pattern
    const acceptTypes = accept.split(',').map(t => t.trim());
    const isAccepted = acceptTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.replace('/*', '');
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return 'File type not allowed';
    }

    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback(async (selectedFile) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setStatus('error');
      onError?.(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setStatus('uploading');
    setProgress(0);

    try {
      await onUpload(selectedFile, (percent) => {
        setProgress(percent);
      });
      setStatus('success');
      setProgress(100);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setStatus('error');
      onError?.(err.message);
    }
  }, [validateFile, onUpload, onError]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [disabled, handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFile]);

  const handleReset = useCallback(() => {
    setFile(null);
    setProgress(0);
    setStatus('idle');
    setError(null);
  }, []);

  const FileIcon = file ? (FILE_ICONS[file.type] || FILE_ICONS.default) : Upload;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {status === 'idle' && (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging
              ? 'border-accent bg-accent/5'
              : 'border-surface-tertiary hover:border-accent/50 hover:bg-surface-secondary/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <Upload className="w-8 h-8 mx-auto mb-3 text-text-tertiary" />
          <p className="text-body-sm font-medium text-text-primary">{label}</p>
          <p className="text-small text-text-tertiary mt-1">{hint}</p>
        </div>
      )}

      {(status === 'uploading' || status === 'success') && file && (
        <div className="border border-surface-tertiary rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${status === 'success' ? 'bg-success/10' : 'bg-surface-secondary'}
            `}>
              {status === 'success' ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <FileIcon className="w-5 h-5 text-text-secondary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-text-primary truncate">
                {file.name}
              </p>
              <p className="text-small text-text-tertiary">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>

            {status === 'success' && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {status === 'uploading' && (
            <div className="mt-3">
              <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-small text-text-tertiary mt-1">{progress}% uploaded</p>
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="border border-error/20 bg-error/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-error">Upload failed</p>
              <p className="text-small text-text-secondary">{error}</p>
            </div>

            <Button variant="ghost" size="sm" onClick={handleReset}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
