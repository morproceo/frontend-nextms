/**
 * Per-policy control metadata for the Suite settings UI.
 *
 * The task manifest tells us WHICH policy keys an agent has via
 * `policyKeys: [...]`. This file says HOW to render each one — control
 * type, label, help text, options for selects, etc.
 *
 * Shape per key:
 *   type        'boolean' | 'select' | 'text' | 'number'
 *   label       short display label
 *   help        one-line description shown under the control
 *   options     (select only) array of { value, label }
 *   group       optional grouping header in the UI
 *
 * Adding a new agent? Add an entry keyed by slug → key → control config.
 * Adding a new key to an existing agent? Same — one new entry here.
 */

export const AGENT_POLICY_CONTROLS = {
  alex: {
    auto_check_new_loads: {
      type: 'boolean',
      label: 'Auto-check new loads',
      help: 'When a new load is created, Alex automatically reviews it. Off by default — flip on once you trust his proposals.',
      group: 'Triggers'
    },
    skip_when_clean: {
      type: 'boolean',
      label: 'Skip clean loads',
      help: 'When a load has every required field filled AND no rate-con attached, skip the LLM call. Saves tokens.',
      group: 'Triggers'
    },
    rate_con_is_source_of_truth: {
      type: 'boolean',
      label: 'Rate-con is source of truth',
      help: 'When the load and rate-con disagree, the rate-con wins. Default on — flip off only if you trust dispatcher input over uploaded documents.',
      group: 'Decision rules'
    },
    auto_apply_enabled: {
      type: 'boolean',
      label: 'Auto-apply high-confidence fills',
      help: 'Let Alex write the change immediately when his confidence clears the threshold below. Off by default — every change waits for your click.',
      group: 'Authority'
    },
    auto_apply_confidence: {
      type: 'select',
      label: 'Auto-apply confidence threshold',
      help: 'When auto-apply is on, only items at or above this confidence go through without confirmation.',
      options: [
        { value: 'high',   label: 'High only (strictest)' },
        { value: 'medium', label: 'Medium and above' },
        { value: 'low',    label: 'Low and above (loosest)' }
      ],
      group: 'Authority'
    },
    notify_broker_on_dispatch: {
      type: 'boolean',
      label: 'Notify broker on dispatch',
      help: 'When a load flips to "dispatched", draft an email to the broker (using the rate-con email) with driver + pickup details.',
      group: 'Broker notifications'
    },
    notify_broker_on_delivery: {
      type: 'boolean',
      label: 'Notify broker on delivery',
      help: 'When a load flips to "delivered", draft an email to the broker confirming delivery and noting invoice to follow.',
      group: 'Broker notifications'
    },
    auto_send_broker_emails: {
      type: 'boolean',
      label: 'Auto-send broker emails',
      help: 'Let Alex pull the trigger himself instead of leaving drafts in the inbox. Only fires when confidence is HIGH and (if required) inbox verification succeeded. Off by default — keep approval-in-the-loop until you trust the drafts.',
      group: 'Broker notifications'
    },
    require_inbox_verification: {
      type: 'boolean',
      label: 'Require inbox verification before auto-send',
      help: 'When auto-send is on, only send if we have prior email correspondence with the broker (cross-reference via Gmail). Catches OCR typos and unknown identities.',
      group: 'Broker notifications'
    }
  }
  // ava, alex, cece, mia, sage, genie — add entries here as each agent
  // ships its task manifest. Empty objects are fine; the renderer
  // shows "no configurable settings yet" for any agent with no entry.
};

/**
 * Group keys in declared order for predictable layout.
 */
export const GROUP_ORDER = [
  'Triggers',
  'Authority',
  'Decision rules',
  'Broker notifications',
  'Notifications',
  'Other'
];

/**
 * Look up the control config for a specific agent/key. Returns a
 * sensible fallback so the UI still renders SOMETHING when we forget
 * to add config for a new key.
 */
export function getControlConfig(agentSlug, key) {
  return (
    AGENT_POLICY_CONTROLS[agentSlug]?.[key] ?? {
      type: 'text',
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      help: '',
      group: 'Other'
    }
  );
}

export default { AGENT_POLICY_CONTROLS, GROUP_ORDER, getControlConfig };
