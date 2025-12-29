/**
 * Uploads API
 * Handles file uploads to S3 via presigned URLs
 */

import api from './client';

/**
 * Get presigned URL for uploading a file
 */
export const getPresignedUrl = async (fileName, mimeType, context, options = {}) => {
  const response = await api.post('/v1/uploads/presign', {
    fileName,
    mimeType,
    context,
    loadId: options.loadId,
    docType: options.docType,
    fileSize: options.fileSize
  });
  return response.data;
};

/**
 * Upload file directly to S3 using presigned URL
 */
export const uploadToS3 = async (uploadUrl, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
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
 * Full upload flow: get URL, upload to S3, confirm
 */
export const uploadDocument = async (file, options = {}, onProgress) => {
  const { context = 'load_document', loadId, docType, notes } = options;

  // Step 1: Get presigned URL
  const { data: presignData } = await getPresignedUrl(
    file.name,
    file.type,
    context,
    { loadId, docType, fileSize: file.size }
  );

  // Step 2: Upload to S3
  await uploadToS3(presignData.uploadUrl, file, onProgress);

  // Step 3: Confirm upload
  const { data: confirmData } = await confirmUpload(presignData.key, {
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
 * Upload avatar
 */
export const uploadAvatar = async (file, onProgress) => {
  // Get presigned URL for avatar
  const response = await api.post('/v1/uploads/presign/avatar', {
    fileName: file.name,
    mimeType: file.type
  });
  const { data: presignData } = response;

  // Upload to S3
  await uploadToS3(presignData.uploadUrl, file, onProgress);

  // Return the S3 key (caller can update user profile with this)
  return {
    key: presignData.key,
    url: `https://${import.meta.env.VITE_S3_BUCKET || 'tms-documents-571170910626'}.s3.amazonaws.com/${presignData.key}`
  };
};

/**
 * Upload organization logo
 */
export const uploadLogo = async (file, onProgress) => {
  // Get presigned URL for logo
  const response = await api.post('/v1/uploads/presign/logo', {
    fileName: file.name,
    mimeType: file.type
  });
  const { data: presignData } = response;

  // Upload to S3
  await uploadToS3(presignData.uploadUrl, file, onProgress);

  return {
    key: presignData.key,
    url: `https://${import.meta.env.VITE_S3_BUCKET || 'tms-documents-571170910626'}.s3.amazonaws.com/${presignData.key}`
  };
};

export default {
  getPresignedUrl,
  uploadToS3,
  confirmUpload,
  uploadDocument,
  getDocumentUrl,
  deleteDocument,
  getLoadDocuments,
  uploadAvatar,
  uploadLogo
};
