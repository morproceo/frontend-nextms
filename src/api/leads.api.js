/**
 * Leads API — CRM surface over the existing atlas_opportunities table.
 *
 * Same data the Atlas page used to expose under /v1/atlas/opportunities,
 * just on a normal customer-perm route instead of the agent-gated one.
 * Future lead-only fields (outreach attempts, last_contacted_at, notes)
 * will land here without disturbing the Atlas pipeline.
 */

import api from './client';

export const listLeads = async (filters = {}) => {
  const qs = new URLSearchParams();
  if (filters.status) qs.set('status', filters.status);
  if (filters.search) qs.set('search', filters.search);
  if (filters.limit) qs.set('limit', filters.limit);
  if (filters.offset) qs.set('offset', filters.offset);
  const url = qs.toString() ? `/v1/leads?${qs.toString()}` : '/v1/leads';
  const r = await api.get(url);
  return r.data?.data ?? r.data;
};

export const getLead = async (id) => {
  const r = await api.get(`/v1/leads/${id}`);
  return r.data?.data ?? r.data;
};

export const updateLead = async (id, data) => {
  const r = await api.put(`/v1/leads/${id}`, data);
  return r.data?.data ?? r.data;
};

export const acceptLead = async (id) => {
  const r = await api.post(`/v1/leads/${id}/accept`);
  return r.data?.data ?? r.data;
};

export const rejectLead = async (id, reason) => {
  const r = await api.post(`/v1/leads/${id}/reject`, { reason });
  return r.data?.data ?? r.data;
};

export default { listLeads, getLead, updateLead, acceptLead, rejectLead };
