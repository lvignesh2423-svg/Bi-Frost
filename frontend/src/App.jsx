import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import UploadZone from './components/UploadZone'
import AnalysisPanel from './components/AnalysisPanel'
import Roadmap from './components/Roadmap'
import LearningPath from './components/LearningPath'
import ResumeRewriter from './components/ResumeRewriter'
import MentorChat from './components/MentorChat'
import Footer from './components/Footer'
import { updateProgress, getLatestAnalysis } from './utils/api'

const pageVariants = {
  initial: { opacity: 0, y: 40, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -20, filter: 'blur(4px)' },
}

const pageTransition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-mm-green via-mm-blue to-mm-purple origin-left z-[60]"
      style={{ scaleX }}
    />
  )
}

function SectionReveal({ children, className = '' }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.7"]
  })
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const y = useTransform(scrollYProgress, [0, 1], [60, 0])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const DEMO_DATA = {
  resume_text: `John Smith
Email: john.smith@email.com
Phone: 555-0123

Experience:
- 3 years as Software Developer at Tech Corp
- Built REST APIs using Python and Flask
- Managed PostgreSQL databases
- Used Git for version control
- Led a team of 3 junior developers
- Created automated testing scripts with pytest

Skills: Python, JavaScript, HTML, CSS, SQL, Git, Flask, PostgreSQL, React basics
Education: BS Computer Science, State University 2020
Certifications: AWS Cloud Practitioner`,
  name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '555-0123',
  experience_years: 3,
  education: ['BS Computer Science, State University 2020'],
  certifications: ['AWS Cloud Practitioner'],
  projects: [],
  skills: [
    { name: 'Python', category: 'hard', level: 'intermediate', years_experience: 3 },
    { name: 'JavaScript', category: 'hard', level: 'beginner', years_experience: 1 },
    { name: 'SQL', category: 'hard', level: 'intermediate', years_experience: 2 },
    { name: 'Git', category: 'hard', level: 'intermediate', years_experience: 3 },
    { name: 'Flask', category: 'hard', level: 'intermediate', years_experience: 2 },
    { name: 'PostgreSQL', category: 'hard', level: 'intermediate', years_experience: 2 },
    { name: 'HTML', category: 'hard', level: 'beginner', years_experience: 1 },
    { name: 'CSS', category: 'hard', level: 'beginner', years_experience: 1 },
  ],
}

