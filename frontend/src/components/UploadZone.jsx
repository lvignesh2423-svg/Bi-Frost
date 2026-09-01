import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react'

export default function UploadZone({ onResumeUploaded }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return

    const ext = selectedFile.name.split('.').pop().toLowerCase()
    if (ext !== 'pdf' && ext !== 'txt') {
      setError('Please upload a PDF or TXT file')
      return
    }

    setFile(selectedFile)
    setError(null)
    setUploading(true)

    try {
      const { uploadResume } = await import('../utils/api.js')
      const result = await uploadResume(selectedFile)
      onResumeUploaded(result)
    } catch (err) {
      setError(err.message || 'Failed to upload resume')
      setFile(null)
    } finally {
      setUploading(false)
    }
  }, [onResumeUploaded])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }, [handleFile])

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const onDragLeave = () => setDragOver(false)

  const clearFile = () => { setFile(null); setError(null) }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`relative bento-card p-12 text-center cursor-pointer transition-all duration-300 ${
              dragOver
                ? 'border-mm-green/40 bg-mm-green/[0.03]'
                : 'hover:border-white/[0.12]'
            }`}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            <motion.div
              animate={dragOver ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
              className="mb-5"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-mm-green/10 flex items-center justify-center border border-mm-green/20">
                <Upload size={28} className="text-mm-green" />
              </div>
            </motion.div>

            <h3 className="text-lg font-heading font-semibold text-white mb-2">
              Drop your resume here
            </h3>
            <p className="text-zinc-400 mb-3 text-sm">
              or click to browse
            </p>
            <p className="text-xs text-zinc-600">
              Supports PDF and TXT formats
            </p>

            {dragOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 rounded-3xl bg-mm-green/[0.03] border-2 border-dashed border-mm-green/40 pointer-events-none"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bento-card p-5"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-mm-green/10 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-mm-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate text-sm">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <div className="flex items-center gap-2">
                {uploading ? (
                  <div className="flex items-center gap-2 text-mm-green">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">Parsing...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 size={18} className="text-mm-green" />
                    <button
                      onClick={(e) => { e.stopPropagation(); clearFile() }}
                      className="p-1 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-red-400 text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}