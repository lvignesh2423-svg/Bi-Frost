import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ReadinessGauge({ score, size = 180 }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const getColor = (s) => {
    if (s >= 80) return { stroke: '#baf24a', text: 'text-mm-green', label: 'Excellent' }
    if (s >= 60) return { stroke: '#89b0ff', text: 'text-mm-blue', label: 'Good' }
    if (s >= 40) return { stroke: '#f8893a', text: 'text-mm-orange', label: 'Fair' }
    return { stroke: '#ef4444', text: 'text-red-400', label: 'Needs Work' }
  }

  const color = getColor(score)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="7"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className={`text-4xl font-heading font-bold ${color.text}`}
          >
            {Math.round(animatedScore)}%
          </motion.span>
          <span className="text-xs text-zinc-500 mt-1">Readiness</span>
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`mt-2 text-sm font-semibold ${color.text}`}
      >
        {color.label}
      </motion.p>
    </div>
  )
}