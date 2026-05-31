/**
 * ToastContext
 *
 * Lightweight toast provider built on @radix-ui/react-toast.
 *
 * Standard usage:
 *   const { toast } = useToast();
 *   toast({ title: 'Saved', description: 'Settings updated.', variant: 'success' });
 *
 * Agent toasts (Phase 1 of the agent-notification system) — surface
 * agent activity with an avatar and a CTA back into the Genie Inbox:
 *
 *   toast({
 *     title: 'Audited 12 loads · fixed 4 fields',
 *     description: 'Open in inbox for the full digest.',
 *     agent: getAgent('alex'),                  // from config/genieTeam
 *     action: { label: 'Open in inbox', to: '/genie/inbox' },
 *     variant: 'info',
 *     durationMs: 8000
 *   });
 *
 * The toast is the doorway, the Inbox is the room — toast descriptions
 * stay short (~12-15 words) so users click through for the detail
 * instead of reading the whole report on the toast.
 */

import { createContext, useCallback, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import * as RadixToast from '@radix-ui/react-toast';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { AgentAvatar } from '../components/genie/AgentAvatar';

const ToastContext = createContext({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const VARIANT = {
  success: { Icon: CheckCircle, ring: 'border-success/30 bg-success/5', icon: 'text-success' },
  warning: { Icon: AlertTriangle, ring: 'border-warning/30 bg-warning/5', icon: 'text-warning' },
  error:   { Icon: XCircle,      ring: 'border-error/30 bg-error/5',     icon: 'text-error' },
  info:    { Icon: Info,         ring: 'border-accent/30 bg-accent/5',   icon: 'text-accent' }
};

// Default lifetime — agent toasts get a longer window because they're
// actionable (user is supposed to click through), regular toasts dismiss
// faster.
const DEFAULT_DURATION = 5000;
const AGENT_DURATION = 8000;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  /**
   * @param {Object} args
   * @param {string} [args.title]
   * @param {string} [args.description]
   * @param {'success'|'warning'|'error'|'info'} [args.variant='info']
   * @param {number} [args.durationMs]
   * @param {Object} [args.agent] - { slug, name, accent } from genieTeam config
   * @param {Object} [args.action] - { label, to } for an in-app link OR
   *                                 { label, onClick } for a callback
   */
  const toast = useCallback((args) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const defaultDuration = args.agent ? AGENT_DURATION : DEFAULT_DURATION;
    setItems(prev => [...prev, {
      id,
      title: args.title,
      description: args.description,
      variant: args.variant || 'info',
      durationMs: args.durationMs ?? defaultDuration,
      agent: args.agent || null,
      action: args.action || null
    }]);
  }, []);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {items.map(item => {
          const cfg = VARIANT[item.variant] || VARIANT.info;
          const Icon = cfg.Icon;
          const handleActionClick = () => {
            if (item.action?.onClick) {
              try { item.action.onClick(); } catch { /* swallow */ }
            }
            remove(item.id);
          };
          return (
            <RadixToast.Root
              key={item.id}
              duration={item.durationMs}
              onOpenChange={(open) => { if (!open) remove(item.id); }}
              className={`border rounded-lg p-3 shadow-card flex items-start gap-2.5 bg-white ${cfg.ring}`}
            >
              {item.agent ? (
                <AgentAvatar agent={item.agent} size="sm" className="mt-0.5" />
              ) : (
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.icon}`} />
              )}
              <div className="flex-1 min-w-0">
                {item.title && (
                  <RadixToast.Title className="text-body-sm font-semibold text-text-primary">
                    {item.title}
                  </RadixToast.Title>
                )}
                {item.description && (
                  <RadixToast.Description className="text-body-sm text-text-secondary mt-0.5">
                    {item.description}
                  </RadixToast.Description>
                )}
                {item.action && (
                  <div className="mt-2">
                    {item.action.to ? (
                      <Link
                        to={item.action.to}
                        onClick={() => remove(item.id)}
                        className="text-body-sm font-medium text-accent hover:underline inline-flex items-center gap-1"
                      >
                        {item.action.label} →
                      </Link>
                    ) : item.action.onClick ? (
                      <button
                        type="button"
                        onClick={handleActionClick}
                        className="text-body-sm font-medium text-accent hover:underline inline-flex items-center gap-1"
                      >
                        {item.action.label} →
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
              <RadixToast.Close className="text-text-tertiary hover:text-text-primary text-[14px] leading-none p-1 self-start">
                ×
              </RadixToast.Close>
            </RadixToast.Root>
          );
        })}
        <RadixToast.Viewport
          className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 w-[380px] max-w-[100vw] p-4 outline-none"
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
