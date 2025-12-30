import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { LayoutDashboard, Truck, Receipt, Smartphone, Shield, Zap, Mail, MessageSquare, UserPlus, Sparkles, ArrowRight, Bot } from 'lucide-react';

// AI Teammates Data
const aiTeammates = [
  {
    name: 'ALEX',
    role: 'Email Assistant',
    description: 'Converts emails into load orders. Extracts rate confirmations and creates loads automatically.',
    icon: Mail,
    color: '#0066FF',
    status: 'available'
  },
  {
    name: 'NOVA',
    role: 'Dispatch Assistant',
    description: 'Smart driver-load matching with real-time availability insights and route optimization.',
    icon: MessageSquare,
    color: '#10B981',
    status: 'available'
  },
  {
    name: 'SAGE',
    role: 'Onboarding Partner',
    description: 'Helps new team members get up to speed fast with interactive training.',
    icon: UserPlus,
    color: '#8B5CF6',
    status: 'coming_soon'
  }
];

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

      {/* AI Teammates Section */}
      <div className="container py-32">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6]/20 to-[#0066FF]/20 border border-[#8B5CF6]/30 mb-6">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-sm font-medium text-white">AI-Powered</span>
          </div>
          <h2 className="text-headline text-white mb-4">
            Meet your AI teammates
          </h2>
          <p className="text-body-lg text-white/50 max-w-2xl mx-auto">
            Intelligent assistants that work alongside your team to automate repetitive tasks and boost productivity.
          </p>
        </motion.div>

        {/* ALEX - Email Assistant */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-2 gap-16 items-center py-20"
        >
          {/* Visual - Left */}
          <div className="relative">
            <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.15)_0%,transparent_70%)]" />
            <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 shadow-2xl">
              {/* Email Interface Mock */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <Mail className="w-5 h-5 text-[#0066FF]" />
                  <span className="text-sm text-white/60">Incoming Rate Confirmation</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-2">From: dispatch@broker.com</div>
                  <div className="text-sm text-white mb-3">Rate Con #RC-4521 - Chicago to Dallas</div>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-[#0066FF]/20 text-[#0066FF]">$3,200</span>
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">1,200 mi</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Bot className="w-4 h-4 text-[#0066FF]" />
                  <span className="text-xs text-[#0066FF]">ALEX extracted load details</span>
                </div>
                <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-2">Auto-created Load</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">LD-2847</div>
                      <div className="text-xs text-white/40">Chicago → Dallas</div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content - Right */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#0066FF]/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#0066FF]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">ALEX</h3>
                <span className="text-sm text-[#0066FF]">Email Assistant</span>
              </div>
              <span className="ml-auto text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">Available</span>
            </div>
            <p className="text-body-lg text-white/50 leading-relaxed mb-6">
              ALEX monitors your inbox 24/7, automatically extracting rate confirmations and converting them into ready-to-dispatch loads. No more manual data entry or missed opportunities.
            </p>
            <ul className="space-y-3">
              {['Extracts load details from emails', 'Creates loads automatically', 'Captures rate confirmation data'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* NOVA - Dispatch Assistant */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-2 gap-16 items-center py-20"
        >
          {/* Content - Left */}
          <div className="md:order-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">NOVA</h3>
                <span className="text-sm text-[#10B981]">Dispatch Assistant</span>
              </div>
              <span className="ml-auto text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">Available</span>
            </div>
            <p className="text-body-lg text-white/50 leading-relaxed mb-6">
              NOVA analyzes driver availability, location, and preferences to suggest the perfect match for every load. Smart dispatching that maximizes efficiency and driver satisfaction.
            </p>
            <ul className="space-y-3">
              {['Smart driver-load matching', 'Real-time availability tracking', 'Route optimization suggestions'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual - Right */}
          <div className="md:order-1 relative">
            <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)]" />
            <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 shadow-2xl">
              {/* Dispatch Matching Mock */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <Truck className="w-5 h-5 text-[#10B981]" />
                  <span className="text-sm text-white/60">Driver Matching</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-2">Load: Chicago → Dallas</div>
                  <div className="text-sm text-white">Finding best driver match...</div>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Mike Johnson', score: 98, location: '12 mi away' },
                    { name: 'Sarah Kim', score: 94, location: '28 mi away' },
                    { name: 'John Davis', score: 87, location: '45 mi away' },
                  ].map((driver, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-[#10B981]/10 border border-[#10B981]/20' : 'bg-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className={`text-sm ${i === 0 ? 'text-white font-medium' : 'text-white/60'}`}>{driver.name}</div>
                          <div className="text-xs text-white/40">{driver.location}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${i === 0 ? 'text-[#10B981]' : 'text-white/40'}`}>{driver.score}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SAGE - Onboarding Partner */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-2 gap-16 items-center py-20"
        >
          {/* Visual - Left */}
          <div className="relative">
            <div className="absolute -inset-10 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)]" />
            <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 shadow-2xl">
              {/* Onboarding Mock */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <UserPlus className="w-5 h-5 text-[#8B5CF6]" />
                  <span className="text-sm text-white/60">New Team Member Onboarding</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                      <span className="text-sm text-[#8B5CF6]">JD</span>
                    </div>
                    <div>
                      <div className="text-sm text-white">Jane Doe</div>
                      <div className="text-xs text-white/40">Started today</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Onboarding Progress</span>
                      <span className="text-[#8B5CF6]">45%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-[45%] bg-gradient-to-r from-[#8B5CF6] to-[#0066FF] rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { task: 'Complete profile setup', done: true },
                    { task: 'Watch intro video', done: true },
                    { task: 'Create first load', done: false },
                    { task: 'Assign a driver', done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-[#8B5CF6]' : 'border border-white/20'}`}>
                        {item.done && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={`text-sm ${item.done ? 'text-white/40 line-through' : 'text-white/60'}`}>{item.task}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content - Right */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">SAGE</h3>
                <span className="text-sm text-[#8B5CF6]">Onboarding Partner</span>
              </div>
              <span className="ml-auto text-xs px-3 py-1 rounded-full bg-white/10 text-white/60">Coming Soon</span>
            </div>
            <p className="text-body-lg text-white/50 leading-relaxed mb-6">
              SAGE guides new team members through interactive training, helping them get up to speed fast. Personalized learning paths ensure everyone masters the system quickly.
            </p>
            <ul className="space-y-3">
              {['Interactive training guides', 'Progress tracking dashboard', 'Personalized learning paths'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white/60">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* CTA to AI Page */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center pt-12"
        >
          <Link
            to="/ai"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#0066FF] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Learn more about AI
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
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