export default function App() {
  const [currentView, setCurrentView] = useState('home')
  const [resumeData, setResumeData] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [targetJob, setTargetJob] = useState('')
  const [user, setUser] = useState(null)
  const [authView, setAuthView] = useState(null)
  const [completedSkills, setCompletedSkills] = useState([])
  const [updating, setUpdating] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    if (token && username) {
      setUser({ token, username })
      loadLatestAnalysis(token)
    }
  }, [])

  const loadLatestAnalysis = async (token) => {
    setLoadingAnalysis(true)
    try {
      const data = await getLatestAnalysis()
      if (data.found && data.analysis) {
        setAnalysisResult({
          session_id: data.session_id,
          analysis: data.analysis,
        })
        setTargetJob(data.target_job || '')
        setCompletedSkills(data.completed_skills || [])
        setResumeData({
          resume_text: data.resume_text || '',
          name: data.analysis?.matched_skills?.[0]?.name || 'User',
        })
        setCurrentView('analysis')
      }
    } catch (err) {
      console.log('No previous analysis found')
    }
    setLoadingAnalysis(false)
  }

  const handleLogin = async (data) => {
    setUser(data)
    setAuthView(null)
    await loadLatestAnalysis(data.token)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUser(null)
    setResumeData(null)
    setAnalysisResult(null)
    setCompletedSkills([])
    setCurrentView('home')
  }

  const handleResumeUploaded = useCallback((data) => {
    setResumeData(data)
    setCurrentView('analysis')
  }, [])

  const handleAnalysisComplete = useCallback((result) => {
    setAnalysisResult(result)
    setTargetJob(result.analysis?.target_job || '')
    setCompletedSkills([])
  }, [])

  const handleGetStarted = () => {
    if (!user) {
      setAuthView('login')
    } else {
      setCurrentView('analysis')
    }
  }

  const handleViewDemo = () => {
    setResumeData(DEMO_DATA)
    setCurrentView('analysis')
  }

  const handleToggleSkill = useCallback(async (skillName, completed) => {
    setUpdating(true)
    setCompletedSkills(prev => {
      if (completed) return [...prev, skillName]
      return prev.filter(s => s !== skillName)
    })

    if (analysisResult?.session_id && user?.token) {
      try {
        const result = await updateProgress(analysisResult.session_id, {
          skill_name: skillName,
          completed,
        })
        if (result.readiness_score !== undefined) {
          setAnalysisResult(prev => ({
            ...prev,
            analysis: {
              ...prev.analysis,
              readiness_score: result.readiness_score,
            }
          }))
        }
      } catch (err) {
        console.error('Progress update failed:', err)
      }
    }
    setUpdating(false)
  }, [analysisResult, user])

  const analysisContext = analysisResult ? {
    resume_name: resumeData?.name,
    target_job: targetJob,
    readiness_score: analysisResult.analysis?.readiness_score,
    skill_gaps: analysisResult.analysis?.skill_gaps?.map(g => g.skill_name),
    matched_skills: analysisResult.analysis?.matched_skills?.map(s => s.name),
    completed_skills: completedSkills,
  } : {}

  if (authView === 'login') {
    return <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} />
  }
  if (authView === 'register') {
    return <RegisterPage onRegister={handleLogin} onSwitchToLogin={() => setAuthView('login')} />
  }

  return (
    <div className="min-h-screen bg-dark-900 relative">
      <div className="noise-overlay" />
      <ScrollProgress />
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        onLogin={() => setAuthView('login')}
        onLogout={handleLogout}
      />

      <div className="pt-16">
        {loadingAnalysis && (
          <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Loading your analysis...</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <Hero onGetStarted={handleGetStarted} onViewDemo={handleViewDemo} />
            </motion.div>
          )}

          {currentView === 'analysis' && (
            <motion.div
              key="analysis"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            >
              {!resumeData ? (
                <div className="max-w-3xl mx-auto mt-12">
                  <SectionReveal>
                    <div className="text-center mb-10">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mm-green/20 bg-mm-green/5 mb-6">
                        <div className="w-2 h-2 rounded-full bg-mm-green animate-pulse" />
                        <span className="text-sm font-medium text-mm-green">Step 1</span>
                      </div>
                      <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
                        Upload Your <span className="gradient-text">Resume</span>
                      </h1>
                      <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                        We'll extract your skills and analyze gaps for any target job
                      </p>
                    </div>
                  </SectionReveal>
                  <SectionReveal>
                    <UploadZone onResumeUploaded={handleResumeUploaded} />
                  </SectionReveal>
                </div>
              ) : (
                <div>
                  {analysisResult && (
                    <SectionReveal>
                      <div className="bento-card mb-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-mm-green/10 flex items-center justify-center">
                              <span className="text-xl">🎯</span>
                            </div>
                            <div>
                              <p className="text-sm text-zinc-400">
                                Analysis for <span className="text-white font-medium">{resumeData.name || 'User'}</span>
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                Target: {targetJob || 'Not specified'} · {completedSkills.length} skills completed
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setCurrentView('roadmap')}
                              className="btn-secondary text-sm px-5 py-2.5"
                            >
                              View Roadmap <span className="ml-1">→</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </SectionReveal>
                  )}
                  <SectionReveal>
                    <AnalysisPanel
                      resumeData={resumeData}
                      onAnalysisComplete={handleAnalysisComplete}
                    />
                  </SectionReveal>
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'roadmap' && (
            <motion.div
              key="roadmap"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
            >
              <SectionReveal>
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mm-blue/20 bg-mm-blue/5 mb-6">
                    <div className="w-2 h-2 rounded-full bg-mm-blue animate-pulse" />
                    <span className="text-sm font-medium text-mm-blue">Step 2</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
                    Your <span className="gradient-text">Roadmap</span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    Visual learning path{targetJob ? ` for ${targetJob}` : ''}
                  </p>
                </div>
              </SectionReveal>

              {analysisResult ? (
                <>
                  <SectionReveal>
                    <Roadmap
                      nodes={analysisResult.analysis?.roadmap_nodes || []}
                      bonusSkills={analysisResult.analysis?.bonus_skills || []}
                      completedSkills={completedSkills}
                    />
                  </SectionReveal>
                  <SectionReveal>
                    <LearningPath
                      steps={analysisResult.analysis?.learning_path || []}
                      completedSkills={completedSkills}
                      onToggleSkill={handleToggleSkill}
                      updating={updating}
                    />
                  </SectionReveal>
                  <SectionReveal>
                    <div className="bento-card">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-mm-purple/10 flex items-center justify-center">
                            <span className="text-xl">📝</span>
                          </div>
                          <div>
                            <h3 className="font-heading font-bold text-white">
                              {completedSkills.length > 0
                                ? `${completedSkills.length} skill${completedSkills.length !== 1 ? 's' : ''} completed`
                                : 'Ready to update your resume?'}
                            </h3>
                            <p className="text-sm text-zinc-400 mt-1">
                              {completedSkills.length > 0
                                ? 'Update your resume with newly acquired skills'
                                : 'Mark skills as complete in the learning path above, then update your resume'}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCurrentView('resume')}
                          className="btn-primary text-sm px-6 py-3"
                        >
                          Update Resume <span className="ml-1">→</span>
                        </motion.button>
                      </div>
                    </div>
                  </SectionReveal>
                </>
              ) : (
                <SectionReveal>
                  <div className="bento-card p-16 text-center">
                    <p className="text-zinc-400 mb-6 text-lg">No analysis data yet</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentView('analysis')}
                      className="btn-primary"
                    >
                      Run Analysis First
                    </motion.button>
                  </div>
                </SectionReveal>
              )}
            </motion.div>
          )}

          {currentView === 'resume' && (
            <motion.div
              key="resume"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
            >
              <SectionReveal>
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mm-purple/20 bg-mm-purple/5 mb-6">
                    <div className="w-2 h-2 rounded-full bg-mm-purple animate-pulse" />
                    <span className="text-sm font-medium text-mm-purple">Step 3</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
                    Resume <span className="gradient-text-alt">Optimizer</span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    Optimize, generate, and download your ATS-friendly resume
                  </p>
                </div>
              </SectionReveal>
              {resumeData ? (
                <SectionReveal>
                  <ResumeRewriter
                    resumeText={resumeData.resume_text}
                    targetJob={targetJob}
                    completedSkills={completedSkills}
                  />
                </SectionReveal>
              ) : (
                <SectionReveal>
                  <div className="bento-card p-16 text-center">
                    <p className="text-zinc-400 mb-6 text-lg">Upload a resume first</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentView('analysis')}
                      className="btn-primary"
                    >
                      Go to Analysis
                    </motion.button>
                  </div>
                </SectionReveal>
              )}
            </motion.div>
          )}

          {currentView === 'mentor' && (
            <motion.div
              key="mentor"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            >
              <SectionReveal>
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mm-orange/20 bg-mm-orange/5 mb-6">
                    <div className="w-2 h-2 rounded-full bg-mm-orange animate-pulse" />
                    <span className="text-sm font-medium text-mm-orange">AI Mentor</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
                    AI <span className="gradient-text">Mentor</span>
                  </h1>
                  <p className="text-zinc-400 text-lg">
                    Ask anything about your career transition
                  </p>
                </div>
              </SectionReveal>
              <SectionReveal>
                <MentorChat analysisContext={analysisContext} />
              </SectionReveal>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-20">
        <Footer />
      </div>
    </div>
  )
}