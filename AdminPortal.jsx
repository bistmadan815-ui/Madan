import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TeamGrid from '../components/TeamGrid';

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <div className="px-[6vw] md:px-[8vw] pt-8 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-body text-sm text-chalk/40 hover:text-saffron transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="px-[6vw] md:px-[8vw] py-12 md:py-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px bg-saffron" aria-hidden="true" />
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron">The Associates</p>
        </div>
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-chalk font-light mb-6">
          Meet Our Team
        </h1>
        <p className="font-body text-base text-chalk/40 max-w-xl mb-16 leading-relaxed">
          Behind every audit opinion and advisory recommendation stands a team of chartered
          professionals whose expertise defines the standard of our practice.
        </p>

        <TeamGrid />

        {/* Recruitment CTA */}
        <div className="mt-20 border border-basalt/30 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-chalk font-light mb-2">
              Join Our Practice
            </h2>
            <p className="font-body text-sm text-chalk/40 max-w-sm">
              We are always seeking exceptional professionals who hold integrity above all else.
            </p>
          </div>
          <a
            href="mailto:careers@mbista.com.np"
            className="font-body text-sm px-8 py-3.5 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 transition-all duration-300 min-h-[44px] flex items-center whitespace-nowrap"
          >
            Send Your CV
          </a>
        </div>
      </div>
    </div>
  );
}