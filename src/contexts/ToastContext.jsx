/**
 * ToastContext (Phase 7)
 *
 * Lightweight toast provider built on @radix-ui/react-toast (already
 * installed but never instantiated — see UX/UI plan §16 "Out-of-frontend-
 * scope" footnote). Replaces the noisiest inline error UIs going forward.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast({ title: 'Saved', description: 'Settings updated.', variant: 'success' });
 */

import { createContext, useCallback, useContext, useState } from 'react';
import * as RadixToast from '@radix-ui/react-toast';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

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

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const toast = useCallback(({ title, description, variant = 'info', durationMs = 5000 }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems(prev => [...prev, { id, title, description, variant, durationMs }]);
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
          return (
            <RadixToast.Root
              key={item.id}
              duration={item.durationMs}
              onOpenChange={(open) => { if (!open) remove(item.id); }}
              className={`border rounded-lg p-3 shadow-card flex items-start gap-2 bg-white ${cfg.ring}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.icon}`} />
              <div className="flex-1 min-w-0">
                {item.title && <RadixToast.Title className="text-body-sm font-semibold text-text-primary">{item.title}</RadixToast.Title>}
                {item.description && <RadixToast.Description className="text-body-sm text-text-secondary mt-0.5">{item.description}</RadixToast.Description>}
              </div>
              <RadixToast.Close className="text-text-tertiary hover:text-text-primary text-[12px] leading-none p-1">×</RadixToast.Close>
            </RadixToast.Root>
          );
        })}
        <RadixToast.Viewport
          className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 w-[360px] max-w-[100vw] p-4 outline-none"
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
