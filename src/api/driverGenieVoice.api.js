/**
 * Driver Genie Voice API client.
 *
 * /v1/driver-portal/genie/voice/session → { conversation_token, agent_id, conversation_id, connection_type }
 *                                         token is short-lived; passed to @elevenlabs/client Conversation.startSession
 * /v1/driver-portal/genie/voice/end     → marks the conversation as updated (no destructive op)
 */

import api from './client';

// Backend wraps responses with successResponse: { success: true, data: {...} }
// — unwrap the envelope here so callers get the raw payload directly.
const unwrap = (r) => r?.data?.data ?? r?.data ?? {};

export const startVoiceSession = async (conversationId) => {
  const r = await api.post('/v1/driver-portal/genie/voice/session', {
    conversation_id: conversationId || undefined
  });
  return unwrap(r);
};

export const endVoiceSession = async (conversationId) => {
  const r = await api.post('/v1/driver-portal/genie/voice/end', {
    conversation_id: conversationId || undefined
  });
  return unwrap(r);
};

export default { startVoiceSession, endVoiceSession };
