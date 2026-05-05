import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, BarChart3, FileText } from 'lucide-react';

const SERVICES_IMAGE = 'https://media.base44.com/images/public/69d9cffa1797baa333fd5460/e7c26ac89_generated_8abe0b5e.png';

const services = [
{
  icon: Shield,
  number: '01',
  title: 'Audit & Assurance',
  subtitle: 'The Foundation of Trust',
  description:
  'Statutory audits, internal audits, forensic investigations, and compliance reviews conducted with the highest standards of professional skepticism and diligence.',
  items: ['Statutory Audit', 'Internal Audit', 'Forensic Audit', 'Due Diligence Reviews']
},
{
  icon: FileText,
  number: '02',
  title: 'Tax Advisory',
  subtitle: 'Strategic Fiscal Navigation',
  description:
  'Comprehensive tax planning, compliance, and advisory services that navigate Nepal\'s evolving regulatory landscape while maximizing your fiscal position.',
  items: ['Corporate Tax Planning', 'VAT Compliance', 'Transfer Pricing', 'Tax Dispute Resolution']
},
{
  icon: BarChart3,
  number: '03',
  title: 'Financial Advisory',
  subtitle: 'The Ascent of Wealth',
  description:
  'Strategic financial consulting, business valuations, restructuring guidance, and wealth management that builds enduring prosperity.',
  items: ['Business Valuation', 'M&A Advisory', 'Financial Restructuring', 'Risk Management']
}];


export default function ServicesPillars() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <section id="services" className="relative py-24 md:py-32">
      <div className="px-[6vw] md:px-[8vw]">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px bg-saffron" aria-hidden="true" />
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron">
            Practice Areas
          </p>
        </div>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-chalk font-light mb-4">Our Pillars of Expertise

        </h2>
        <p className="font-body text-base text-chalk/40 max-w-xl mb-16 md:mb-20">
          Three disciplines, one unified standard of excellence. Each practice is a monolith of
          precision built upon decades of institutional knowledge.
        </p>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border/30">
          {services.map((service, i) => {
            const Icon = service.icon;
            const isHovered = hoveredIndex === i;

            return (
              <motion.div
                key={service.number}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative group bg-background p-8 md:p-10 lg:p-12 cursor-default"
                initial={false}
                animate={{
                  backgroundColor: isHovered ? 'hsl(217 33% 15%)' : 'hsl(222 47% 11%)'
                }}
                transition={{ duration: 0.5 }}>
                
                {/* Top accent line */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-px bg-saffron origin-left"
                  initial={false}
                  animate={{ scaleX: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  aria-hidden="true" />
                

                <div className="flex items-start justify-between mb-8">
                  <span className="font-display text-5xl text-chalk/10 font-light">
                    {service.number}
                  </span>
                  <Icon className="w-5 h-5 text-saffron mt-2" />
                </div>

                <h3 className="font-display text-2xl md:text-3xl text-chalk font-light mb-2">
                  {service.title}
                </h3>
                <p className="font-display text-sm italic text-saffron/70 mb-6">
                  {service.subtitle}
                </p>
                <p className="font-body text-sm text-chalk/50 leading-relaxed mb-8">
                  {service.description}
                </p>

                {/* Service items */}
                <ul className="space-y-3">
                  {service.items.map((item) =>
                  <li key={item} className="flex items-center gap-3">
                      <div className="w-1 h-1 bg-saffron/60 rounded-full flex-shrink-0" aria-hidden="true" />
                      <span className="font-body text-sm text-chalk/40">{item}</span>
                    </li>
                  )}
                </ul>

                {/* Ledger line */}
                <div className="absolute right-0 top-12 bottom-12 w-px bg-basalt/20 hidden lg:block" aria-hidden="true" />
              </motion.div>);

          })}
        </div>
      </div>

      {/* Background image accent */}
      <div className="absolute top-0 right-0 w-1/3 h-64 opacity-5 overflow-hidden pointer-events-none hidden xl:block" aria-hidden="true">
        <img src={SERVICES_IMAGE} alt="" className="w-full h-full object-cover" />
      </div>
    </section>);

}