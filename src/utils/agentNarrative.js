/**
 * agentNarrative — turn a raw agent_job into a human, agent-voiced
 * email body for the Genie Inbox.
 *
 * Resolution order:
 *   1. If `output_data.narrative` exists, use it (a task wrote its
 *      own bespoke message — possibly LLM-generated).
 *   2. Otherwise synthesize one from the structured output using a
 *      per-task template below.
 *   3. Final fallback: humanize the existing `summary` field.
 *
 * Narratives are first-person, conversational, and use the agent's
 * voice. They sit at the top of the inbox preview pane as the
 * primary "email body" — the structured detail blocks below are
 * supporting info.
 */

import { getAgent } from '../config/genieTeam';

export function getJobNarrative(job) {
  if (!job) return '';

  // 1. Bespoke narrative wins.
  const out = job.output_data || {};
  const data = out.output || out;
  if (typeof out.narrative === 'string' && out.narrative.trim()) return out.narrative.trim();
  if (typeof data?.narrative === 'string' && data.narrative.trim()) return data.narrative.trim();

  // 2. Failure narrative.
  if (job.status === 'failed') {
    return failureNarrative(job);
  }

  // 3. Task-specific template.
  const builder = TEMPLATES[job.task_name];
  if (builder) {
    try {
      const text = builder(job, data);
      if (text) return text;
    } catch {
      // Fall through to summary.
    }
  }

  // 4. Fallback to existing summary if any.
  return out.summary || data?.summary || '';
}

/* ─────────────────────────────── Templates ──────────────────────────────── */

