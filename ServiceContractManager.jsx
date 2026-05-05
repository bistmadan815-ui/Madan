import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpRight } from 'lucide-react';

const articles = [
  {
    category: 'Tax Law',
    date: 'March 2026',
    title: 'Key Amendments to Nepal\'s Income Tax Act: What Businesses Must Know',
    excerpt:
      'The Inland Revenue Department has introduced significant revisions to transfer pricing regulations and thin capitalisation rules affecting multinational entities operating in Nepal.',
    readTime: '6 min read',
  },
  {
    category: 'Audit Standards',
    date: 'February 2026',
    title: 'Nepal\'s Adoption of ISA 315 (Revised): Implications for Risk Assessment',
    excerpt:
      'ICAAN\'s full adoption of ISA 315 (Revised 2019) mandates a more robust approach to identifying and assessing risks of material misstatement, reshaping audit planning across all engagements.',
    readTime: '8 min read',
  },
  {
    category: 'Financial Markets',
    date: 'February 2026',
    title: 'NEPSE Regulatory Updates: Disclosure Requirements for Listed Entities',
    excerpt:
      'The Securities Board of Nepal has tightened disclosure requirements for publicly listed companies, with new quarterly reporting deadlines and enhanced corporate governance frameworks now in effect.',
    readTime: '5 min read',
  },
  {
    category: 'Tax Law',
    date: 'January 2026',
    title: 'VAT Compliance in the Digital Economy: Nepal\'s Framework for E-Commerce',
    excerpt:
      'With digital transactions accelerating, the IRD has clarified VAT obligations for cross-border digital services, creating new compliance responsibilities for both domestic and foreign service providers.',
    readTime: '7 min read',
  },
  {
    category: 'Audit Standards',
    date: 'January 2026',
    title: 'Going Concern Assessments Post-Pandemic: A Practitioner\'s Guide',
    excerpt:
      'Elevated economic uncertainty demands more rigorous going concern evaluations. We examine how auditors should approach management\'s assumptions under Nepal\'s current macroeconomic conditions.',
    readTime: '9 min read',
  },
  {
    category: 'Financial Markets',
    date: 'December 2025',
    title: 'Foreign Direct Investment in Nepal: Regulatory Landscape and Audit Obligations',
    excerpt:
      'Recent amendments to the Foreign Investment and Technology Transfer Act introduce new audit and reporting requirements for foreign-invested entities, with compliance timelines beginning Q2 2026.',
    readTime: '6 min read',
  },
];

const CATEGORIES = ['All', 'Tax Law', 'Audit Standards', 'Financial Markets'];

const categoryColors = {
  'Tax Law': 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  'Audit Standards': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  'Financial Markets': 'text-violet-400 border-violet-400/30 bg-violet-400/5',
};

function ArticleCard({ article, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className="group relative flex flex-col border border-border hover:border-basalt/50 bg-background transition-all duration-500 p-7 md:p-8 cursor-pointer text-left w-full"
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-saffron scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" aria-hidden="true" />

      <div className="flex items-center justify-between mb-6">
        <span className={`font-body text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 border ${categoryColors[article.category]}`}>
          {article.category}
        </span>
        <ArrowUpRight className="w-4 h-4 text-chalk/20 group-hover:text-saffron transition-colors duration-300" aria-hidden="true" />
      </div>

      <h3 className="font-display text-lg md:text-xl text-chalk font-light leading-snug mb-4 group-hover:text-chalk transition-colors">
        {article.title}
      </h3>

      <p className="font-body text-sm text-chalk/40 leading-relaxed flex-1 mb-6">
        {article.excerpt}
      </p>

      <div className="flex items-center gap-4 pt-5 border-t border-basalt/20">
        <span className="font-body text-xs text-chalk/25">{article.date}</span>
        <div className="w-1 h-1 rounded-full bg-basalt/30" aria-hidden="true" />
        <span className="font-body text-xs text-chalk/25">{article.readTime}</span>
      </div>
    </motion.button>
  );
}

export default function InsightsSection() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <section id="insights" className="relative py-24 md:py-32">
      {/* Vertical ledger lines */}
      <div className="absolute left-[4vw] top-20 bottom-20 w-px bg-basalt/10" aria-hidden="true" />

      <div className="px-[6vw] md:px-[8vw]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px bg-saffron" aria-hidden="true" />
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron">Knowledge Centre</p>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 md:mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-chalk font-light">
            Insights &amp; Analysis
          </h2>
          <p className="font-body text-sm text-chalk/40 max-w-xs lg:text-right">
            Expert commentary on the evolving fiscal and regulatory landscape of Nepal.
          </p>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search insights..."
              className="w-full bg-transparent border border-basalt/30 pl-11 pr-4 py-3 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors min-h-[44px]"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-body text-xs tracking-widest uppercase px-4 py-2 border transition-all duration-300 min-h-[44px] ${
                  activeCategory === cat
                    ? 'border-saffron text-saffron bg-saffron/5'
                    : 'border-basalt/30 text-chalk/40 hover:border-saffron/50 hover:text-chalk/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-border/30">
            {filtered.map((article, i) => (
              <div key={article.title} className="bg-background">
                <ArticleCard article={article} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-display text-2xl text-chalk/20 font-light mb-3">No insights found</p>
            <p className="font-body text-sm text-chalk/20">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>
    </section>
  );
}