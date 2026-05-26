/**
 * Driver Genie chat API — user-scoped, no org required.
 * Same shape as genie.api so GeniePanel can pick either via apiVariant prop.
 */

import api from './client';

export const sendGenieMessage = async (message, conversationId) => {
  const r = await api.post('/v1/driver-portal/genie/chat', {
    message,
    conversation_id: conversationId || undefined
  });
  return r.data;
};

export const listGenieConversations = async () => {
  const r = await api.get('/v1/driver-portal/genie/conversations');
  return r.data;
};

export const getGenieConversation = async (conversationId) => {
  const r = await api.get(`/v1/driver-portal/genie/conversations/${conversationId}`);
  return r.data;
};

export default { sendGenieMessage, listGenieConversations, getGenieConversation };
