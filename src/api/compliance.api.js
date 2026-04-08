/**
 * Compliance API
 * Handles compliance summary, company permit operations, and permit document uploads
 */

import api, { TokenManager } from './client';
import { getOrgSlug } from '../lib/utils';

/**
 * Get compliance summary across drivers, trucks, trailers, and company permits
 */
export const getComplianceSummary = async () => {
  const response = await api.get('/v1/compliance/summary');
  return response.data;
};

/**
 * Get company-level FMCSA permits checklist
 */
export const getCompanyPermits = async () => {
  const response = await api.get('/v1/compliance/company-permits');
  return response.data;
};

/**
 * Update company-level FMCSA permits checklist
 */
export const updateCompanyPermits = async (permits) => {
  const response = await api.put('/v1/compliance/company-permits', { permits });
  return response.data;
};

// ============================================
// PERMIT DOCUMENTS
// ============================================

/**
 * Get documents for a specific company permit
 */
export const getPermitDocuments = async (permitKey) => {
  const response = await api.get(`/v1/compliance/company-permits/${permitKey}/documents`);
  return response.data;
};

/**
 * Upload a document for a company permit (proxy upload with progress)
 */
export const uploadPermitDocument = async (permitKey, file, options = {}, onProgress) => {
  const baseUrl = api.defaults.baseURL || '';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    if (options.notes) formData.append('notes', options.notes);

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

    xhr.open('POST', `${baseUrl}/v1/compliance/company-permits/${permitKey}/documents`);

    const token = TokenManager.getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    const orgSlug = getOrgSlug();
    if (orgSlug) {
      xhr.setRequestHeader('X-Organization-Slug', orgSlug);
    }

    xhr.send(formData);
  });
};

/**
 * Delete a company permit document
 */
export const deletePermitDocument = async (documentId) => {
  const response = await api.delete(`/v1/compliance/company-permits/documents/${documentId}`);
  return response.data;
};

export default {
  getComplianceSummary,
  getCompanyPermits,
  updateCompanyPermits,
  getPermitDocuments,
  uploadPermitDocument,
  deletePermitDocument
};
