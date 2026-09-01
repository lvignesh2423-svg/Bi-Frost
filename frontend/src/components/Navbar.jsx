import { motion } from 'framer-motion'
import { Target, Menu, X, LogIn, LogOut, User } from 'lucide-react'
import { useState } from 'react'

export default function Navbar({ currentView, onNavigate, user, onLogin, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { id: 'home', label: 'Home' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'resume', label: 'Resume' },
    { id: 'mentor', label: 'Mentor' },
  ]

  return (
    <motion.nav
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: 'rgba(12, 12, 20, 0.85)', backdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #037dd6, #7c3aed)' }}
            >
              <Target size={16} className="text-white" />
            </div>
            <span className="font-heading font-bold text-base text-white tracking-tight">SkillGap</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-0.5">
            {links.map(link => (
              <motion.button
                key={link.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate(link.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === link.id
                    ? 'text-white bg-white/[0.08]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {link.label}
              </motion.button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-300 flex items-center gap-1.5">
                  <User size={14} className="text-accent-blue" />
                  {user.username}
                </span>
                <button
                  onClick={onLogout}
                  className="text-sm text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <LogOut size={13} />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
              >
                <LogIn size={14} />
                Sign In
              </button>
            )}
          </div>

          <button
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden border-b border-white/[0.06]"
          style={{ background: 'rgba(12, 12, 20, 0.95)' }}
        >
          <div className="px-4 py-3 space-y-1">
            {links.map(link => (
              <button
                key={link.id}
                onClick={() => { onNavigate(link.id); setMobileOpen(false) }}
                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
                  currentView === link.id
                    ? 'text-white bg-white/[0.08]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 border-t border-white/[0.06] mt-2">
              {user ? (
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-zinc-300">{user.username}</span>
                  <button onClick={onLogout} className="text-sm text-red-400">Logout</button>
                </div>
              ) : (
                <button
                  onClick={() => { onLogin(); setMobileOpen(false) }}
                  className="block w-full text-left px-4 py-2.5 text-sm text-accent-blue"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
