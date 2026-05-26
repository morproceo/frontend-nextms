/**
 * GenieVoiceOverlay — drops into GeniePanel when the user taps the mic.
 *
 * Owns the @elevenlabs/client Conversation session: requests a WebRTC
 * token from our backend, starts the session, mirrors SDK status/mode
 * into a state machine that drives the ElevenLabs `<Orb/>`, pipes transcript turns
 * into the panel's messages array, and tears down cleanly on close.
 *
 * Captions + states (mirror the ElevenLabs reference screenshot):
 *   connecting  — Connecting…
 *   listening   — Listening…
 *   thinking    — Genie is thinking…   (mode=listening but VAD is past utterance)
 *   speaking    — Genie is speaking…
 *   error       — Connection lost — tap to retry
 *
 * The overlay sits absolutely over the messages region; the panel's
 * header + composer remain visible so the user can keep typing as a
 * fallback while a voice session is live.
 */

import { useEffect, useRef, useState } from 'react';
import { Conversation } from '@elevenlabs/client';
import { Mic, X, Loader2, AlertTriangle } from 'lucide-react';
import { Orb } from '../ui/orb';
import driverGenieVoiceApi from '../../api/driverGenieVoice.api';
import { cn } from '../../lib/utils';

// Map our internal state machine onto the Orb's 4-state vocabulary.
// `connecting` / `idle` / `error` collapse to null (calm sphere); the
// Orb owns its own state-specific visuals beyond that.
const orbStateFor = (s) => ({
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'talking'
})[s] || null;

// Module-level single-flight guard. React 18 StrictMode mounts the overlay
// twice in development; without this, both mounts fire parallel token
// requests and ElevenLabs's concurrent-call limit returns 429 on the loser.
// Sharing the in-flight promise means the second mount reuses the first
// mount's result instead of racing it.
let inflightSession = null;
const startSessionDedup = async (conversationId, apiStart) => {
  if (!inflightSession) {
    inflightSession = apiStart(conversationId).finally(() => {
      // Clear so the next user tap can mint fresh.
      setTimeout(() => { inflightSession = null; }, 0);
    });
  }
  return inflightSession;
};

const CAPTION = {
  idle:       '',
  connecting: 'Connecting…',
  listening:  'Listening…',
  thinking:   'Genie is thinking…',
  speaking:   'Genie is speaking…',
  error:      'Connection lost — tap to retry'
};

