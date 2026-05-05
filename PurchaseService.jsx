import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, MapPin, Linkedin, Globe, Facebook } from 'lucide-react';

export default function Footer() {
  const [settings, setSettings] = useState({
    phone: '+977-1-XXXXXXX',
    email: 'info@mbista.com.np',
    whatsapp: '+977-9841XXXXXX',
    address: 'Kathmandu, Nepal',
    linkedin: '#',
    website: '#',
    facebook: '#',
    pan: 'PAN: XXXXXXXXX',
    vat: 'VAT Reg: XXXXXXXXX',
    ican: 'ICAN Reg: XXXXX',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const data = await base44.entities.SiteSettings.list('-created_date', 50);
      if (data.length > 0) {
        const settingsObj = {};
        data.forEach(s => { settingsObj[s.key] = s.value; });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    };
    loadSettings();
  }, []);

  return (
    <footer className="bg-background border-t border-border">
      <div className="px-[6vw] md:px-[8vw] py-12 md:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border border-saffron flex items-center justify-center">
                <span className="font-display text-saffron text-xs font-semibold">MB</span>
              </div>
              <span className="font-display text-chalk text-sm font-semibold tracking-wide">M. Bista & Associates</span>
            </div>
            <p className="font-body text-xs text-chalk/40 leading-relaxed">
              Chartered Accountants providing comprehensive audit, tax, and financial advisory services in Nepal.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm text-chalk font-light mb-4 tracking-wide">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-saffron flex-shrink-0 mt-0.5" />
                <a href={`tel:${settings.phone}`} className="font-body text-xs text-chalk/50 hover:text-saffron transition-colors">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-saffron flex-shrink-0 mt-0.5" />
                <a href={`mailto:${settings.email}`} className="font-body text-xs text-chalk/50 hover:text-saffron transition-colors">
                  {settings.email}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-saffron flex-shrink-0 mt-0.5" />
                <span className="font-body text-xs text-chalk/50">{settings.address}</span>
              </div>
              <div className="font-body text-xs text-chalk/50 mt-2">
                WhatsApp: <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} className="text-saffron hover:underline">{settings.whatsapp}</a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm text-chalk font-light mb-4 tracking-wide">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'Our Services', href: '/#services' },
                { label: 'Team', href: '/#team' },
                { label: 'Client Portal', href: '/client-portal' },
                { label: 'Staff Portal', href: '/staff-portal' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.href} className="font-body text-xs text-chalk/50 hover:text-saffron transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Registration */}
          <div>
            <h4 className="font-display text-sm text-chalk font-light mb-4 tracking-wide">Registration</h4>
            <div className="space-y-2">
              {[settings.pan, settings.vat, settings.ican].map((reg, i) => (
                <p key={i} className="font-body text-xs text-chalk/50">{reg}</p>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              {[
                { icon: Linkedin, url: settings.linkedin, label: 'LinkedIn' },
                { icon: Globe, url: settings.website, label: 'Website' },
                { icon: Facebook, url: settings.facebook, label: 'Facebook' },
              ].map(social => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 border border-basalt/30 flex items-center justify-center text-chalk/40 hover:text-saffron hover:border-saffron/30 transition-colors"
                    title={social.label}
                  >
                    <Icon className="w-3 h-3" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-basalt/10 py-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="font-body text-xs text-chalk/25 text-center md:text-left mb-4 md:mb-0">
            © {new Date().getFullYear()} M. Bista & Associates. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="font-body text-xs text-chalk/25 hover:text-saffron transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="font-body text-xs text-chalk/25 hover:text-saffron transition-colors">
              Terms of Service
            </a>
            <a href="#" className="font-body text-xs text-chalk/25 hover:text-saffron transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}