import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Target, Loader2, ChevronDown, ChevronUp, Briefcase } from 'lucide-react'
import SkillCard from './SkillCard'
import ReadinessGauge from './ReadinessGauge'

export default function AnalysisPanel({ resumeData, onAnalysisComplete }) {
  const [targetJob, setTargetJob] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [showJDInput, setShowJDInput] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [showAllGaps, setShowAllGaps] = useState(false)

  const handleAnalyze = async () => {
    if (!targetJob.trim()) return
    setAnalyzing(true)
    try {
      const { analyze } = await import('../utils/api.js')
      const result = await analyze({
        resume_text: resumeData.resume_text,
        target_job_title: targetJob,
        target_job_description: jobDescription || null,
        study_hours_per_week: 10,
      })
      setAnalysis(result.analysis)
      onAnalysisComplete(result)
    } catch (err) {
      alert(err.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const displayedGaps = analysis
    ? showAllGaps
      ? analysis.skill_gaps
      : analysis.skill_gaps.slice(0, 6)
    : []

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-card"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-mm-purple/10 flex items-center justify-center">
            <Target size={18} className="text-mm-purple" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-white text-base">Target Job</h2>
            <p className="text-sm text-zinc-500">What role are you aiming for?</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="e.g., Senior Data Scientist, Full Stack Developer..."
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              className="input-dark pl-11"
            />
          </div>

          <button
            onClick={() => setShowJDInput(!showJDInput)}
            className="text-sm text-mm-blue hover:text-mm-blue/80 flex items-center gap-1 transition-colors"
          >
            {showJDInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showJDInput ? 'Hide' : 'Add'} job description (optional)
          </button>

          <AnimatePresence>
            {showJDInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <textarea
                  placeholder="Paste the job description here for more accurate analysis..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={4}
                  className="input-dark resize-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleAnalyze}
            disabled={!targetJob.trim() || analyzing}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing your gaps...
              </>
            ) : (
              <>
                <Target size={16} />
                Analyze Skill Gaps
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {resumeData.skills && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bento-card"
        >
          <h3 className="font-heading font-semibold text-white text-base mb-4">
            Your Skills ({resumeData.skills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((s, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="text-xs px-3 py-1.5 rounded-full bg-dark-600 border border-white/[0.06] text-zinc-300"
              >
                {s.name}
                <span className="ml-1.5 text-zinc-600">·</span>
                <span className="ml-1 text-mm-blue">{s.level}</span>
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bento-card flex flex-col items-center justify-center">
              <ReadinessGauge score={analysis.readiness_score} />
            </div>
            <div className="bento-card">
              <h3 className="font-heading font-semibold text-white text-base mb-3">Summary</h3>
              <p className="text-zinc-300 text-sm leading-relaxed">{analysis.summary}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-mm-green/5 border border-mm-green/10">
                  <p className="text-2xl font-bold text-mm-green">{analysis.skills_matched}</p>
                  <p className="text-xs text-zinc-500">Matched</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-2xl font-bold text-red-400">{analysis.skills_missing}</p>
                  <p className="text-xs text-zinc-500">Missing</p>
                </div>
              </div>
            </div>
            <div className="bento-card">
              <h3 className="font-heading font-semibold text-white text-base mb-3">Timeline</h3>
              <div className="text-center">
                <p className="text-3xl font-bold gradient-text">{analysis.time_to_hire_weeks}</p>
                <p className="text-sm text-zinc-400">weeks to job-ready</p>
                <p className="text-xs text-zinc-600 mt-1">at {analysis.study_hours_per_week}h/week</p>
              </div>
              <div className="mt-4 space-y-2">
                {analysis.matched_skills.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-mm-green" />
                    <span className="text-zinc-300">{s.name}</span>
                    <span className="text-zinc-600 ml-auto">{s.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {analysis.related_jobs && analysis.related_jobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bento-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-mm-blue/10 flex items-center justify-center">
                  <Briefcase size={18} className="text-mm-blue" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white text-base">Related Jobs</h3>
                  <p className="text-sm text-zinc-500">Based on your current skill profile</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.related_jobs.map((job, i) => (
                  <span key={i} className="text-sm px-4 py-2 rounded-xl bg-dark-600 border border-white/[0.06] text-zinc-200 hover:border-mm-blue/30 transition-colors cursor-default">
                    {job}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          <div className="bento-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-white text-base">
                Skill Gaps ({analysis.skill_gaps.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedGaps.map((gap, i) => (
                <SkillCard key={i} skill={gap} index={i} />
              ))}
            </div>
            {analysis.skill_gaps.length > 6 && (
              <button
                onClick={() => setShowAllGaps(!showAllGaps)}
                className="mt-4 text-sm text-mm-blue hover:text-mm-blue/80 transition-colors"
              >
                {showAllGaps ? 'Show less' : `Show all ${analysis.skill_gaps.length} gaps`}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}