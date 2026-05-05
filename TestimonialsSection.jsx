import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Mail, Phone, MapPin } from 'lucide-react';

const PAPER_IMAGE = 'https://media.base44.com/images/public/69d9cffa1797baa333fd5460/ac4cd8499_generated_4b441d46.png';

const steps = [
  {
    id: 'identity',
    label: 'Your Identity',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
      { name: 'organization', label: 'Organization', type: 'text', placeholder: 'Company or entity name' },
    ],
  },
  {
    id: 'inquiry',
    label: 'Nature of Inquiry',
    fields: [
      {
        name: 'service',
        label: 'Service Required',
        type: 'select',
        options: ['Audit & Assurance', 'Tax Advisory', 'Financial Advisory', 'General Consultation'],
      },
      { name: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com' },
    ],
  },
  {
    id: 'details',
    label: 'Details',
    fields: [
      { name: 'message', label: 'Brief Description', type: 'textarea', placeholder: 'Describe your requirements...' },
      { name: 'phone', label: 'Phone (Optional)', type: 'tel', placeholder: '+977-...' },
    ],
  },
];

export default function ContactGateway() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const progress = ((step + 1) / steps.length) * 100;
  const current = steps[step];

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const canProceed = current.fields.every((f) => {
    if (f.name === 'phone') return true; // optional
    return form[f.name]?.trim();
  });

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" aria-hidden="true">
        <img src={PAPER_IMAGE} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="relative px-[6vw] md:px-[8vw]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left — Info */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-px bg-saffron" aria-hidden="true" />
              <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron">
                Consultation Gateway
              </p>
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-chalk font-light mb-6">
              Begin Your<br />Engagement
            </h2>
            <p className="font-body text-base text-chalk/40 max-w-md mb-12 leading-relaxed">
              Every engagement begins with understanding. Complete the inquiry
              below, and a senior associate will respond within 24 hours.
            </p>

            <div className="space-y-6">
              {[
                { icon: MapPin, text: 'Kathmandu, Nepal' },
                { icon: Mail, text: 'info@mbista.com.np' },
                { icon: Phone, text: '+977-1-XXXXXXX' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-basalt/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-saffron" />
                  </div>
                  <span className="font-body text-sm text-chalk/50">{text}</span>
                </div>
              ))}
            </div>

            {/* Decorative ledger */}
            <div className="mt-12 hidden lg:block" aria-hidden="true">
              <div className="w-full h-px bg-basalt/20 mb-4" />
              <div className="w-3/4 h-px bg-basalt/10 mb-4" />
              <div className="w-1/2 h-px bg-basalt/10" />
            </div>
          </div>

          {/* Right — Form */}
          <div className="relative">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
              >
                <div className="w-16 h-16 border-2 border-saffron flex items-center justify-center mb-6">
                  <Check className="w-8 h-8 text-saffron" />
                </div>
                <h3 className="font-display text-2xl text-chalk mb-3">Inquiry Received</h3>
                <p className="font-body text-sm text-chalk/40 max-w-xs">
                  Thank you, {form.fullName}. A senior associate will review your
                  inquiry and respond within 24 hours.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-10">
                  {steps.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 flex items-center justify-center text-xs font-body transition-all duration-300 ${
                          i <= step
                            ? 'border border-saffron text-saffron'
                            : 'border border-basalt/30 text-basalt'
                        }`}
                      >
                        {i < step ? <Check className="w-3 h-3" /> : i + 1}
                      </div>
                      <span
                        className={`text-xs font-body hidden sm:inline ${
                          i <= step ? 'text-chalk/60' : 'text-basalt/50'
                        }`}
                      >
                        {s.label}
                      </span>
                      {i < steps.length - 1 && (
                        <div className="w-6 h-px bg-basalt/30 mx-1" aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Form fields */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {current.fields.map((field) => (
                      <div key={field.name}>
                        <label className="block font-body text-xs tracking-widest uppercase text-chalk/40 mb-3">
                          {field.label}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={form[field.name] || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            className="w-full bg-transparent border-b border-basalt/30 py-3 font-body text-base text-chalk focus:border-saffron focus:outline-none transition-colors appearance-none min-h-[44px]"
                          >
                            <option value="" className="bg-background text-chalk/50">Select a service</option>
                            {field.options.map((o) => (
                              <option key={o} value={o} className="bg-background text-chalk">{o}</option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            value={form[field.name] || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            rows={4}
                            className="w-full bg-transparent border-b border-basalt/30 py-3 font-body text-base text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors resize-none"
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={form[field.name] || ''}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full bg-transparent border-b border-basalt/30 py-3 font-body text-base text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors min-h-[44px]"
                          />
                        )}
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-12">
                  <button
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="flex items-center gap-2 font-body text-sm text-chalk/40 hover:text-chalk disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] px-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {step < steps.length - 1 ? (
                    <button
                      onClick={() => setStep((s) => s + 1)}
                      disabled={!canProceed}
                      className="flex items-center gap-2 font-body text-sm px-6 py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[44px]"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canProceed}
                      className="flex items-center gap-2 font-body text-sm px-6 py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[44px]"
                    >
                      Submit Inquiry
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body text-[10px] tracking-widest uppercase text-chalk/30">
                      Inquiry Progress
                    </span>
                    <span className="font-body text-[10px] text-saffron/60">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full h-px bg-basalt/20 relative" aria-hidden="true">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-saffron"
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}