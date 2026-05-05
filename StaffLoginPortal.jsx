import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import ServicesPillars from '../components/ServicesPillars';
import TimelineSection from '../components/TimelineSection';
import ContactGateway from '../components/ContactGateway';
import TestimonialsSection from '../components/TestimonialsSection';
import InsightsSection from '../components/InsightsSection';
import TeamSection from '../components/TeamSection';
import PurchaseService from '../components/PurchaseService';
import Footer from '../components/Footer.jsx';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div className="w-full h-px bg-border" aria-hidden="true" />
      <ServicesPillars />
      <div className="w-full h-px bg-border" aria-hidden="true" />
      <TimelineSection />
      <div className="w-full h-px bg-border" aria-hidden="true" />
      <TestimonialsSection />
      <div className="w-full h-px bg-border" aria-hidden="true" />
      <TeamSection />
      <div className="w-full h-px bg-border" aria-hidden="true" />
      <InsightsSection />
      <div className="w-full h-px bg-border" aria-hidden="true" />
      <PurchaseService />
      <div className="w-full h-px bg-border" aria-hidden="true" />
      <ContactGateway />
      <Footer />
    </div>
  );
}