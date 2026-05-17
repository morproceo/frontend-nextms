/**
 * Genie chat API.
 */

import api from './client';

export const sendGenieMessage = async (message, conversationId) => {
  const response = await api.post('/v1/agents/genie/chat', {
    message,
    conversation_id: conversationId || undefined
  });
  return response.data;
};

export const listGenieConversations = async () => {
  const response = await api.get('/v1/agents/genie/conversations');
  return response.data;
};

export const getGenieConversation = async (conversationId) => {
  const response = await api.get(`/v1/agents/genie/conversations/${conversationId}`);
  return response.data;
};

export default { sendGenieMessage, listGenieConversations, getGenieConversation };
