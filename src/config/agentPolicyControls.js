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
  },
  cece: {
    auto_categorize_enabled: {
      type: 'boolean',
      label: 'Auto-categorize new expenses',
      help: 'When a new draft expense is created, Cece sets its category if she is confident. Reversible — only touches drafts.',
      group: 'Triggers'
    },
    auto_categorize_confidence: {
      type: 'select',
      label: 'Auto-categorize confidence',
      help: 'Only auto-set the category when Cece is at least this confident.',
      options: [
        { value: 'high', label: 'High only (strictest)' },
        { value: 'medium', label: 'Medium and above' }
      ],
      group: 'Triggers'
    },
    auto_invoice_on_delivery: {
      type: 'boolean',
      label: 'Auto-draft invoice on delivery',
      help: 'When a load is delivered, Cece drafts an invoice from its revenue. Draft only — she never sends it.',
      group: 'Triggers'
    },
    auto_fill_from_receipt: {
      type: 'boolean',
      label: 'Fill gaps from the receipt',
      help: 'Let Cece backfill a missing vendor or date from a confidently-OCR\'d receipt before approval.',
      group: 'Decision rules'
    },
    review_amount_threshold: {
      type: 'number',
      label: 'Extra-scrutiny amount ($)',
      help: 'Expenses at or above this amount get flagged for extra review.',
      group: 'Decision rules'
    },
    auto_approve_enabled: {
      type: 'boolean',
      label: 'Auto-approve verified expenses',
      help: 'When the receipt OCR matches the entry and everything is clean, Cece approves it herself and stamps the timeline.',
      group: 'Authority'
    },
    auto_approve_confidence: {
      type: 'select',
      label: 'Auto-approve confidence',
      help: 'Only auto-approve when the receipt↔entry match is at least this strong.',
      options: [
        { value: 'high', label: 'High only (strictest)' },
        { value: 'medium', label: 'Medium and above' }
      ],
      group: 'Authority'
    },
    auto_approve_max_amount: {
      type: 'number',
      label: 'Auto-approve cap ($)',
      help: 'Never auto-approve above this amount, no matter how good the match.',
      group: 'Authority'
    },
    require_receipt_for_auto_approve: {
      type: 'boolean',
      label: 'Require a receipt to auto-approve',
      help: 'Keep on — without it Cece could approve receiptless expenses.',
      group: 'Authority'
    },
    audit_frequency: {
      type: 'select',
      label: 'Business audit cadence',
      help: 'How often Cece rechecks the whole business — stuck approvals, receiptless approvals, overdue invoices.',
      options: [
        { value: 'off', label: 'Off' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
      ],
      group: 'Audit'
    },
    approval_sla_days: {
      type: 'number',
      label: 'Approval SLA (days)',
      help: 'Flag expenses that sit pending approval longer than this.',
      group: 'Audit'
    }
  }
  // ava, mia, sage, genie — add entries here as each agent ships its
  // task manifest. Empty objects are fine; the renderer shows "no
  // configurable settings yet" for any agent with no entry.
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
  'Audit',
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
