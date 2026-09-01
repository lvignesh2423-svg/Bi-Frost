import { Target } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-dark-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #037dd6, #7c3aed)' }}
            >
              <Target size={14} className="text-white" />
            </div>
            <span className="font-heading font-semibold text-sm text-white">SkillGap</span>
          </div>

          <p className="text-xs text-zinc-600">
            AI-powered career intelligence platform
          </p>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-700">v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
