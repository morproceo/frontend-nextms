import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'For small fleets getting started',
    monthlyPrice: 99,
    annualPrice: 79,
    features: [
      'Up to 5 trucks',
      '3 team members',
      'Load management',
      'Basic invoicing',
      'Driver app',
      'Email support',
    ],
  },
  {
    name: 'Standard',
    description: 'For growing fleets',
    monthlyPrice: 199,
    annualPrice: 159,
    features: [
      'Up to 25 trucks',
      '10 team members',
      'Everything in Starter',
      'Advanced analytics',
      'QuickBooks sync',
      'IFTA reporting',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large operations',
    monthlyPrice: null,
    annualPrice: null,
    features: [
      'Unlimited trucks',
      'Unlimited users',
      'Everything in Standard',
      'Custom integrations',
      'Dedicated manager',
      'SLA guarantee',
      'API access',
    ],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="pricing" className="py-32">
      <div className="container">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-medium text-[#0066FF] uppercase tracking-wide mb-4 block">
            Pricing
          </span>
          <h2 className="text-headline text-white mb-6">
            Simple pricing
          </h2>
          <p className="text-body-lg text-white/50 mb-10">
            Start free. Upgrade when ready.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/5 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                !annual ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              Annual
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#0066FF] text-white">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-[#0066FF]/10 border-2 border-[#0066FF]'
                  : 'bg-white/[0.02] border border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs font-medium bg-[#0066FF] text-white px-4 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-white/50">{plan.description}</p>
              </div>

              <div className="mb-8">
                {plan.monthlyPrice ? (
                  <>
                    <span className="text-4xl font-bold text-white">
                      ${annual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-white/50">/mo</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-white">Custom</span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#0066FF] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.monthlyPrice ? '/signup' : '/contact'}
                className={`flex items-center justify-center gap-2 w-full h-12 rounded-xl font-medium transition-all ${
                  plan.popular
                    ? 'bg-[#0066FF] hover:bg-[#3385FF] text-white'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {plan.monthlyPrice ? 'Start free trial' : 'Contact sales'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-white/40">
            14-day free trial · No credit card · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default Pricing;
