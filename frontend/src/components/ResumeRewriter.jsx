import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Loader2, Sparkles, ArrowRight, Copy, Check,
  Download, Printer, RefreshCw, CheckCircle2, XCircle, ChevronDown, ChevronUp
} from 'lucide-react'

export default function ResumeRewriter({ resumeText, targetJob, completedSkills }) {
  const [rewrites, setRewrites] = useState([])
  const [acceptedRewrites, setAcceptedRewrites] = useState({})
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const [currentResumeText, setCurrentResumeText] = useState(resumeText)
  const [step, setStep] = useState('optimize')
  const [previewHtml, setPreviewHtml] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [expandedRewrite, setExpandedRewrite] = useState(null)

  const handleOptimize = async () => {
    setLoading(true)
    setError(null)
    try {
      const { rewriteResume } = await import('../utils/api.js')
      const result = await rewriteResume({
        resume_text: currentResumeText,
        updated_resume_text: currentResumeText,
        target_job_title: targetJob,
      })
      const rws = result.rewrites || []
      setRewrites(rws)
      const initial = {}
      rws.forEach((_, i) => { initial[i] = true })
      setAcceptedRewrites(initial)
      setStep('review')
    } catch (err) {
      setError(err.message || 'Optimization failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    let updated = currentResumeText
    rewrites.forEach((r, i) => {
      if (acceptedRewrites[i]) {
        updated = updated.replace(r.original_bullet, r.rewritten_bullet)
      }
    })
    setCurrentResumeText(updated)
    setRewrites([])
    setAcceptedRewrites({})
    setStep('applied')
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const { generateResume } = await import('../utils/api.js')
      const result = await generateResume({
        resume_text: currentResumeText,
        updated_resume_text: currentResumeText,
        target_job_title: targetJob || 'Professional',
        study_hours_per_week: 10,
        completed_skills: completedSkills || [],
      })
      if (result && result.html) {
        setPreviewHtml(result.html)
        setStep('preview')
      } else {
        setError('No resume data received')
      }
    } catch (err) {
      setError(err.message || 'Failed to generate resume')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!previewHtml) return
    const blob = new Blob([previewHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    if (!previewHtml) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(previewHtml)
    printWindow.document.close()
    printWindow.print()
  }

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleAccept = (index) => {
    setAcceptedRewrites(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const acceptAll = () => {
    const all = {}
    rewrites.forEach((_, i) => { all[i] = true })
    setAcceptedRewrites(all)
  }

  const rejectAll = () => {
    const none = {}
    rewrites.forEach((_, i) => { none[i] = false })
    setAcceptedRewrites(none)
  }

  const acceptedCount = Object.values(acceptedRewrites).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="bento-card p-4">
        <div className="flex items-center justify-between">
          {[
            { key: 'optimize', label: 'Optimize', icon: Sparkles },
            { key: 'review', label: 'Review Changes', icon: FileText },
            { key: 'applied', label: 'Apply & Generate', icon: RefreshCw },
            { key: 'preview', label: 'Download', icon: Download },
          ].map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.key || (step === 'review' && s.key === 'optimize')
            const isDone = ['review', 'applied', 'preview'].indexOf(step) > ['optimize', 'review', 'applied'].indexOf(s.key)
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone ? 'bg-mm-green/20 text-mm-green' :
                  isActive ? 'bg-mm-purple/20 text-mm-purple' : 'bg-dark-800 text-zinc-500'
                }`}>
                  {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <span className={`text-xs hidden sm:block ${isDone ? 'text-mm-green' : isActive ? 'text-mm-purple' : 'text-zinc-500'}`}>
                  {s.label}
                </span>
                {i < 3 && <div className={`w-6 h-px mx-1 ${isDone ? 'bg-mm-green/30' : 'bg-white/10'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step: Optimize */}
      {step === 'optimize' && (
        <div className="bento-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mm-purple/10 flex items-center justify-center">
                <FileText size={20} className="text-mm-purple" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-white">Resume Optimizer</h2>
                <p className="text-sm text-zinc-400">ATS-friendly keyword optimization for <span className="text-mm-blue">{targetJob || 'your target role'}</span></p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOptimize}
              disabled={loading}
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {loading ? 'Optimizing...' : 'Optimize Resume'}
            </motion.button>
          </div>
          <div className="text-center py-8">
            <FileText size={40} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              Click "Optimize Resume" to analyze your resume and get ATS-friendly bullet point rewrites
            </p>
            {(completedSkills?.length > 0) && (
              <p className="text-xs text-mm-green mt-2">
                ✓ {completedSkills.length} completed skill{completedSkills.length !== 1 ? 's' : ''} will be included
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step: Review Changes */}
      {step === 'review' && rewrites.length > 0 && (
        <div className="bento-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-white">
                {acceptedCount} of {rewrites.length} changes selected
              </h2>
              <p className="text-sm text-zinc-400">Review each optimization, then apply the ones you want</p>
            </div>
            <div className="flex gap-2">
              <button onClick={acceptAll} className="text-xs px-3 py-1.5 rounded-lg bg-mm-green/10 text-mm-green hover:bg-mm-green/20 transition-colors">
                Accept All
              </button>
              <button onClick={rejectAll} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                Reject All
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {rewrites.map((r, i) => {
              const isAccepted = acceptedRewrites[i] !== false
              const isExpanded = expandedRewrite === i
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border transition-all ${
                    isAccepted
                      ? 'bg-mm-green/5 border-mm-green/20'
                      : 'bg-dark-800/50 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleAccept(i)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isAccepted
                          ? 'bg-mm-green border-mm-green'
                          : 'border-zinc-500 hover:border-zinc-400'
                      }`}
                    >
                      {isAccepted && <Check size={12} className="text-dark-900" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-zinc-400 line-through flex-1">{r.original_bullet}</p>
                        <button
                          onClick={() => setExpandedRewrite(isExpanded ? null : i)}
                          className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                        >
                          {isExpanded ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                        </button>
                      </div>
                      <div className="flex items-start gap-2">
                        <Sparkles size={14} className="text-mm-green mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-white flex-1">{r.rewritten_bullet}</p>
                        <button
                          onClick={() => copyToClipboard(r.rewritten_bullet, i)}
                          className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                        >
                          {copied === i ? (
                            <Check size={14} className="text-mm-green" />
                          ) : (
                            <Copy size={14} className="text-zinc-500" />
                          )}
                        </button>
                      </div>
                      {r.keywords_added && r.keywords_added.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {r.keywords_added.map((kw, ki) => (
                            <span key={ki} className="text-xs px-2 py-0.5 rounded-full bg-mm-blue/10 text-mm-blue">
                              +{kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApply}
              disabled={acceptedCount === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <CheckCircle2 size={16} />
              Apply {acceptedCount} Change{acceptedCount !== 1 ? 's' : ''}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setRewrites([]); setStep('optimize') }}
              className="btn-secondary px-6"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      )}

      {/* Step: Applied → Generate */}
      {step === 'applied' && (
        <div className="bento-card p-6">
          <div className="text-center py-6">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-mm-green" />
            <h2 className="font-heading font-bold text-white text-xl mb-2">Resume Updated!</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Your resume text has been optimized with {acceptedCount} change{acceptedCount !== 1 ? 's' : ''}.
              <br />Now generate a styled HTML resume to download.
            </p>
            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={generating}
                className="btn-primary px-6 py-3 flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                {generating ? 'Generating...' : 'Generate Resume'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('optimize')}
                className="btn-secondary px-6 py-3 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Optimize Again
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Preview & Download */}
      {step === 'preview' && previewHtml && (
        <div className="bento-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-bold text-white">Your Resume</h2>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('optimize')}
                className="text-sm px-4 py-2 rounded-lg bg-dark-800 text-zinc-300 hover:text-white transition-colors"
              >
                ← Back
              </motion.button>
            </div>
          </div>

          <div className="border border-white/10 rounded-xl overflow-hidden bg-white mb-6">
            <div
              className="max-h-[500px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Download HTML
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrint}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <Printer size={16} />
              Print to PDF
            </motion.button>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-3">
            Tip: Use "Print to PDF" in your browser's print dialog to save as PDF
          </p>
        </div>
      )}
    </div>
  )
}