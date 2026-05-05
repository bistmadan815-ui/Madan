import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
{
  quote:
  "M. Bista and Associates redefined what we expected from an audit firm. Their forensic attention to detail and unwavering professional skepticism gave our board complete confidence in our financial statements.",
  name: "Rajendra Shrestha",
  title: "Chief Financial Officer",
  company: "Himalayan Infrastructure Group",
  tenure: "Client since 2016"
},
{
  quote:
  "Their tax advisory team navigated Nepal's evolving fiscal regulations with a precision that saved our company millions in compliance costs. They don't just know the rules—they anticipate them.",
  name: "Sunita Maharjan",
  title: "Managing Director",
  company: "Kathmandu Trade & Commerce Ltd.",
  tenure: "Client since 2018"
},
{
  quote:
  "During our M&A transaction, M. Bista's due diligence was thorough beyond measure. Every disclosure, every valuation figure was verified with the rigor you'd expect from an international-grade firm.",
  name: "Bikram Thapa",
  title: "Chairman",
  company: "Summit Holdings Nepal",
  tenure: "Client since 2020"
},
{
  quote:
  "We've worked with several accounting firms across South Asia. None match the intellectual integrity and client dedication that M. Bista and Associates brings to every engagement.",
  name: "Priya Adhikari",
  title: "Group Finance Director",
  company: "Pokhara Energy Consortium",
  tenure: "Client since 2019"
},
{
  quote:
  "Their statutory audit process is transparent, efficient, and leaves absolutely no ambiguity. For a publicly listed company, that assurance is invaluable. We trust them completely.",
  name: "Deepak Karki",
  title: "CEO",
  company: "Nepal Capital Markets Ltd.",
  tenure: "Client since 2014"
}];


export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = (dir) => {
    setDirection(dir);
    setActive((prev) => (prev + dir + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = setInterval(() => go(1), 6000);
    return () => clearInterval(timer);
  }, []);

  const current = testimonials[active];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Decorative ledger lines */}
      <div className="absolute left-[8vw] top-16 bottom-16 w-px bg-basalt/15" aria-hidden="true" />
      <div className="absolute right-[8vw] top-16 bottom-16 w-px bg-basalt/15" aria-hidden="true" />

      <div className="px-[6vw] md:px-[8vw]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px bg-saffron" aria-hidden="true" />
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron">
            Client Endorsements
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-20">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-chalk font-light">
            Voices of Trust
          </h2>
          <p className="font-body text-sm text-chalk/40 max-w-xs">
            The measure of our work is heard in the words of those we serve.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Quote icon */}
          <div className="mb-8 md:mb-10">
            <Quote className="w-8 h-8 text-saffron/40" aria-hidden="true" />
          </div>

          {/* Animated quote */}
          <div className="min-h-[160px] md:min-h-[120px] relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.blockquote
                key={active}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-xl md:text-2xl lg:text-3xl text-chalk font-light leading-snug">
                
                "{current.quote}"
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="w-12 h-px bg-saffron/40 my-8" aria-hidden="true" />

          {/* Attribution */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active + '-attr'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              
              <div className="w-10 h-10 border border-saffron/30 flex items-center justify-center flex-shrink-0">
                <span className="font-display text-saffron text-sm">
                  {current.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="font-body text-sm text-chalk font-medium">{current.name}</p>
                <p className="font-body text-xs text-chalk/40 mt-0.5">
                  {current.title} · {current.company}
                </p>
              </div>
              <div className="sm:ml-auto">
                <span className="font-body text-xs tracking-widest uppercase text-basalt/60">
                  {current.tenure}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-6 mt-12">
            <button
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
              className="w-11 h-11 border border-basalt/30 flex items-center justify-center text-chalk/40 hover:border-saffron hover:text-saffron transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-saffron">
              
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next testimonial"
              className="w-11 h-11 border border-basalt/30 flex items-center justify-center text-chalk/40 hover:border-saffron hover:text-saffron transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-saffron">
              
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Progress dots */}
            <div className="flex items-center gap-2 ml-4" role="tablist" aria-label="Testimonial navigation">
              {testimonials.map((_, i) =>
              <button
                key={i}
                role="tab"
                aria-selected={i === active}
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => {setDirection(i > active ? 1 : -1);setActive(i);}}
                className="transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-saffron rounded-full min-w-[44px] min-h-[24px] flex items-center justify-center">
                
                  <span
                  className={`block rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 h-px bg-saffron' : 'w-2 h-px bg-basalt/40'}`
                  } />
                
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom stats strip */}
        <div className="mt-20 md:mt-24 pt-10 border-t border-basalt/20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
          { val: 'ICAAN', label: 'Member Firm' },
          { val: 'ISA', label: 'Compliant Audits' },
          { val: 'IFRS', label: 'Reporting Standards' },
          { val: 'AAA', label: 'WCAG Accessibility' }].
          map((s) =>
          <div key={s.label}>
              <p className="font-display text-2xl md:text-3xl text-chalk font-light mb-1">{s.val}</p>
              <p className="font-body text-xs text-chalk/30 uppercase tracking-widest">{s.label}</p>
            </div>
          )}
        </div>
      </div>
    </section>);

}