const TEMPLATES = {
  /* Alex — Operations */

  check_load_completeness: (job, data) => {
    const agent = agentName(job, 'Alex');
    const ref = loadRef(job, data);
    const target = ref ? `Load ${ref}` : 'this load';
    const ready = data?.ready_to_apply || [];
    const conflicts = data?.conflicts || [];
    const missing = data?.missing_fields || [];
    const hasRateCon = data?.has_rate_con !== false;

    if (!hasRateCon) {
      return `${agent} here — I took a look at ${target} but there's no rate-con attached yet. ` +
        `Once one's uploaded I can compare it against the load and flag anything that doesn't match.`;
    }
    if (ready.length === 0 && conflicts.length === 0 && missing.length === 0) {
      return `${agent} here. I reviewed ${target} against the rate-con and everything's in order — ` +
        `nothing to flag, nothing missing. You're clear.`;
    }

    const parts = [`${agent} here. I reviewed ${target} against the rate-con and have a few things for you:`];
    if (ready.length > 0) {
      const fields = ready.slice(0, 3).map((r) => prettyField(r.field)).join(', ');
      parts.push(
        `${ready.length} field${ready.length === 1 ? ' is' : 's are'} ready to apply ` +
        `(${fields}${ready.length > 3 ? ', and more' : ''}).`
      );
    }
    if (conflicts.length > 0) {
      const c = conflicts[0];
      parts.push(
        `${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'} to weigh in on — ` +
        `${prettyField(c.field)}${c.current_value && c.suggested_value
          ? ` (load says "${truncate(c.current_value)}", rate-con says "${truncate(c.suggested_value)}")`
          : ''}.`
      );
    }
    if (missing.length > 0) {
      const fields = missing.slice(0, 3).map((m) => m.label || prettyField(m.field)).join(', ');
      parts.push(
        `${missing.length} still missing on both sides (${fields}${missing.length > 3 ? ', and more' : ''}).`
      );
    }
    parts.push(`Want me to apply the safe ones?`);
    return parts.join(' ');
  },

  notify_broker_on_status_change: (job, data) => {
    const agent = agentName(job, 'Alex');
    const status = job.output_data?.status_event || data?.status_event || 'status change';
    const ref = loadRef(job, data);
    const target = ref ? `Load ${ref}` : 'a load';
    const sent = job.output_data?.sent || data?.sent;
    const skipped = job.output_data?.skipped || data?.skipped;
    const discarded = job.output_data?.discarded || data?.discarded;
    const email = job.output_data?.drafted_email || data?.drafted_email || {};
    const broker = job.output_data?.broker || data?.broker || {};
    const inboxCheck = job.output_data?.inbox_check || data?.inbox_check || {};

    if (sent) {
      return `${agent} here. Status flipped to ${humanizeStatus(status)} on ${target}, ` +
        `so I sent the broker a heads-up at ${email.to || 'their address on file'}. They're notified.`;
    }
    if (discarded) {
      return `${agent} here. I had a draft ready for the ${humanizeStatus(status)} update on ${target}, ` +
        `but you discarded it. No email went out.`;
    }
    if (skipped) {
      const reason = inboxCheck.reason || inboxCheck.details ||
        'I couldn\'t find a broker email anywhere — not on the rate-con, the broker record, or the load.';
      return `${agent} here. ${target} went to ${humanizeStatus(status)} but I skipped the broker notification: ` +
        `${reason}`;
    }
    // Drafted, awaiting approval.
    const to = email.to || broker.email;
    const conflictNote = broker.conflict
      ? ' Heads up — the rate-con and the broker record disagree on which email to use, so double-check before you approve.'
      : '';
    if (to) {
      return `${agent} here. ${target} just flipped to ${humanizeStatus(status)}. ` +
        `I drafted a quick note to ${to}${email.subject ? ` ("${email.subject}")` : ''} ` +
        `— take a look and approve when you're ready.${conflictNote}`;
    }
    return `${agent} here. I'm drafting a ${humanizeStatus(status)} notification for ${target} — ` +
      `give me a moment to find the right broker contact.`;
  },

  scan_inbox_now: (job, data) => {
    const agent = agentName(job, 'Alex');
    if (data?.skipped) {
      return `${agent} here. ${data.reason || 'Nothing to scan right now.'}`;
    }
    const t = data?.triggered_count || 0;
    const f = data?.failed_count || 0;
    const total = data?.connections_total || 0;
    if (t === 0 && f > 0) {
      return `${agent} here. Tried to sweep your inbox${total > 1 ? `es (${total})` : ''} but couldn't reach the sync queue. ` +
        `Your sysadmin can check the Atlas worker.`;
    }
    if (t > 0 && f === 0) {
      return `${agent} here. I'm sweeping your ${t === 1 ? 'inbox' : `${t} inboxes`} for new freight leads right now. ` +
        `Anything I find will land in this inbox as its own message — give me a minute.`;
    }
    return `${agent} here. Kicked off scans on ${t}/${total} ${total === 1 ? 'inbox' : 'inboxes'} ` +
      `(${f} failed). New leads will show up here as I find them.`;
  },

  scan_email_for_leads: (job, data) => {
    const agent = agentName(job, 'Alex');
    if (data?.skipped) {
      return `${agent} here. Took a look at an incoming email but it wasn't a freight lead — skipping. ` +
        `${data?.reason ? `(${data.reason})` : ''}`;
    }
    const broker = data?.broker?.name;
    const route = data?.route;
    const rate = data?.rate;
    const conf = data?.overall_confidence;
    const confPct = conf != null ? `${Math.round(conf * 100)}% confidence` : null;
    const equipment = data?.equipment_type;
    const pickup = data?.pickup_date;

    const lead = broker
      ? `a lead from ${broker}`
      : 'a freight lead';
    const detailParts = [
      route,
      rate,
      equipment,
      pickup ? `pickup ${pickup}` : null
    ].filter(Boolean);
    const detail = detailParts.length ? ` ${detailParts.join(' · ')}.` : '.';

    if (data?.auto_added) {
      return `${agent} here. Spotted ${lead} in your inbox and auto-accepted it${confPct ? ` (${confPct})` : ''}.${detail} ` +
        `It's on your board — open the lead if you want to dig in.`;
    }
    return `${agent} here. Spotted ${lead} in your inbox${confPct ? ` (${confPct})` : ''}.${detail} ` +
      `It's waiting for your call in the leads list.`;
  },

  apply_load_fixes: (job, data) => {
    const agent = agentName(job, 'Alex');
    const applied = data?.applied ?? 0;
    const skipped = data?.skipped ?? 0;
    const ref = loadRef(job, data);
    const target = ref ? `Load ${ref}` : 'the load';
    if (applied === 0) {
      return `${agent} here. I tried to apply your selected fixes to ${target} but ` +
        `nothing went through${skipped ? ` (${skipped} were skipped)` : ''}.`;
    }
    return `${agent} here. Applied ${applied} change${applied === 1 ? '' : 's'} to ${target} just now` +
      `${skipped ? `, and skipped ${skipped} that didn't pass the check` : ''}. ` +
      `Re-ran the review afterward to make sure it's clean.`;
  },

  /* Cece — Finance */

  categorize_expense: (job, data) => {
    const agent = agentName(job, 'Cece');
    const cat = data?.category;
    const conf = data?.confidence;
    const reasoning = data?.reasoning;
    const merchant = data?.merchant || data?.vendor;
    const amount = data?.amount_cents != null ? `$${(data.amount_cents / 100).toLocaleString()}` : null;

    const subject = merchant
      ? `the charge from ${merchant}${amount ? ` for ${amount}` : ''}`
      : amount
      ? `that ${amount} expense`
      : 'an expense';

    if (!cat) {
      return `${agent} here. I took a look at ${subject} but I'm not sure what bucket it belongs in. ` +
        `If you tell me once, I'll learn it.`;
    }
    const tail = reasoning ? ` — ${truncate(reasoning, 140)}` : conf ? ` (${conf} confidence).` : '.';
    return `${agent} here. Categorized ${subject} as ${cat}${tail}`;
  },

  review_pending_expense: (job, data) => {
    const agent = agentName(job, 'Cece');
    const rec = data?.recommendation;
    const amount = data?.amount_cents != null ? `$${(data.amount_cents / 100).toLocaleString()}` : null;
    if (rec) {
      return `${agent} here. Reviewed a pending expense${amount ? ` for ${amount}` : ''}: ${rec}.`;
    }
    return `${agent} here. I had a look at the pending expense${amount ? ` for ${amount}` : ''} — nothing flagged.`;
  },

  generate_invoice_for_load: (job, data) => {
    const agent = agentName(job, 'Cece');
    const ref = loadRef(job, data);
    const target = ref ? `Load ${ref}` : 'a load';
    const number = data?.invoice_number;
    const total = data?.total_cents != null ? `$${(data.total_cents / 100).toLocaleString()}` : null;
    const to = data?.send_to || data?.bill_to_email;

    if (!number) {
      return `${agent} here. Tried to generate an invoice for ${target} but couldn't pull together everything I needed. ` +
        `Check that the load has a rate, broker, and bill-to set.`;
    }
    return `${agent} here. Generated invoice ${number} for ${target}${total ? ` — total ${total}` : ''}` +
      `${to ? `, ready to send to ${to}` : ''}. Take a quick look before it goes out.`;
  },

  finance_watch: (job, data) => {
    const agent = agentName(job, 'Cece');
    const alerts = data?.alerts || [];
    if (alerts.length === 0) {
      return `${agent} here. Daily finance check is done — cash flow, fuel spend, and outstanding invoices ` +
        `all look normal. Nothing to flag today.`;
    }
    const top = alerts[0];
    const topMsg = top?.message || top?.summary || 'a finance signal worth a look';
    const more = alerts.length > 1
      ? ` Plus ${alerts.length - 1} more — open this to see them all.`
      : '';
    return `${agent} here. Couple of things from today's finance watch: ${truncate(topMsg, 200)}${more}`;
  },

  audit_finances: (job, data) => {
    const agent = agentName(job, 'Cece');
    const findings = data?.findings?.length || 0;
    if (findings === 0) {
      return `${agent} here. Finished the audit pass — everything reconciles cleanly. ` +
        `No mismatches between your loads, invoices, and bank deposits.`;
    }
    return `${agent} here. Finished an audit pass and surfaced ${findings} thing${findings === 1 ? '' : 's'} ` +
      `worth your attention. Open this to see the details.`;
  }
};

/* ─────────────────────────────── Helpers ────────────────────────────────── */

function failureNarrative(job) {
  const agent = agentName(job);
  const task = humanize(job.task_name);
  const err = job.error_message || 'I hit an unexpected error.';
  const target = job.target_type && job.target_id
    ? ` while working on ${job.target_type} ${String(job.target_id).slice(0, 8)}`
    : '';
  return `${agent} here — ${task} failed${target}. ${truncate(err, 240)} ` +
    `You can rerun it once the underlying issue is resolved.`;
}

function agentName(job, fallback) {
  const a = getAgent(job?.agent_slug);
  return a?.name?.split(' ')[0] || fallback || cap(job?.agent_slug) || 'Your agent';
}

function loadRef(job, data) {
  return data?.load?.reference_number ||
    data?.reference_number ||
    job?.output_data?.load?.reference_number ||
    null;
}

function prettyField(f) {
  return (f || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanize(name) {
  return (name || '').split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ').toLowerCase();
}

function humanizeStatus(status) {
  return (status || '').replace(/_/g, ' ').toLowerCase();
}

function truncate(s, n = 160) {
  if (s == null) return '';
  const str = String(s);
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default getJobNarrative;
