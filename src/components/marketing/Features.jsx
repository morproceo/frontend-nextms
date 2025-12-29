import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { LayoutDashboard, Truck, Receipt, Smartphone, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    title: 'Your command center',
    description: 'See everything at a glance. Real-time load tracking, revenue metrics, driver status, and performance analytics — all in one beautiful view.',
    image: 'dashboard'
  },
  {
    icon: Truck,
    label: 'Dispatch',
    title: 'Dispatch in seconds',
    description: 'Create, assign, and track loads effortlessly. Drag-and-drop dispatch, smart route optimization, and automated status updates.',
    image: 'dispatch'
  },
  {
    icon: Receipt,
    label: 'Invoicing',
    title: 'Get paid faster',
    description: 'One-click professional invoices. QuickBooks integration, IFTA reports, and payment tracking — all automated.',
    image: 'invoicing'
  },
  {
    icon: Smartphone,
    label: 'Driver App',
    title: 'Drivers love it',
    description: 'A mobile app your drivers will actually use. Beautiful, intuitive, and built for the road. iOS and Android.',
    image: 'app'
  },
];

function FeatureItem({ feature, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="grid md:grid-cols-2 gap-16 items-center py-32"
    >
      {/* Text */}
      <div className={index % 2 === 1 ? 'md:order-2' : ''}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#0066FF]/10 flex items-center justify-center">
            <feature.icon className="w-5 h-5 text-[#0066FF]" />
          </div>
          <span className="text-sm font-medium text-[#0066FF] uppercase tracking-wide">
            {feature.label}
          </span>
        </div>

        <h3 className="text-headline text-white mb-6">
          {feature.title}
        </h3>

        <p className="text-body-lg text-white/50 leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Visual */}
      <div className={index % 2 === 1 ? 'md:order-1' : ''}>
        <div className="relative">
          {/* Glow */}
          <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.15)_0%,transparent_70%)]" />

          {/* Mock UI */}
          <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 shadow-2xl">
            {feature.image === 'dashboard' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {['$148K', '24', '98.5%'].map((val, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">{val}</div>
                      <div className="text-xs text-white/40 mt-1">
                        {['Revenue', 'Loads', 'On-Time'][i]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-32 bg-white/5 rounded-xl flex items-end p-4 gap-2">
                  {[40, 65, 45, 80, 60, 75, 55].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#0066FF]/60 rounded-t"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {feature.image === 'dispatch' && (
              <div className="space-y-3">
                {[
                  { route: 'Chicago → Dallas', driver: 'Mike J.', status: 'In Transit' },
                  { route: 'Atlanta → Miami', driver: 'Sarah K.', status: 'Loading' },
                  { route: 'Denver → Phoenix', driver: 'John D.', status: 'Scheduled' },
                ].map((load, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <div className="text-white font-medium">{load.route}</div>
                      <div className="text-sm text-white/40">{load.driver}</div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      load.status === 'In Transit' ? 'bg-[#0066FF]/20 text-[#0066FF]' :
                      load.status === 'Loading' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {load.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {feature.image === 'invoicing' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-white font-medium">Invoice #2847</div>
                    <div className="text-sm text-white/40">Martinez Transport</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">$4,500</div>
                    <div className="text-xs text-green-400">Paid</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-white font-medium">Invoice #2848</div>
                    <div className="text-sm text-white/40">Pacific Freight</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">$3,200</div>
                    <div className="text-xs text-amber-400">Pending</div>
                  </div>
                </div>
              </div>
            )}

            {feature.image === 'app' && (
              <div className="flex justify-center py-4">
                <div className="w-48 bg-[#141414] rounded-3xl p-3 border border-white/10">
                  <div className="aspect-[9/16] bg-black rounded-2xl p-4 flex flex-col">
                    <div className="text-center mb-4">
                      <div className="text-xs text-white/40">Current Load</div>
                      <div className="text-sm text-white font-medium mt-1">LD-2847</div>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-xl mb-4" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0066FF] rounded-lg py-2 text-center text-xs text-white">
                        Update
                      </div>
                      <div className="bg-white/10 rounded-lg py-2 text-center text-xs text-white">
                        Upload
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Features() {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const titleInView = useInView(titleRef, { once: true, margin: '-100px' });

  return (
    <section id="features" ref={containerRef} className="relative">
      {/* Section Header */}
      <div className="container">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center py-32 max-w-3xl mx-auto"
        >
          <span className="text-sm font-medium text-[#0066FF] uppercase tracking-wide mb-4 block">
            Features
          </span>
          <h2 className="text-headline text-white mb-6">
            Everything you need.
            <br />
            <span className="text-white/40">Nothing you don't.</span>
          </h2>
          <p className="text-body-lg text-white/50">
            Built from the ground up for modern trucking companies.
          </p>
        </motion.div>
      </div>

      {/* Feature Items */}
      <div className="container">
        {features.map((feature, index) => (
          <FeatureItem key={feature.label} feature={feature} index={index} />
        ))}
      </div>

      {/* Additional Features Grid */}
      <div className="container py-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, label: 'Compliance', desc: 'ELD integration & DOT ready' },
            { icon: Zap, label: 'Fast', desc: 'Built with modern tech' },
            { icon: Receipt, label: 'IFTA', desc: 'Automated reporting' },
            { icon: Truck, label: 'Fleet', desc: 'Manage all assets' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors"
            >
              <item.icon className="w-6 h-6 text-[#0066FF] mb-4" />
              <div className="text-white font-medium mb-1">{item.label}</div>
              <div className="text-sm text-white/40">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
