import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, Loader2, Printer } from 'lucide-react'

export default function ResumeDownload({ resumeData, targetJob, completedSkills }) {
  const [generating, setGenerating] = useState(false)
  const [previewHtml, setPreviewHtml] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const { generateResume } = await import('../utils/api.js')
      const result = await generateResume({
        resume_text: resumeData.resume_text,
        target_job_title: targetJob || 'Professional',
        study_hours_per_week: 10,
      })
      if (result && result.html) {
        let html = result.html
        if (completedSkills && completedSkills.length > 0) {
          const greenTags = completedSkills.map(s =>
            `<span class="skill-tag new">${s}</span>`
          ).join('')
          html = html.replace(
            '</div>\n\n  <div class="section">',
            greenTags + '</div>\n\n  <div class="section">'
          )
        }
        setPreviewHtml(html)
      } else {
        setError('No resume data received')
      }
    } catch (err) {
      console.error('Generate resume error:', err)
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
    a.download = `resume_${(resumeData.name || 'user').replace(/\s+/g, '_')}.html`
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

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
            <FileText size={20} className="text-neon-green" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-white">Download Resume</h2>
            <p className="text-sm text-gray-400">
              {completedSkills && completedSkills.length > 0
                ? `${completedSkills.length} new skill${completedSkills.length !== 1 ? 's' : ''} will be included`
                : 'Generate a styled resume with your updated skills'}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          {generating ? 'Generating...' : 'Generate Resume'}
        </motion.button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {previewHtml && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="border border-white/10 rounded-xl overflow-hidden bg-white">
            <div
              className="max-h-[400px] overflow-y-auto"
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

          <p className="text-xs text-gray-500 text-center">
            Tip: Use "Print to PDF" in your browser's print dialog to save as PDF
          </p>
        </motion.div>
      )}

      {!previewHtml && !error && (
        <div className="text-center py-8">
          <FileText size={32} className="mx-auto mb-3 text-gray-600" />
          <p className="text-sm text-gray-400">
            Generate a professional resume with your skills and completed learning
          </p>
        </div>
      )}
    </div>
  )
}
