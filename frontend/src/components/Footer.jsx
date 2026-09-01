import { Target, Github, Twitter, Linkedin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-dark-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-mm-green">
                <Target size={18} className="text-dark-900" />
              </div>
              <span className="font-heading font-bold text-lg text-white">SkillGap</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mb-6">
              AI-powered career intelligence platform helping professionals discover skill gaps, build learning roadmaps, and optimize their resumes.
            </p>
            <div className="flex items-center gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <motion.a
                  key={i}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/[0.12] transition-all"
                >
                  <Icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {['Analysis', 'Roadmap', 'Resume Optimizer', 'AI Mentor'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              {['Documentation', 'API', 'Blog', 'Support'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.04] mt-10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © 2026 SkillGap AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-zinc-600 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-xs text-zinc-600 hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}