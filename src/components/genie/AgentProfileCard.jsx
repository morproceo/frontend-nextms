import { Link } from 'react-router-dom';
import {
  Sparkles,
  Wrench,
  Settings as SettingsIcon,
  ArrowRight,
  Workflow,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * AgentProfileCard — third column on the AgentPage workspace.
 *
 * The agent's identity card: role, what they do, what tools they
 * touch, the 5-stage pipeline they follow, and a link into their
 * policies. Sized to match the Inbox / Activity columns at the same
 * fixed height, with internal scrolling.
 */
export function AgentProfileCard({ agent, orgSlug, className }) {
  const firstName = agent.name.split(' ')[0];

  return (
    <section className={cn('bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden flex flex-col h-full', className)}>
      <header className="px-5 py-3 border-b border-surface-tertiary flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-text-secondary" />
          <span className="text-body-sm font-medium text-text-primary">Profile</span>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            {agent.role}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto divide-y divide-surface-tertiary">
        {/* Tagline */}
        <Block>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            {agent.tagline}
          </p>
        </Block>

        {/* Capabilities */}
        <Block label={`What ${firstName} does`}>
          <ul className="space-y-2">
            {agent.capabilities.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-body-sm text-text-secondary">
                <Sparkles
                  className={cn(
                    'w-3.5 h-3.5 flex-shrink-0 mt-1',
                    `text-${agent.solidColor}-500`
                  )}
                />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Block>

        {/* Hands on */}
        <Block label="Hands on">
          <div className="flex flex-wrap gap-1.5">
            {agent.hands.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-body-sm rounded-full bg-surface-secondary text-text-secondary border border-surface-tertiary"
              >
                <Wrench className="w-3 h-3 text-text-tertiary" />
                {h}
              </span>
            ))}
          </div>
        </Block>

        {/* Pipeline trace explainer — gives the page that
            "AI is thinking, here's how" feel. */}
        <Block label="How decisions are made">
          <ol className="space-y-2">
            {PIPELINE.map((stage, i) => (
              <li key={stage.key} className="flex items-start gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold',
                  `bg-${agent.solidColor}-500/10 text-${agent.solidColor}-600`
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-medium text-text-primary">{stage.label}</div>
                  <div className="text-small text-text-tertiary leading-snug">
                    {stage.description}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Block>

        {/* Policies quicklink */}
        <Block label="Configuration">
          <Link
            to={`/o/${orgSlug}/genie/settings#${agent.slug}`}
            className="group flex items-center gap-3 px-4 py-3 rounded-button bg-surface-secondary border border-surface-tertiary hover:border-fuchsia-500/40 transition-colors"
          >
            <SettingsIcon className="w-4 h-4 text-text-secondary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-medium text-text-primary">
                {firstName}'s policies
              </div>
              <div className="text-small text-text-tertiary">
                Triggers, decision rules, authority.
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:translate-x-0.5 group-hover:text-fuchsia-500 transition-all" />
          </Link>
        </Block>

        {/* Footer breathing room */}
        <div className="px-5 py-4 flex items-center justify-center text-text-tertiary">
          <Workflow className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-[10px] uppercase tracking-wider">end of profile</span>
        </div>
      </div>
    </section>
  );
}

const PIPELINE = [
  { key: 'gather', label: 'Gather',  description: 'Pulls the relevant rows from your data: loads, expenses, brokers, telematics.' },
  { key: 'reason', label: 'Reason',  description: 'Calls the LLM with the right tools to weigh options and pick a course.' },
  { key: 'gate',   label: 'Gate',    description: 'Checks the org policies — auto-apply, propose, or skip — for this kind of action.' },
  { key: 'act',    label: 'Act',     description: 'Writes the result back to your TMS, or drafts it for you to approve.' },
  { key: 'audit',  label: 'Audit',   description: 'Logs every step so you can see exactly why it did what it did.' }
];

function Block({ label, children }) {
  return (
    <div className="px-5 py-4">
      {label && (
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-2">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

export default AgentProfileCard;
