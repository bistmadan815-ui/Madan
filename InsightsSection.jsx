import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const ABOUT_IMAGE = 'https://media.base44.com/images/public/69d9cffa1797baa333fd5460/a64210d98_generated_d10f4fc6.png';

const milestones = [
  {
    year: '2009',
    title: 'Foundation',
    description: 'M. Bista and Associates established in Kathmandu, rooted in a commitment to uncompromising integrity and professional excellence.',
  },
  {
    year: '2013',
    title: 'Tax Advisory Launch',
    description: 'Expanded into comprehensive tax advisory services, helping businesses navigate Nepal\'s evolving fiscal landscape.',
  },
  {
    year: '2017',
    title: 'Regional Expansion',
    description: 'Extended practice to serve clients across all provinces of Nepal, bringing institutional-grade services to emerging markets.',
  },
  {
    year: '2020',
    title: 'Digital Transformation',
    description: 'Adopted cutting-edge audit technologies and digital reporting frameworks, setting new benchmarks for the profession in Nepal.',
  },
  {
    year: '2024',
    title: 'International Standards',
    description: 'Aligned all practice methodologies with IFRS and ISA standards, establishing cross-border advisory capabilities.',
  },
];

function MilestoneItem({ milestone, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1 }}
      className={`relative flex items-start gap-6 md:gap-12 ${
        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
    >
      {/* Content */}
      <div className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
        <p className="font-display text-3xl md:text-4xl text-chalk/15 font-light mb-2">
          {milestone.year}
        </p>
        <h3 className="font-display text-xl md:text-2xl text-chalk font-light mb-3">
          {milestone.title}
        </h3>
        <p className="font-body text-sm text-chalk/40 leading-relaxed max-w-sm inline-block">
          {milestone.description}
        </p>
      </div>

      {/* Center dot */}
      <div className="hidden md:flex flex-col items-center flex-shrink-0">
        <div className="w-3 h-3 border border-saffron bg-background rounded-full relative z-10" />
      </div>

      {/* Spacer for opposite side */}
      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
}

export default function TimelineSection() {
  return (
    <section id="about" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true">
        <img src={ABOUT_IMAGE} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="relative px-[6vw] md:px-[8vw]">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px bg-saffron" aria-hidden="true" />
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron">
            The Transparency Ledger
          </p>
        </div>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-chalk font-light mb-6">
          Our Journey
        </h2>
        <p className="font-body text-base text-chalk/40 max-w-xl mb-16 md:mb-24">
          A chronicle of disciplined growth, unwavering principles, and the relentless pursuit
          of excellence in service to our clients and community.
        </p>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-20 md:mb-28">
          {[
            { title: 'Integrity', text: 'Truth is the bedrock of every audit opinion, every advisory recommendation, every relationship we build.' },
            { title: 'Precision', text: 'In the mathematics of trust, there is no room for approximation. Every figure, every disclosure, every conclusion is exact.' },
            { title: 'Ascent', text: 'We do not maintain standards—we elevate them. Continuous growth for our team, our clients, and our profession.' },
          ].map((v) => (
            <div key={v.title} className="relative pl-6 border-l border-basalt/30">
              <h3 className="font-display text-xl text-chalk mb-3">{v.title}</h3>
              <p className="font-body text-sm text-chalk/40 leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Central vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-basalt/20 -translate-x-1/2" aria-hidden="true" />

          <div className="space-y-12 md:space-y-16">
            {milestones.map((m, i) => (
              <MilestoneItem key={m.year} milestone={m} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}