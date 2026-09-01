import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Clock, BookOpen } from 'lucide-react'

export default function SkillCard({ skill, index }) {
  const isMissing = skill.is_missing
  const levelColors = {
    beginner: 'text-yellow-400 bg-yellow-400/10',
    intermediate: 'text-mm-blue bg-mm-blue/10',
    advanced: 'text-mm-green bg-mm-green/10',
    expert: 'text-mm-purple bg-mm-purple/10',
  }

  const importanceColors = {
    high: 'text-red-400 bg-red-400/10 border-red-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bento-card p-5 transition-all duration-300 ${
        isMissing ? 'hover:border-red-500/25' : 'hover:border-mm-green/25'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isMissing ? (
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="text-mm-green flex-shrink-0" />
          )}
          <h4 className="font-heading font-semibold text-white text-sm">{skill.skill_name}</h4>
        </div>
        {skill.importance && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${importanceColors[skill.importance] || importanceColors.medium}`}>
            {skill.importance}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${levelColors[skill.required_level] || ''}`}>
          Required: {skill.required_level}
        </span>
        {skill.current_level && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${levelColors[skill.current_level] || ''}`}>
            Yours: {skill.current_level}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-zinc-500">
        {skill.estimated_hours > 0 && (
          <div className="flex items-center gap-1">
            <Clock size={11} />
            <span>{skill.estimated_hours}h</span>
          </div>
        )}
        {skill.category && (
          <div className="flex items-center gap-1">
            <BookOpen size={11} />
            <span className="capitalize">{skill.category}</span>
          </div>
        )}
      </div>

      {skill.learning_resources && skill.learning_resources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.04]">
          <p className="text-[11px] text-zinc-600 mb-1">Resources:</p>
          {skill.learning_resources.slice(0, 2).map((r, i) => (
            <p key={i} className="text-[11px] text-zinc-400">• {r}</p>
          ))}
        </div>
      )}
    </motion.div>
  )
}