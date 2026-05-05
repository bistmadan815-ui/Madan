import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, ShieldCheck, Users, Briefcase } from 'lucide-react';

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'Team', href: '#team' },
  { label: 'Insights', href: '#insights' },
  { label: 'Contact', href: '#contact' },
];

const PORTAL_LINKS = [
  { href: '/admin-portal',  label: 'Admin Portal',  icon: ShieldCheck, color: 'border-amber-400/40 text-amber-400 hover:border-amber-400' },
  { href: '/staff-portal',  label: 'Staff Portal',  icon: Users,       color: 'border-basalt/40 text-chalk/60 hover:border-saffron hover:text-saffron' },
  { href: '/client-portal', label: 'Client Portal', icon: Briefcase,   color: 'border-saffron text-saffron hover:bg-saffron hover:text-background' },
];

function LoginDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative pl-4 border-l border-basalt/30">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 font-body text-xs px-4 py-2 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all uppercase tracking-wider min-h-[44px]">
        Login / Signup <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 top-full mt-2 w-52 bg-background border border-border shadow-xl z-50">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            {PORTAL_LINKS.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 font-body text-sm text-chalk/60 hover:text-saffron hover:bg-saffron/5 transition-colors border-b border-border last:border-0">
                <Icon className="w-4 h-4 flex-shrink-0" /> {label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-md border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="px-[4vw] md:px-[8vw] flex items-center justify-between h-16 md:h-20">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 border border-saffron flex items-center justify-center">
              <span className="font-display text-saffron text-sm font-semibold">MB</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-chalk text-sm tracking-wide">
                M. Bista &amp; Associates
              </span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="font-body text-sm text-chalk/60 hover:text-saffron transition-colors duration-300 tracking-wider uppercase"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('#contact')}
              className="font-body text-sm px-6 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all duration-300 tracking-wider uppercase min-h-[44px]"
            >
              Inquire
            </button>
            <LoginDropdown />
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-chalk p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-lg flex flex-col items-center justify-center gap-8 md:hidden"
          >
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="font-display text-3xl text-chalk hover:text-saffron transition-colors duration-300"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => scrollTo('#contact')}
              className="mt-4 font-body text-sm px-8 py-3 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all duration-300 tracking-wider uppercase min-h-[44px]"
            >
              Inquire Now
            </button>
            <div className="flex flex-col gap-3 mt-6 border-t border-basalt/30 pt-6 w-full px-8">
              {PORTAL_LINKS.map(({ href, label, icon: Icon, color }) => (
                <a key={href} href={href} className={`font-body text-xs px-6 py-2.5 border ${color} transition-all uppercase tracking-wider min-h-[44px] text-center flex items-center justify-center gap-2`}>
                  <Icon className="w-4 h-4" /> {label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}