import { motion } from 'framer-motion'
import { Map, Clock, ArrowRight, CheckCircle2, Circle, Sparkles, Star } from 'lucide-react'

export default function Roadmap({ nodes, bonusSkills, completedSkills }) {
  const completed = completedSkills || []

  if (!nodes || nodes.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Map size={48} className="mx-auto mb-4 text-gray-600" />
        <p className="text-gray-400">Run an analysis to generate your learning roadmap</p>
      </div>
    )
  }

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })

  const rows = {}
  sortedNodes.forEach(node => {
    const row = Math.round(node.y * 10)
    if (!rows[row]) rows[row] = []
    rows[row].push(node)
  })

  const nodeColors = [
    'from-accent-blue/20 to-accent-purple/20 border-accent-blue/30',
    'from-accent-purple/20 to-accent-pink/20 border-accent-purple/30',
    'from-accent-green/20 to-accent-blue/20 border-accent-green/30',
    'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    'from-accent-pink/20 to-red-500/20 border-accent-pink/30',
  ]

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center">
            <Map size={20} className="text-neon-blue" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white">Learning Roadmap</h2>
            <p className="text-sm text-gray-400">Your visual path to mastery — click nodes to track progress</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(rows).map(([rowIndex, rowNodes]) => (
            <div key={rowIndex}>
              <p className="text-xs text-gray-500 mb-2 ml-2">
                {parseInt(rowIndex) === 0 ? 'Start Here' : `Phase ${parseInt(rowIndex)}`}
              </p>
              <div className="flex flex-wrap gap-3">
                {rowNodes.map((node, i) => {
                  const isDone = completed.includes(node.skill)
                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: parseInt(rowIndex) * 0.2 + i * 0.1 }}
                      whileHover={{ scale: 1.03, y: -3 }}
                      className={`flex-1 min-w-[200px] max-w-[300px] p-4 rounded-xl bg-gradient-to-br ${
                        isDone ? 'from-accent-green/20 to-accent-green/10 border-accent-green/30' : nodeColors[parseInt(rowIndex) % nodeColors.length]
                      } border backdrop-blur-sm transition-all`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {isDone ? (
                          <CheckCircle2 size={16} className="text-accent-green" />
                        ) : (
                          <Circle size={16} className="text-gray-500" />
                        )}
                        <h4 className={`font-heading font-semibold text-sm ${isDone ? 'text-accent-green line-through' : 'text-white'}`}>
                          {node.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-300 mb-3 line-clamp-2">{node.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {node.duration_hours}h
                        </span>
                        <span className="text-accent-blue">{node.skill}</span>
                      </div>
                      {node.resources && node.resources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          {node.resources.slice(0, 1).map((r, ri) => (
                            <p key={ri} className="text-xs text-gray-500 truncate">
                              {r.type}: {r.name}
                            </p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
              {parseInt(rowIndex) < Object.keys(rows).length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowRight size={16} className="text-gray-600 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {bonusSkills && bonusSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border-accent-purple/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
              <Sparkles size={20} className="text-accent-purple" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white">Bonus Skills</h3>
              <p className="text-sm text-gray-400">Extra skills to stand out from other candidates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bonusSkills.map((skill, i) => {
              const name = skill.skill_name || skill.name || skill
              const desc = skill.description || ''
              const related = skill.related_jobs || []
              const hours = skill.estimated_hours || 0

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl bg-dark-800/50 border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={12} className="text-accent-purple flex-shrink-0" />
                    <h4 className="text-sm font-semibold text-white">{name}</h4>
                    {hours > 0 && (
                      <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
                        <Clock size={10} />{hours}h
                      </span>
                    )}
                  </div>
                  {desc && <p className="text-xs text-gray-400 ml-5 mb-1">{desc}</p>}
                  {related.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-5">
                      {related.map((job, ji) => (
                        <span key={ji} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple">
                          {job}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
