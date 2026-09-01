import { motion } from 'framer-motion'
import { ArrowRight, Zap, Map, Brain, BarChart3 } from 'lucide-react'

export default function Hero({ onGetStarted, onViewDemo }) {
  const features = [
    { icon: Brain, label: 'AI-Powered Analysis', desc: 'Deep skill gap detection' },
    { icon: Map, label: 'Visual Roadmaps', desc: 'Interactive learning paths' },
    { icon: BarChart3, label: 'Readiness Score', desc: 'Know where you stand' },
    { icon: Zap, label: 'Instant Results', desc: 'Analysis in seconds' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-mesh">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-accent-blue/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-accent-purple/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 120 }}
            className="w-16 h-16 mx-auto mb-8 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #037dd6, #7c3aed)' }}
          >
            <Zap size={32} className="text-white" />
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-heading font-bold mb-6 leading-[1.1] tracking-tight">
            <span className="gradient-text">Skill Gap</span>
            <br />
            <span className="text-white">Analyzer</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Your career GPS. Upload your resume, pick your dream job, and discover exactly
            what skills you need to get there.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="btn-primary text-base px-8 py-3.5 flex items-center justify-center gap-2"
          >
            Start Analysis <ArrowRight size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onViewDemo}
            className="btn-secondary text-base px-8 py-3.5"
          >
            View Demo
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              whileHover={{ y: -4 }}
              className="glass-card p-5 text-center"
            >
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                <f.icon size={20} className="text-accent-blue" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{f.label}</p>
              <p className="text-xs text-zinc-500">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
