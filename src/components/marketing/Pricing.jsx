import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Owner Op Plan',
    description: 'For owner operators getting started',
    monthlyPrice: '49.99',
    features: [
      '1-2 trucks',
      '1 seat',
    ],
  },
  {
    name: 'Basic Plan',
    description: 'For growing small fleets',
    monthlyPrice: '99.99',
    features: [
      'Up to 5 trucks',
      '2 seats',
    ],
    popular: true,
  },
  {
    name: 'Fleet',
    description: 'For larger fleet operations',
    monthlyPrice: '299',
    features: [
      'Up to 20 trucks',
      '5 seats',
    ],
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="pricing" className="py-32">
      <div className="container">
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
            Straightforward plans for fleets at every stage.
          </p>
        </motion.div>

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
                <span className="text-4xl font-bold text-white">${plan.monthlyPrice}</span>
                <span className="text-white/50">/m</span>
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
                to="/signup"
                className={`flex items-center justify-center gap-2 w-full h-12 rounded-xl font-medium transition-all ${
                  plan.popular
                    ? 'bg-[#0066FF] hover:bg-[#3385FF] text-white'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="max-w-5xl mx-auto mt-8 grid gap-6 md:grid-cols-[1.3fr_0.7fr]"
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-[#0066FF] mb-4">
              Add Ons
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-white font-medium">Seats</p>
                <p className="text-sm text-white/60">$20/m</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-white font-medium">Trucks</p>
                <p className="text-sm text-white/60">$10/m</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#0066FF]/30 bg-[#0066FF]/10 p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-[#7FB0FF] mb-3">
              Enterprise
            </p>
            <p className="text-sm text-white/70 mb-5">
              Contact sales for more information.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#B8D4FF] transition-colors"
            >
              Contact sales
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

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