export function GenieVoiceOverlay({
  conversationId,
  onClose,
  onConversationId,
  onTranscript
}) {
  const [state, setState] = useState('connecting');
  const [errorText, setErrorText] = useState('');
  const convRef = useRef(null);
  // Last SDK mode ("listening" or "speaking"). We translate to our richer
  // 5-state UI machine — see effect below.
  const sdkModeRef = useRef('listening');

  useEffect(() => {
    let cancelled = false;
    let conv = null;
    let serverConvId = conversationId || null;

    (async () => {
      try {
        setState('connecting');
        setErrorText('');

        const session = await startSessionDedup(serverConvId, driverGenieVoiceApi.startVoiceSession);
        if (cancelled) return;
        serverConvId = session.conversation_id;
        if (onConversationId) onConversationId(session.conversation_id);

        conv = await Conversation.startSession({
          signedUrl: session.signed_url,
          connectionType: 'websocket',
          // Forwarded into the WS init message + every webhook tool call.
          // The agent's first_message template (`Hey {{driver_first_name}}, what's up?`)
          // relies on driver_first_name — without it the agent can't render
          // its first turn and ElevenLabs closes the socket.
          dynamicVariables: {
            user_id: session.user_id || '',
            conversation_id: session.conversation_id || '',
            driver_first_name: session.driver_first_name || ''
          },
          onConnect: () => {
            if (cancelled) return;
            setState('listening');
            // Feed Genie a brief snapshot once the WS settles. Defer a tick
            // so the SDK has finished its handshake; use convRef so the
            // call works regardless of the outer-closure binding timing.
            if (session.initial_context) {
              setTimeout(() => {
                try { convRef.current?.sendContextualUpdate?.(session.initial_context); }
                catch { /* ignore */ }
              }, 200);
            }
          },
          onDisconnect: () => {
            if (!cancelled) setState((s) => (s === 'error' ? s : 'idle'));
          },
          onError: (msg) => {
            if (cancelled) return;
            setErrorText(String(msg || 'voice error'));
            setState('error');
          },
          onModeChange: ({ mode }) => {
            sdkModeRef.current = mode;
            if (cancelled) return;
            // SDK only knows "listening" vs "speaking" (which agent role
            // currently holds the floor). We additionally surface "thinking"
            // ourselves below in onMessage when the user just finished.
            setState((prev) => {
              if (prev === 'error' || prev === 'connecting') return prev;
              return mode === 'speaking' ? 'speaking' : 'listening';
            });
          },
          onMessage: ({ message, source, role }) => {
            if (cancelled || !message) return;
            const r = role || (source === 'ai' ? 'assistant' : 'user');
            if (onTranscript) onTranscript({ role: r, content: String(message), source: 'voice' });
            // When the user just finished a turn, momentarily show
            // "thinking" until the assistant starts speaking. The SDK will
            // flip mode back to "speaking" — onModeChange clears us out of
            // this state automatically.
            if (r === 'user') {
              setState((prev) => (prev === 'error' ? prev : 'thinking'));
            }
          }
        });
        if (cancelled) {
          await conv.endSession().catch(() => {});
          return;
        }
        convRef.current = conv;
      } catch (err) {
        if (!cancelled) {
          // Backend wraps errors as { success:false, error:{ message } } and
          // axios surfaces the body as err.response.data. Drill or coerce so
          // React doesn't get an object to render.
          const apiErr = err?.response?.data?.error;
          const msg =
            (typeof apiErr === 'string' && apiErr) ||
            apiErr?.message ||
            err?.message ||
            'Could not start voice session';
          setErrorText(String(msg));
          setState('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (convRef.current) {
        convRef.current.endSession?.().catch(() => {});
        convRef.current = null;
      }
      if (serverConvId) {
        driverGenieVoiceApi.endVoiceSession(serverConvId).catch(() => {});
      }
    };
    // Intentionally one-shot; close + remount is the way to restart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = async () => {
    try { await convRef.current?.endSession?.(); } catch { /* ignore */ }
    onClose?.();
  };

  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex flex-col items-center justify-center',
        'bg-[#0a0e1a]/95 backdrop-blur-xl'
      )}
      role="dialog"
      aria-label="Genie voice conversation"
    >
      {/* Orb + caption */}
      <div className="flex flex-col items-center gap-6 px-6">
        <div className="w-52 h-52">
          <Orb
            colors={['#FDE68A', '#1E3A8A']}
            agentState={orbStateFor(state)}
            getInputVolume={() => convRef.current?.getInputVolume?.() ?? 0}
            getOutputVolume={() => convRef.current?.getOutputVolume?.() ?? 0}
          />
        </div>
        <div className="text-center min-h-[40px]">
          <p
            className={cn(
              'text-body-sm font-medium tracking-wide',
              state === 'error' ? 'text-red-300' : 'text-white/85'
            )}
          >
            {CAPTION[state] || ''}
          </p>
          {state === 'error' && errorText && (
            <p className="mt-1.5 text-[11px] text-white/40 max-w-[260px] mx-auto leading-snug">
              {errorText}
            </p>
          )}
        </div>
      </div>

      {/* End-voice button — small dark pill, bottom-center of the overlay
          (the panel's text composer still sits beneath). */}
      <div className="absolute left-0 right-0 bottom-4 flex flex-col items-center gap-3">
        {state === 'error' ? (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 h-10 rounded-full bg-white/[0.08] text-white/85 text-body-sm hover:bg-white/[0.14] transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Close
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClose}
            aria-label="End voice session"
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'bg-[#1c2230] text-white/90 border border-white/15',
              'hover:bg-[#262d3d] transition-colors shadow-[0_4px_24px_-6px_rgba(0,0,0,0.6)]'
            )}
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
        <p className="text-[10px] text-white/35 flex items-center gap-1.5">
          {state === 'connecting' ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Securing voice channel…</>
          ) : (
            <><Mic className="w-3 h-3" /> Voice — hands-free</>
          )}
        </p>
      </div>
    </div>
  );
}

export default GenieVoiceOverlay;
