import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const testimonials = [
  {
    quote: "NEXT TMS transformed our operation. We went from chaos to clarity in a week.",
    author: 'Michael Rodriguez',
    role: 'Owner, Rodriguez Transport',
    trucks: '15 trucks'
  },
  {
    quote: "The driver app is a game-changer. My guys actually use it without complaining.",
    author: 'Sarah Chen',
    role: 'Ops Manager, Pacific Freight',
    trucks: '42 trucks'
  },
  {
    quote: "We tried three other platforms. Nothing comes close to NEXT.",
    author: 'James Thompson',
    role: 'CEO, Thompson Logistics',
    trucks: '28 trucks'
  },
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-32">
      <div className="container">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-medium text-[#0066FF] uppercase tracking-wide mb-4 block">
            Testimonials
          </span>
          <h2 className="text-headline text-white">
            Loved by fleets
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-8"
            >
              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#0066FF]/20 flex items-center justify-center">
                  <span className="text-[#0066FF] font-medium">
                    {t.author.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{t.author}</div>
                  <div className="text-xs text-white/40">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
