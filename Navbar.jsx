import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, MessageSquare, Send, ArrowRight } from 'lucide-react';

const services = [
  {
    id: 'audit-basic',
    name: 'Statutory Audit',
    category: 'Audit & Assurance',
    description: 'Full statutory audit for small to medium enterprises, compliant with Nepal Accounting Standards and ICAAN requirements.',
    standardFee: 85000,
    currency: 'NPR',
    duration: '2–3 weeks',
    includes: ['Financial statement audit', 'Management letter', 'Audit opinion', 'IRD compliance review'],
  },
  {
    id: 'tax-advisory',
    name: 'Tax Advisory Package',
    category: 'Tax Advisory',
    description: 'Annual corporate tax planning, filing, and compliance management including VAT returns and advance tax calculations.',
    standardFee: 60000,
    currency: 'NPR',
    duration: 'Annual retainer',
    includes: ['Corporate tax filing', 'VAT compliance', 'Advance tax schedule', 'IRD correspondence'],
  },
  {
    id: 'financial-advisory',
    name: 'Financial Advisory',
    category: 'Financial Advisory',
    description: 'Strategic financial consulting including business valuation, due diligence, and restructuring recommendations.',
    standardFee: 120000,
    currency: 'NPR',
    duration: 'Project-based',
    includes: ['Business valuation report', 'Due diligence review', 'Financial model', 'Advisory memo'],
  },
  {
    id: 'internal-audit',
    name: 'Internal Audit',
    category: 'Audit & Assurance',
    description: 'Comprehensive internal audit covering risk assessment, control evaluation, and compliance across all business functions.',
    standardFee: 70000,
    currency: 'NPR',
    duration: '1–2 weeks',
    includes: ['Risk assessment', 'Control testing', 'Process review', 'Recommendations report'],
  },
];

const categoryColors = {
  'Audit & Assurance': 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  'Tax Advisory': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  'Financial Advisory': 'text-violet-400 border-violet-400/30 bg-violet-400/5',
};

