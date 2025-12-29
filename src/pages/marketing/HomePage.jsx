import { useEffect } from 'react';
import '../../styles/marketing.css';

// Components
import { Navbar } from '../../components/marketing/Navbar';
import { Hero } from '../../components/marketing/Hero';
import { Features } from '../../components/marketing/Features';
import { Pricing } from '../../components/marketing/Pricing';
import { Testimonials } from '../../components/marketing/Testimonials';
import { FAQ } from '../../components/marketing/FAQ';
import { CTA } from '../../components/marketing/CTA';
import { Footer } from '../../components/marketing/Footer';

export function HomePage() {
  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="marketing-page">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

export default HomePage;
