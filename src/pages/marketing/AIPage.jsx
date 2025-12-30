import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  ArrowRight,
  Mail,
  MessageSquare,
  UserPlus,
  Sparkles,
  Zap,
  Clock,
  TrendingUp,
  Star,
  CheckCircle2,
  Bot,
  FileText,
  Package
} from 'lucide-react';
import '../../styles/marketing.css';

import { Navbar } from '../../components/marketing/Navbar';
import { Footer } from '../../components/marketing/Footer';

// AI Teammate Data
const aiTeammates = [
  {
    name: 'ALEX',
    role: 'Email Assistant',
    description: 'Converts emails into load orders automatically. Extracts rate confirmations, syncs documents, and updates your TMS in seconds.',
    icon: Mail,
    color: '#0066FF',
    features: [
      'Auto-parse rate confirmations from emails',
      'Extract shipper, consignee, and rate details',
      'Create loads with one click',
      'Sync attachments to load documents'
    ],
    status: 'available'
  },
  {
    name: 'NOVA',
    role: 'Dispatch Assistant',
    description: 'Your AI co-pilot for dispatching. Get instant load recommendations, driver availability, and route optimization suggestions.',
    icon: MessageSquare,
    color: '#10B981',
    features: [
      'Smart driver-load matching',
      'Real-time availability insights',
      'Route optimization suggestions',
      'Proactive delay alerts'
    ],
    status: 'available'
  },
  {
    name: 'SAGE',
    role: 'Onboarding Partner',
    description: 'Helps new team members get up to speed fast. Answers questions, provides training, and guides users through the platform.',
    icon: UserPlus,
    color: '#8B5CF6',
    features: [
      'Interactive platform walkthrough',
      'Answer questions in natural language',
      'Role-based training paths',
      'Best practices recommendations'
    ],
    status: 'coming_soon'
  }
];

// Stats Data
const stats = [
  { value: '10,000+', label: 'Loads processed with AI', icon: Package },
  { value: '85%', label: 'Time saved on data entry', icon: Clock },
  { value: '99.2%', label: 'Extraction accuracy', icon: CheckCircle2 },
  { value: '4.9/5', label: 'User satisfaction', icon: Star }
];

// Testimonials
const testimonials = [
  {
    quote: "ALEX has completely transformed how we process rate cons. What used to take 15 minutes now takes 15 seconds.",
    author: "Marcus Johnson",
    role: "Operations Manager",
    company: "Swift Logistics LLC"
  },
  {
    quote: "The AI features feel like having an extra team member who never sleeps. Our dispatchers can focus on relationships instead of data entry.",
    author: "Sarah Chen",
    role: "Fleet Manager",
    company: "Alpine Transport"
  },
  {
    quote: "I was skeptical at first, but the accuracy is incredible. It catches details I would have missed.",
    author: "David Rodriguez",
    role: "Owner Operator",
    company: "DRod Trucking"
  }
];

// Hero Section
function AIHero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Purple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0f0620] to-black" />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[#8B5CF6]/20 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#0066FF]/20 blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="container relative z-10 pt-[160px] pb-[100px]"
        style={{ y, opacity }}
      >
        <div className="max-w-[900px] mx-auto text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#A78BFA] text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI-Powered TMS
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-display mb-6"
          >
            <span className="text-white">Make your team</span>
            <br />
            <span className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#0066FF] bg-clip-text text-transparent">
              Superhuman
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-body-lg text-white/60 max-w-[600px] mx-auto mb-10"
          >
            With a TMS that understands your business, AI can handle the busywork
            while your team focuses on what matters — building relationships and growing revenue.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link to="/signup" className="btn-primary group">
              Try AI Features Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="btn-secondary">
              Watch Demo
            </button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 text-sm text-white/40"
          >
            No credit card required · AI features included in all plans
          </motion.p>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white/60"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

// AI Teammates Section
function AITeammates() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-black" />

      <div className="container relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-[#0066FF] text-sm font-medium tracking-wide uppercase mb-4">
            <Bot className="w-4 h-4" />
            Meet Your AI Teammates
          </span>
          <h2 className="text-headline text-white mb-4">
            AI assistants that work for you
          </h2>
          <p className="text-body-lg text-white/60 max-w-[600px] mx-auto">
            Each AI teammate specializes in a different area, helping your team
            accomplish more with less effort.
          </p>
        </motion.div>

        {/* AI Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {aiTeammates.map((teammate, index) => {
            const Icon = teammate.icon;
            return (
              <motion.div
                key={teammate.name}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.15 }}
                className="group relative"
              >
                <div className="relative h-full bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-8 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06]">
                  {/* Glow effect on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${teammate.color}20, transparent 70%)`
                    }}
                  />

                  {/* Status badge */}
                  {teammate.status === 'coming_soon' && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 rounded-full bg-white/10 text-white/60 text-xs font-medium">
                        Coming Soon
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${teammate.color}20` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: teammate.color }} />
                  </div>

                  {/* Name & Role */}
                  <h3 className="text-2xl font-bold text-white mb-1">{teammate.name}</h3>
                  <p className="text-sm font-medium mb-4" style={{ color: teammate.color }}>
                    {teammate.role}
                  </p>

                  {/* Description */}
                  <p className="text-white/60 mb-6 leading-relaxed">
                    {teammate.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3">
                    {teammate.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/50">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: teammate.color }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Stats Section
function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-20 overflow-hidden">
      {/* Purple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a2e] via-[#0f0620] to-[#1a0a2e]" />

      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[#8B5CF6]/10 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#0066FF]/10 blur-[80px]" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-headline text-white mb-4">
            Trusted by growing fleets
          </h2>
          <p className="text-body text-white/60">
            See the impact AI is having on trucking operations
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <Icon className="w-8 h-8 text-[#8B5CF6] mx-auto mb-4" />
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-black" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-[#0066FF] text-sm font-medium tracking-wide uppercase mb-4">
            <Star className="w-4 h-4" />
            Customer Stories
          </span>
          <h2 className="text-headline text-white">
            What our users are saying
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="relative p-8 rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent border border-white/10"
            >
              {/* Quote */}
              <div className="text-4xl text-[#8B5CF6]/30 font-serif mb-4">"</div>
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                {testimonial.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#0066FF] flex items-center justify-center text-white font-bold">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-white">{testimonial.author}</div>
                  <div className="text-sm text-white/50">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function AICTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0f0620] to-black" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#8B5CF6]/10 blur-[150px]"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-[700px] mx-auto text-center"
        >
          <Zap className="w-12 h-12 text-[#8B5CF6] mx-auto mb-6" />
          <h2 className="text-headline text-white mb-6">
            Ready to supercharge your operations?
          </h2>
          <p className="text-body-lg text-white/60 mb-10">
            Join hundreds of trucking companies using AI to save time, reduce errors,
            and grow their business faster.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="btn-primary group">
              Start Free Trial
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className="btn-secondary">
              Log In
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/40">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Main Page Component
export function AIPage() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="marketing-page">
      <Navbar />
      <AIHero />
      <AITeammates />
      <StatsSection />
      <TestimonialsSection />
      <AICTA />
      <Footer />
    </div>
  );
}

export default AIPage;
