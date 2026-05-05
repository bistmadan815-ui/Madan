import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { DEFAULT_TEAM, SPECIALIZATION_COLORS } from '@/utils/constants';

export default function TeamSection() {
  const [team, setTeam] = useState([]);
  useEffect(() => {
    base44.entities.TeamMember.list('order', 50).then(data => {
      setTeam(data.length > 0 ? data : DEFAULT_TEAM);
    });
  }, []);
  return (
    <section id="team" className="relative py-24 md:py-32">
      <div className="px-[6vw] md:px-[8vw]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px bg-saffron" aria-hidden="true" />
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron">
            The Partnership
          </p>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16 md:mb-20">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-chalk font-light">
            Meet Our Team
          </h2>
          <p className="font-body text-sm text-chalk/40 max-w-xs lg:text-right">
            Seasoned professionals united by a commitment to precision, ethics, and client success.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-border/30">
          {team.map((member, i) => (
            <motion.div
              key={member.id || member.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative bg-background p-8 flex flex-col"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-saffron scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" aria-hidden="true" />

              {/* Avatar / Photo */}
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.name} className="w-16 h-16 object-cover rounded-sm border border-saffron/20 mb-6" />
              ) : (
                <div className="w-14 h-14 border border-basalt/40 flex items-center justify-center mb-6 group-hover:border-saffron/40 transition-colors duration-400">
                  <span className="font-display text-lg text-chalk/60 font-light">{member.initials || member.name?.slice(0,2)}</span>
                </div>
              )}

              <span className={`font-body text-[10px] tracking-[0.2em] uppercase px-2 py-1 border self-start mb-5 ${SPECIALIZATION_COLORS[member.specialization] || 'text-slate-400 border-slate-400/30'}`}>
                {member.specialization}
              </span>

              <h3 className="font-display text-xl text-chalk font-light mb-1">{member.name}</h3>
              <p className="font-body text-xs text-saffron/70 mb-1">{member.title}</p>
              <p className="font-body text-xs text-chalk/30 mb-5">{member.qualification}</p>
              <p className="font-body text-sm text-chalk/40 leading-relaxed flex-1">{member.bio}</p>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  );
}