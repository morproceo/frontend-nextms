/**
 * Uploads API
 * Handles file uploads via backend proxy to S3
 */

import api, { TokenManager } from './client';
import { getOrgSlug } from '../lib/utils';

/**
 * Upload file via backend proxy (bypasses S3 CORS issues)
 * Uses XHR for progress tracking
 */
const proxyUpload = (url, file, extraFields = {}, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    // Append extra form fields
    Object.entries(extraFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({ success: true });
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', url);

    // Copy auth header
    const token = TokenManager.getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Copy org slug header
    const orgSlug = getOrgSlug();
    if (orgSlug) {
      xhr.setRequestHeader('X-Organization-Slug', orgSlug);
    }

    xhr.send(formData);
  });
};

/**
 * Confirm upload and create document record
 */
export const confirmUpload = async (key, options = {}) => {
  const response = await api.post('/v1/uploads/confirm', {
    key,
    loadId: options.loadId,
    type: options.type,
    fileName: options.fileName,
    mimeType: options.mimeType,
    fileSize: options.fileSize,
    notes: options.notes
  });
  return response.data;
};

/**
 * Full upload flow: proxy upload to backend → confirm
 */
export const uploadDocument = async (file, options = {}, onProgress) => {
  const { context = 'load_document', loadId, docType, notes } = options;
  const baseUrl = api.defaults.baseURL || '';

  // Step 1: Upload file via backend proxy
  const uploadResult = await proxyUpload(
    `${baseUrl}/v1/uploads/upload`,
    file,
    { context, loadId, docType },
    onProgress
  );

  const key = uploadResult.data?.key || uploadResult.key;

  // Step 2: Confirm upload and create document record
  const { data: confirmData } = await confirmUpload(key, {
    loadId,
    type: docType,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
    notes
  });

  return confirmData;
};

/**
 * Get document with signed view URL
 */
export const getDocumentUrl = async (documentId) => {
  const response = await api.get(`/v1/uploads/document/${documentId}/url`);
  return response.data;
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/v1/uploads/document/${documentId}`);
  return response.data;
};

/**
 * Get all documents for a load
 */
export const getLoadDocuments = async (loadId) => {
  const response = await api.get(`/v1/uploads/load/${loadId}/documents`);
  return response.data;
};

/**
 * Upload avatar via backend proxy
 */
export const uploadAvatar = async (file, onProgress) => {
  const baseUrl = api.defaults.baseURL || '';
  const result = await proxyUpload(
    `${baseUrl}/v1/uploads/upload/avatar`,
    file,
    {},
    onProgress
  );

  return {
    key: result.data?.key || result.key,
    url: result.data?.url || result.url
  };
};

/**
 * Upload organization logo via backend proxy
 */
export const uploadLogo = async (file, onProgress) => {
  const baseUrl = api.defaults.baseURL || '';
  const result = await proxyUpload(
    `${baseUrl}/v1/uploads/upload/logo`,
    file,
    {},
    onProgress
  );

  return {
    key: result.data?.key || result.key,
    url: result.data?.url || result.url
  };
};

// ============================================
// DRIVER DOCUMENTS (Compliance)
// ============================================

/**
 * Get all documents for a driver
 */
export const getDriverDocuments = async (driverId) => {
  const response = await api.get(`/v1/drivers/${driverId}/documents`);
  return response.data;
};

/**
 * Upload a compliance document for a driver
 */
export const uploadDriverDocument = async (driverId, file, options = {}, onProgress) => {
  const { type = 'OTHER', expiryDate, notes } = options;
  const baseUrl = api.defaults.baseURL || '';

  const extraFields = { type };
  if (expiryDate) extraFields.expiryDate = expiryDate;
  if (notes) extraFields.notes = notes;

  const result = await proxyUpload(
    `${baseUrl}/v1/drivers/${driverId}/documents`,
    file,
    extraFields,
    onProgress
  );

  return result.data || result;
};

/**
 * Delete a driver compliance document
 */
export const deleteDriverDocument = async (driverId, documentId) => {
  const response = await api.delete(`/v1/drivers/${driverId}/documents/${documentId}`);
  return response.data;
};

// ============================================
// EQUIPMENT DOCUMENTS (Truck/Trailer Compliance)
// ============================================

/**
 * Get all documents for a truck or trailer
 * @param {'truck'|'trailer'} entityType
 * @param {string} entityId
 */
export const getEquipmentDocuments = async (entityType, entityId) => {
  const response = await api.get(`/v1/${entityType}s/${entityId}/documents`);
  return response.data;
};

/**
 * Upload a compliance document for a truck or trailer
 * @param {'truck'|'trailer'} entityType
 * @param {string} entityId
 * @param {File} file
 * @param {object} options - { type, expiryDate, notes }
 * @param {function} onProgress
 */
export const uploadEquipmentDocument = async (entityType, entityId, file, options = {}, onProgress) => {
  const { type = 'OTHER', expiryDate, notes } = options;
  const baseUrl = api.defaults.baseURL || '';

  const extraFields = { type };
  if (expiryDate) extraFields.expiryDate = expiryDate;
  if (notes) extraFields.notes = notes;

  const result = await proxyUpload(
    `${baseUrl}/v1/${entityType}s/${entityId}/documents`,
    file,
    extraFields,
    onProgress
  );

  return result.data || result;
};

/**
 * Delete an equipment compliance document
 * @param {'truck'|'trailer'} entityType
 * @param {string} entityId
 * @param {string} documentId
 */
export const deleteEquipmentDocument = async (entityType, entityId, documentId) => {
  const response = await api.delete(`/v1/${entityType}s/${entityId}/documents/${documentId}`);
  return response.data;
};

export default {
  confirmUpload,
  uploadDocument,
  getDocumentUrl,
  deleteDocument,
  getLoadDocuments,
  uploadAvatar,
  uploadLogo,
  getDriverDocuments,
  uploadDriverDocument,
  deleteDriverDocument,
  getEquipmentDocuments,
  uploadEquipmentDocument,
  deleteEquipmentDocument
};
