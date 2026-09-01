import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Menu, X, LogIn, LogOut, User, ChevronRight } from 'lucide-react'

export default function Navbar({ currentView, onNavigate, user, onLogin, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = [
    { id: 'home', label: 'Home' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'resume', label: 'Resume' },
    { id: 'mentor', label: 'Mentor' },
  ]

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/[0.06] bg-dark-900/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-mm-green">
              <Target size={18} className="text-dark-900" />
            </div>
            <span className="font-heading font-bold text-base text-white tracking-tight">
              SkillGap
            </span>
          </motion.div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-full px-2 py-1 border border-white/[0.04]">
            {links.map(link => (
              <motion.button
                key={link.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate(link.id)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  currentView === link.id
                    ? 'text-dark-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {currentView === link.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-mm-green rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-full bg-mm-green/20 flex items-center justify-center">
                    <User size={12} className="text-mm-green" />
                  </div>
                  <span className="text-sm text-zinc-300">{user.username}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onLogout}
                  className="text-sm text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <LogOut size={14} />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onLogin}
                className="btn-primary text-sm px-5 py-2.5"
              >
                <LogIn size={14} />
                Sign In
              </motion.button>
            )}
          </div>

          {/* Mobile hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} className="text-white" /> : <Menu size={18} className="text-white" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-white/[0.06] bg-dark-900/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {links.map((link, i) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { onNavigate(link.id); setMobileOpen(false) }}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentView === link.id
                      ? 'text-dark-900 bg-mm-green'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                  <ChevronRight size={14} className={currentView === link.id ? 'text-dark-900' : 'text-zinc-600'} />
                </motion.button>
              ))}
              <div className="pt-3 border-t border-white/[0.06] mt-3">
                {user ? (
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-zinc-300">{user.username}</span>
                    <button onClick={onLogout} className="text-sm text-red-400">Logout</button>
                  </div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => { onLogin(); setMobileOpen(false) }}
                    className="w-full btn-primary text-sm py-3"
                  >
                    <LogIn size={14} />
                    Sign In
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}