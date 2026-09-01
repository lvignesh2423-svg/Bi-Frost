import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
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
    <div className="min-h-screen bg-dark-900">
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        onLogin={() => setAuthView('login')}
        onLogout={handleLogout}
      />

      <div className="pt-16">
        {loadingAnalysis && (
          <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading your analysis...</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div key="home" {...pageVariants}>
              <Hero onGetStarted={handleGetStarted} onViewDemo={handleViewDemo} />
            </motion.div>
          )}

          {currentView === 'analysis' && (
            <motion.div key="analysis" {...pageVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {!resumeData ? (
                <div className="max-w-3xl mx-auto mt-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                  >
                    <h1 className="text-3xl font-heading font-bold text-white mb-2">
                      Upload Your <span className="gradient-text">Resume</span>
                    </h1>
                    <p className="text-gray-400">
                      We'll extract your skills and analyze gaps for any target job
                    </p>
                  </motion.div>
                  <UploadZone onResumeUploaded={handleResumeUploaded} />
                </div>
              ) : (
                <div>
                  {analysisResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">
                            Analysis for <span className="text-white font-medium">{resumeData.name || 'User'}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Target: {targetJob || 'Not specified'} · {completedSkills.length} skills completed
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentView('roadmap')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-colors"
                          >
                            View Roadmap →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <AnalysisPanel
                    resumeData={resumeData}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'roadmap' && (
            <motion.div key="roadmap" {...pageVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-heading font-bold text-white mb-2">
                  Your <span className="gradient-text">Roadmap</span>
                </h1>
                <p className="text-gray-400">
                  Visual learning path{targetJob ? ` for ${targetJob}` : ''}
                </p>
              </motion.div>

              {analysisResult ? (
                <>
                  <Roadmap
                    nodes={analysisResult.analysis?.roadmap_nodes || []}
                    bonusSkills={analysisResult.analysis?.bonus_skills || []}
                    completedSkills={completedSkills}
                  />
                  <LearningPath
                    steps={analysisResult.analysis?.learning_path || []}
                    completedSkills={completedSkills}
                    onToggleSkill={handleToggleSkill}
                    updating={updating}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading font-bold text-white">
                          {completedSkills.length > 0
                            ? `${completedSkills.length} skill${completedSkills.length !== 1 ? 's' : ''} completed`
                            : 'Ready to update your resume?'}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {completedSkills.length > 0
                            ? 'Update your resume with newly acquired skills'
                            : 'Mark skills as complete in the learning path above, then update your resume'}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentView('resume')}
                        className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
                      >
                        Update Resume →
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              ) : (
                <div className="glass-card p-12 text-center">
                  <p className="text-gray-400 mb-4">No analysis data yet</p>
                  <button
                    onClick={() => setCurrentView('analysis')}
                    className="btn-primary"
                  >
                    Run Analysis First
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'resume' && (
            <motion.div key="resume" {...pageVariants} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-heading font-bold text-white mb-2">
                  Resume <span className="gradient-text">Optimizer</span>
                </h1>
                <p className="text-gray-400">
                  Optimize, generate, and download your ATS-friendly resume
                </p>
              </motion.div>
              {resumeData ? (
                <ResumeRewriter
                  resumeText={resumeData.resume_text}
                  targetJob={targetJob}
                  completedSkills={completedSkills}
                />
              ) : (
                <div className="glass-card p-12 text-center">
                  <p className="text-gray-400 mb-4">Upload a resume first</p>
                  <button onClick={() => setCurrentView('analysis')} className="btn-primary">
                    Go to Analysis
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'mentor' && (
            <motion.div key="mentor" {...pageVariants} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <h1 className="text-3xl font-heading font-bold text-white mb-2">
                  AI <span className="gradient-text">Mentor</span>
                </h1>
                <p className="text-gray-400">
                  Ask anything about your career transition
                </p>
              </motion.div>
              <MentorChat analysisContext={analysisContext} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  )
}