function NegotiateModal({ service, onClose }) {
  const [proposedFee, setProposedFee] = useState('');
  const [reason, setReason] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!proposedFee || !contact) return;
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.35 }}
        className="relative bg-background border border-border w-full max-w-lg p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-saffron" aria-hidden="true" />

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-2 border-saffron flex items-center justify-center mx-auto mb-5">
              <Check className="w-5 h-5 text-saffron" />
            </div>
            <h3 className="font-display text-2xl text-chalk font-light mb-3">Proposal Submitted</h3>
            <p className="font-body text-sm text-chalk/40 leading-relaxed mb-6">
              Thank you. Our team will review your fee proposal for <span className="text-chalk/70">{service.name}</span> and respond within 24 hours.
            </p>
            <button onClick={onClose} className="font-body text-sm px-6 py-2.5 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[44px]">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <p className="font-body text-xs tracking-[0.25em] uppercase text-saffron mb-2">Fee Renegotiation</p>
              <h3 className="font-display text-2xl text-chalk font-light">{service.name}</h3>
              <p className="font-body text-sm text-chalk/40 mt-1">
                Standard fee: <span className="text-chalk/70">{service.currency} {service.standardFee.toLocaleString()}</span>
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">
                  Your Proposed Fee (NPR) <span className="text-saffron">*</span>
                </label>
                <input
                  type="number"
                  value={proposedFee}
                  onChange={e => setProposedFee(e.target.value)}
                  placeholder="e.g. 65000"
                  className="w-full bg-transparent border-b border-basalt/30 py-2.5 font-body text-base text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors"
                />
                {proposedFee && Number(proposedFee) < service.standardFee && (
                  <p className="font-body text-xs text-amber-400/70 mt-1.5">
                    {Math.round((1 - Number(proposedFee) / service.standardFee) * 100)}% below standard rate
                  </p>
                )}
              </div>

              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">
                  Reason / Context
                </label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Briefly describe your budget constraints, business size, or scope adjustments..."
                  rows={3}
                  className="w-full bg-transparent border-b border-basalt/30 py-2.5 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">
                  Contact Email <span className="text-saffron">*</span>
                </label>
                <input
                  type="email"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-transparent border-b border-basalt/30 py-2.5 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={handleSubmit}
                disabled={!proposedFee || !contact}
                className="flex items-center gap-2 font-body text-sm px-6 py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                Submit Proposal
              </button>
              <button
                onClick={onClose}
                className="font-body text-sm px-5 py-3 border border-basalt/30 text-chalk/40 hover:text-chalk hover:border-basalt/60 transition-all min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function ServiceCard({ service, onNegotiate, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group relative border border-border hover:border-basalt/50 bg-background transition-all duration-500 flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-px bg-saffron scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" aria-hidden="true" />

      <div className="p-7 md:p-8 flex-1">
        <div className="flex items-start justify-between mb-5">
          <span className={`font-body text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 border ${categoryColors[service.category]}`}>
            {service.category}
          </span>
          <span className="font-body text-xs text-chalk/30">{service.duration}</span>
        </div>

        <h3 className="font-display text-2xl text-chalk font-light mb-3">{service.name}</h3>
        <p className="font-body text-sm text-chalk/40 leading-relaxed mb-6">{service.description}</p>

        {/* Price display */}
        <div className="mb-6 pb-6 border-b border-basalt/20">
          <p className="font-body text-xs tracking-widest uppercase text-chalk/25 mb-1">Standard Fee</p>
          <p className="font-display text-3xl text-chalk font-light">
            {service.currency} {service.standardFee.toLocaleString()}
          </p>
          <p className="font-body text-xs text-chalk/30 mt-1">Exclusive of government levies & taxes</p>
        </div>

        {/* Includes toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 font-body text-xs text-chalk/40 hover:text-saffron transition-colors mb-1 w-full text-left"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          What's included
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden mt-3"
            >
              {service.includes.map(item => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check className="w-3 h-3 text-saffron/60 flex-shrink-0" />
                  <span className="font-body text-xs text-chalk/40">{item}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* CTA Buttons */}
      <div className="p-7 md:p-8 pt-0 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onSelect(service)}
          className="flex-1 flex items-center justify-center gap-2 font-body text-sm py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 transition-all min-h-[44px]"
        >
          Engage Now
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNegotiate(service)}
          className="flex-1 flex items-center justify-center gap-2 font-body text-sm py-3 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[44px]"
        >
          <MessageSquare className="w-4 h-4" />
          Negotiate Fee
        </button>
      </div>
    </div>
  );
}

export default function PurchaseService() {
  const [negotiatingService, setNegotiatingService] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const handleSelect = (service) => {
    setSelectedService(service);
    setTimeout(() => {
      const el = document.querySelector('#contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <section id="purchase" className="relative py-24 md:py-32">
      <div className="px-[6vw] md:px-[8vw]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px bg-saffron" aria-hidden="true" />
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron">
            Engage Our Services
          </p>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-5">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-chalk font-light">
            Service Packages
          </h2>
          <p className="font-body text-sm text-chalk/40 max-w-xs lg:text-right">
            Standard fees are benchmarked to ICAAN guidelines. All engagements are open to negotiation.
          </p>
        </div>
        <div className="flex items-center gap-3 mb-14 md:mb-16 p-4 border border-saffron/20 bg-saffron/5 max-w-xl">
          <MessageSquare className="w-4 h-4 text-saffron flex-shrink-0" />
          <p className="font-body text-xs text-chalk/50 leading-relaxed">
            All quoted fees are indicative. We encourage clients to discuss their specific scope, scale, and budget — every engagement is negotiable.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onNegotiate={setNegotiatingService}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Note */}
        <p className="font-body text-xs text-chalk/20 text-center mt-10">
          All fees quoted in Nepalese Rupees (NPR). Government taxes applicable as per prevailing rates. Fees are subject to formal engagement letter.
        </p>
      </div>

      {/* Negotiate Modal */}
      <AnimatePresence>
        {negotiatingService && (
          <NegotiateModal service={negotiatingService} onClose={() => setNegotiatingService(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}