import { motion } from 'framer-motion'
import { BookOpen, Clock, Code2, ChevronRight, CheckCircle2, Circle, Loader2 } from 'lucide-react'

export default function LearningPath({ steps, completedSkills, onToggleSkill, updating }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <BookOpen size={48} className="mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400">Run an analysis to generate your learning path</p>
      </div>
    )
  }

  const totalHours = steps.reduce((sum, s) => sum + (s.estimated_hours || 0), 0)
  const completed = completedSkills || []

  const isStepCompleted = (step) => {
    return step.skills && step.skills.length > 0
      ? step.skills.every(s => completed.includes(s))
      : completed.includes(step.title)
  }

  const getStepSkills = (step) => {
    if (step.skills && step.skills.length > 0) return step.skills
    return [step.title]
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
            <BookOpen size={20} className="text-neon-green" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white">Learning Path</h2>
            <p className="text-sm text-gray-400">Click steps to mark as complete</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold gradient-text">{totalHours}h</p>
          <p className="text-xs text-gray-500">total estimated</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-blue via-accent-purple to-accent-green" />

        <div className="space-y-6">
          {steps.map((step, i) => {
            const skills = getStepSkills(step)
            const allDone = skills.every(s => completed.includes(s))
            const someDone = skills.some(s => completed.includes(s))

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative pl-12"
              >
                <button
                  onClick={() => {
                    skills.forEach(s => onToggleSkill && onToggleSkill(s, !completed.includes(s)))
                  }}
                  className="absolute left-2.5 w-6 h-6 rounded-full bg-dark-900 border-2 flex items-center justify-center z-10 transition-colors cursor-pointer hover:scale-110"
                  style={{ borderColor: allDone ? '#00d091' : someDone ? '#037dd6' : '#374151' }}
                >
                  {allDone ? (
                    <CheckCircle2 size={14} className="text-accent-green" />
                  ) : (
                    <span className="text-xs font-bold" style={{ color: someDone ? '#037dd6' : '#6b7280' }}>
                      {step.step_number}
                    </span>
                  )}
                </button>

                <div className={`glass-card p-5 transition-all duration-300 ${
                  allDone ? 'border-accent-green/30 bg-accent-green/5' : 'hover:border-accent-blue/30'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`font-heading font-semibold ${allDone ? 'text-accent-green line-through' : 'text-white'}`}>
                      {step.title}
                    </h4>
                    <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 ml-2">
                      <Clock size={12} />
                      {step.estimated_hours}h
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-3">{step.description}</p>

                  {step.resources && step.resources.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1.5">Resources:</p>
                      <div className="space-y-1">
                        {step.resources.map((r, ri) => (
                          <div key={ri} className="flex items-center gap-2 text-xs">
                            <ChevronRight size={10} className="text-accent-blue" />
                            <span className="text-gray-300">{r.name}</span>
                            <span className="text-gray-500 capitalize">({r.type})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.projects && step.projects.length > 0 && (
                    <div className="bg-dark-800/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                        <Code2 size={10} />
                        Practice Projects:
                      </p>
                      {step.projects.map((p, pi) => (
                        <p key={pi} className="text-xs text-accent-blue/80">→ {p}</p>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill, si) => {
                      const done = completed.includes(skill)
                      return (
                        <button
                          key={si}
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleSkill && onToggleSkill(skill, !done)
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            done
                              ? 'bg-accent-green/20 border-accent-green text-accent-green shadow-[0_0_12px_rgba(0,208,145,0.3)]'
                              : 'bg-dark-800 border-white/20 text-zinc-300 hover:border-accent-blue/50 hover:text-accent-blue'
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 size={12} className="text-accent-green" />
                          ) : (
                            <Circle size={12} className="text-zinc-500" />
                          )}
                          {skill}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
