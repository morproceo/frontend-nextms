import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-mesh" />

      {/* Radial glow from top */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px]"
        style={{ opacity }}
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.15)_0%,transparent_70%)]" />
      </motion.div>

      <motion.div
        className="container relative z-10 pt-[180px] pb-[120px]"
        style={{ y, opacity }}
      >
        <div className="max-w-[900px]">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 text-[#0066FF] text-sm font-medium tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
              Transportation Management System
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-display mb-8"
          >
            <span className="text-white">The future of</span>
            <br />
            <span className="gradient-text-purple">fleet management</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-body-lg text-white/60 max-w-[540px] mb-12"
          >
            Built for the next generation of trucking companies.
            Dispatch, track, invoice — all from one beautifully simple platform.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/signup" className="btn-primary group">
              Start free trial
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="btn-secondary">
              Watch demo
            </button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 text-sm text-white/40"
          >
            Free 14-day trial · No credit card required
          </motion.p>
        </div>
      </motion.div>

      {/* Hero Image/Dashboard Preview */}
      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[55%] hidden lg:block"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        <div className="relative">
          {/* Glow behind */}
          <div className="absolute -inset-20 bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.2)_0%,transparent_70%)]" />

          {/* Dashboard mockup */}
          <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#141414] border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-white/30">app.nexttms.com</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Active Loads', value: '24' },
                  { label: 'Revenue MTD', value: '$148K' },
                  { label: 'On-Time', value: '98.5%' },
                  { label: 'Drivers', value: '18' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <div className="text-xs text-white/40 mb-1">{stat.label}</div>
                    <div className="text-xl font-semibold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-sm font-medium text-white mb-4">Active Loads</div>
                <div className="space-y-3">
                  {[
                    { id: 'LD-2847', route: 'Chicago → Dallas', status: 'In Transit' },
                    { id: 'LD-2848', route: 'Atlanta → Miami', status: 'Loading' },
                    { id: 'LD-2849', route: 'Denver → Phoenix', status: 'Scheduled' },
                  ].map((load, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0066FF]/20 flex items-center justify-center">
                          <span className="text-xs text-[#0066FF] font-medium">{i + 1}</span>
                        </div>
                        <div>
                          <div className="text-sm text-white">{load.route}</div>
                          <div className="text-xs text-white/40">{load.id}</div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        load.status === 'In Transit' ? 'bg-[#0066FF]/20 text-[#0066FF]' :
                        load.status === 'Loading' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {load.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default Hero;
