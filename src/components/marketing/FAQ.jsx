import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: 'How long does setup take?',
    a: 'Most companies are up and running in under 30 minutes. We can import your existing data automatically.'
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. NEXT is 100% cloud-based. Works in any browser. Drivers download the mobile app from App Store or Google Play.'
  },
  {
    q: 'What integrations do you support?',
    a: 'QuickBooks, Stripe, major ELDs (Samsara, KeepTruckin), load boards (DAT, Truckstop), and more.'
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Bank-level 256-bit encryption, SOC 2 compliant data centers, hourly backups. Your data is always yours.'
  },
  {
    q: 'What happens after my trial?',
    a: 'Choose a plan that fits. No auto-charge. Your data is preserved if you subscribe.'
  },
];

export function FAQ() {
  const [open, setOpen] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-32">
      <div className="container max-w-3xl">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-[#0066FF] uppercase tracking-wide mb-4 block">
            FAQ
          </span>
          <h2 className="text-headline text-white">
            Questions?
          </h2>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.05 }}
              className="border border-white/5 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-white font-medium">{faq.q}</span>
                {open === i ? (
                  <Minus className="w-5 h-5 text-white/40" />
                ) : (
                  <Plus className="w-5 h-5 text-white/40" />
                )}
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-white/50">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
