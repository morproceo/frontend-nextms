/**
 * Expenses API
 * Handles expense CRUD, approval workflow, and reporting
 */

import api from './client';

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Get all expenses for the current organization
 */
export const getExpenses = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach(s => params.append('status', s));
    } else {
      params.append('status', filters.status);
    }
  }
  if (filters.category) params.append('category', filters.category);
  if (filters.category_id) params.append('category_id', filters.category_id);
  if (filters.entity_type) params.append('entity_type', filters.entity_type);
  if (filters.entity_id) params.append('entity_id', filters.entity_id);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.search) params.append('search', filters.search);
  if (filters.submitted_by_user_id) params.append('submitted_by_user_id', filters.submitted_by_user_id);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);

  const queryString = params.toString();
  const url = queryString ? `/v1/expenses?${queryString}` : '/v1/expenses';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single expense by ID
 */
export const getExpense = async (expenseId) => {
  const response = await api.get(`/v1/expenses/${expenseId}`);
  return response.data;
};

/**
 * Create a new expense
 */
export const createExpense = async (data) => {
  const response = await api.post('/v1/expenses', data);
  return response.data;
};

/**
 * Update an expense
 */
export const updateExpense = async (expenseId, data) => {
  const response = await api.patch(`/v1/expenses/${expenseId}`, data);
  return response.data;
};

/**
 * Delete an expense (soft delete)
 */
export const deleteExpense = async (expenseId) => {
  const response = await api.delete(`/v1/expenses/${expenseId}`);
  return response.data;
};

// ============================================
// WORKFLOW OPERATIONS
// ============================================

/**
 * Submit expense for approval
 */
export const submitForApproval = async (expenseId) => {
  const response = await api.post(`/v1/expenses/${expenseId}/submit`);
  return response.data;
};

/**
 * Approve an expense
 */
export const approveExpense = async (expenseId) => {
  const response = await api.post(`/v1/expenses/${expenseId}/approve`);
  return response.data;
};

/**
 * Reject an expense
 */
export const rejectExpense = async (expenseId, reason) => {
  const response = await api.post(`/v1/expenses/${expenseId}/reject`, { reason });
  return response.data;
};

/**
 * Mark expense as paid
 */
export const markAsPaid = async (expenseId, paymentDetails = {}) => {
  const response = await api.post(`/v1/expenses/${expenseId}/mark-paid`, paymentDetails);
  return response.data;
};

// ============================================
// STATISTICS & REPORTING
// ============================================

/**
 * Get expense statistics
 */
export const getExpenseStats = async (dateRange = {}) => {
  const params = new URLSearchParams();
  if (dateRange.from) params.append('from', dateRange.from);
  if (dateRange.to) params.append('to', dateRange.to);

  const queryString = params.toString();
  const url = queryString ? `/v1/expenses/stats?${queryString}` : '/v1/expenses/stats';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get expense summary for reporting
 */
export const getExpenseSummary = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);

  const queryString = params.toString();
  const url = queryString ? `/v1/expenses/summary?${queryString}` : '/v1/expenses/summary';

  const response = await api.get(url);
  return response.data;
};

/**
 * Export expenses as CSV
 */
export const exportExpenses = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);

  const queryString = params.toString();
  const url = queryString ? `/v1/expenses/export?${queryString}` : '/v1/expenses/export';

  const response = await api.get(url, { responseType: 'blob' });
  return response.data;
};

// ============================================
// CATEGORIES
// ============================================

/**
 * Get all expense categories (system + custom)
 */
export const getCategories = async () => {
  const response = await api.get('/v1/expenses/categories');
  return response.data;
};

/**
 * Create a custom category
 */
export const createCategory = async (data) => {
  const response = await api.post('/v1/expenses/categories', data);
  return response.data;
};

/**
 * Update a custom category
 */
export const updateCategory = async (categoryId, data) => {
  const response = await api.patch(`/v1/expenses/categories/${categoryId}`, data);
  return response.data;
};

/**
 * Delete a custom category
 */
export const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/v1/expenses/categories/${categoryId}`);
  return response.data;
};

// ============================================
// AI RECEIPT PARSING
// ============================================

/**
 * Parse a receipt using AI to extract expense data
 * @param {File} file - The receipt file (PDF or image)
 * @returns {Promise<object>} Extracted expense data
 */
export const parseReceipt = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/v1/expenses/parse-receipt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default {
  // CRUD
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  // Workflow
  submitForApproval,
  approveExpense,
  rejectExpense,
  markAsPaid,
  // Stats & Reporting
  getExpenseStats,
  getExpenseSummary,
  exportExpenses,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // AI
  parseReceipt
};
