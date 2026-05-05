import { motion } from 'framer-motion';

const HERO_IMAGE = 'https://media.base44.com/images/public/69d9cffa1797baa333fd5460/d7cbf22e9_generated_b7ca9679.png';

export default function HeroSection() {
  const scrollToContact = () => {
    const el = document.querySelector('#contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex">
      {/* Left — Typography Stack */}
      <div className="relative z-10 flex flex-col justify-center px-[6vw] md:px-[8vw] py-32 w-full lg:w-1/2">
        {/* Decorative ledger line */}
        <div className="absolute left-[4vw] md:left-[6vw] top-32 bottom-32 w-px bg-basalt/30" aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="ml-4 md:ml-8">
          
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-8">Chartered Accountants · Est.2024 Nepal

          </p>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-chalk leading-[0.9] tracking-tight">
            <span className="block">M. Bista</span>
            <span className="block text-chalk/40 text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-2">
              &amp; Associates
            </span>
          </h1>

          <div className="mt-8 flex items-center gap-4">
            <div className="w-12 h-px bg-saffron" aria-hidden="true" />
            <p className="font-display text-lg md:text-xl text-chalk/50 italic">
              Chartered Accountants
            </p>
          </div>

          <p className="mt-10 font-body text-base md:text-lg text-chalk/50 max-w-md leading-relaxed tracking-tight">
            Unwavering precision in audit, taxation, and financial advisory.
            Building fiscal legacies across Nepal since inception.
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <button
              onClick={scrollToContact}
              className="font-body text-sm px-8 py-3.5 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 transition-all duration-300 min-h-[44px]">
              
              Request Consultation
            </button>
            <button
              onClick={() => {
                const el = document.querySelector('#services');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="font-body text-sm px-8 py-3.5 border border-chalk/20 text-chalk/70 hover:border-saffron hover:text-saffron transition-all duration-300 tracking-wider uppercase min-h-[44px]">
              
              Our Practice
            </button>
          </div>
        </motion.div>
      </div>

      {/* Right — Hero Image */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0">
          
          <img
            src={HERO_IMAGE}
            alt="Himalayan mountain peaks at dawn with golden sunlight"
            className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/30 to-background" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>

        {/* Overlay stats */}
        <div className="absolute bottom-16 right-12 z-10">
          <div className="flex gap-10">
            <div className="text-right">
              <p className="font-display text-4xl text-chalk font-light">3+</p>
              <p className="font-body text-xs text-chalk/40 uppercase tracking-widest mt-1">Years</p>
            </div>
            <div className="w-px bg-basalt/50" aria-hidden="true" />
            <div className="text-right">
              <p className="font-display text-4xl text-chalk font-light">50+</p>
              <p className="font-body text-xs text-chalk/40 uppercase tracking-widest mt-1">Clients</p>
            </div>
            <div className="w-px bg-basalt/50" aria-hidden="true" />
            <div className="text-right">
              <p className="font-display text-4xl text-chalk font-light">100%</p>
              <p className="font-body text-xs text-chalk/40 uppercase tracking-widest mt-1">Integrity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile stats bar */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="flex justify-around py-5 px-[6vw]">
          {[
          { val: '15+', label: 'Years' },
          { val: '500+', label: 'Clients' },
          { val: '100%', label: 'Integrity' }].
          map((s) =>
          <div key={s.label} className="text-center">
              <p className="font-display text-2xl text-chalk font-light">{s.val}</p>
              <p className="font-body text-[10px] text-chalk/40 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          )}
        </div>
      </div>
    </section>);

}