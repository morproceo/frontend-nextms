import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0066FF]/5 to-[#0066FF]/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.15)_0%,transparent_60%)]" />
      </div>

      <div className="container relative">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-headline text-white mb-6">
            Ready to get started?
          </h2>

          <p className="text-body-lg text-white/50 mb-12 max-w-xl mx-auto">
            Join hundreds of fleet owners who've made the switch. Start your free trial today.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="btn-primary group">
              Start free trial
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="btn-secondary">
              Schedule demo
            </button>
          </div>

          <p className="mt-8 text-sm text-white/40">
            Free 14-day trial · No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;
