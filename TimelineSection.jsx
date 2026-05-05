import { motion } from 'framer-motion';

const team = [
  {
    initials: 'MB',
    name: 'M. Bista',
    title: 'Managing Partner',
    specialisation: 'Statutory Audit & Assurance',
    qualifications: 'FCA, ICAAN',
    bio: 'Over 20 years leading complex audits for Nepal\'s largest corporations and government entities. Recognised for uncompromising audit quality.',
  },
  {
    initials: 'SR',
    name: 'Sujata Rana',
    title: 'Partner — Tax Advisory',
    specialisation: 'Corporate Taxation & Transfer Pricing',
    qualifications: 'ACA, ICAAN',
    bio: 'Specialist in Nepal\'s tax legislation with extensive experience in international tax structuring and IRD dispute resolution.',
  },
  {
    initials: 'PK',
    name: 'Prakash Karki',
    title: 'Partner — Financial Advisory',
    specialisation: 'M&A, Valuations & Risk',
    qualifications: 'ACA, CFA Level III',
    bio: 'Leads the firm\'s financial advisory practice, delivering rigorous valuations and strategic restructuring counsel to listed and private entities.',
  },
  {
    initials: 'AS',
    name: 'Anita Shrestha',
    title: 'Senior Manager — Audit',
    specialisation: 'Internal Audit & Compliance',
    qualifications: 'ACA, CIA',
    bio: 'Brings deep expertise in designing and executing internal audit frameworks aligned with global best practices for Nepal\'s financial sector.',
  },
  {
    initials: 'BT',
    name: 'Bikash Thapa',
    title: 'Manager — Tax',
    specialisation: 'VAT, Customs & Digital Economy Tax',
    qualifications: 'ACA, ICAAN',
    bio: 'Advises on indirect taxation across e-commerce, fintech, and cross-border transactions, staying ahead of Nepal\'s evolving digital tax framework.',
  },
  {
    initials: 'NM',
    name: 'Nisha Maharjan',
    title: 'Manager — Advisory',
    specialisation: 'Financial Modelling & Due Diligence',
    qualifications: 'ACA, MBA',
    bio: 'Delivers sophisticated financial models and transaction advisory services, supporting clients through acquisitions, mergers, and capital-raising activities.',
  },
];

export default function TeamGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-border/30">
      {team.map((member, i) => (
        <motion.div
          key={member.name}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: i * 0.07 }}
          className="group relative bg-background p-8 md:p-10 hover:bg-muted transition-colors duration-500"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-saffron scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" aria-hidden="true" />

          <div className="flex items-start gap-5 mb-6">
            <div className="w-12 h-12 border border-saffron/40 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-saffron font-semibold">{member.initials}</span>
            </div>
            <div>
              <h3 className="font-display text-xl text-chalk font-light">{member.name}</h3>
              <p className="font-body text-xs text-saffron/80 mt-0.5">{member.title}</p>
            </div>
          </div>

          <p className="font-body text-sm text-chalk/40 leading-relaxed mb-5">{member.bio}</p>

          <div className="space-y-2 pt-5 border-t border-basalt/20">
            <div className="flex items-center gap-2">
              <span className="font-body text-[10px] tracking-widest uppercase text-chalk/25">Specialisation</span>
              <span className="font-body text-xs text-chalk/50">{member.specialisation}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body text-[10px] tracking-widest uppercase text-chalk/25">Credentials</span>
              <span className="font-body text-xs text-saffron/60">{member.qualifications}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}