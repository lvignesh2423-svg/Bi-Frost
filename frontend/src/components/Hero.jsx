import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { ArrowRight, Zap, Map, Brain, BarChart3, ChevronDown, Shield, Rocket, Target } from 'lucide-react'

function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    let mouseX = 0
    let mouseY = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.opacity = Math.random() * 0.5 + 0.1
        this.color = ['rgba(186,242,74,', 'rgba(137,176,255,', 'rgba(208,117,255,'][Math.floor(Math.random() * 3)]
      }
      update() {
        this.x += this.speedX
        this.y += this.speedY

        const dx = mouseX - this.x
        const dy = mouseY - this.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          this.x -= dx * 0.002
          this.y -= dy * 0.002
        }

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color + this.opacity + ')'
        ctx.fill()
      }
    }

    for (let i = 0; i < 80; i++) {
      particles.push(new Particle())
    }

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(186, 242, 74, ${0.03 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.update()
        p.draw()
      })
      connectParticles()
      animationId = requestAnimationFrame(animate)
    }
    animate()

    const handleMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

function FeatureCard({ icon: Icon, label, desc, color, delay }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="bento-card group cursor-default"
      style={{ '--accent': color }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110"
        style={{ background: `${color}15` }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 font-heading">{label}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

function StatCard({ value, label, color, delay }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="text-center p-6"
    >
      <div className="text-4xl md:text-5xl font-bold font-heading mb-2" style={{ color }}>
        {value}
      </div>
      <div className="text-sm text-zinc-500">{label}</div>
    </motion.div>
  )
}

export default function Hero({ onGetStarted, onViewDemo }) {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])

  const features = [
    { icon: Brain, label: 'AI-Powered Analysis', desc: 'Deep skill gap detection using advanced language models to understand your unique profile.', color: '#baf24a' },
    { icon: Map, label: 'Visual Roadmaps', desc: 'Interactive learning paths tailored to your goals with phase-by-phase progression.', color: '#89b0ff' },
    { icon: BarChart3, label: 'Readiness Score', desc: 'Real-time readiness percentage that updates as you complete skills.', color: '#d075ff' },
    { icon: Zap, label: 'Instant Results', desc: 'Complete analysis in seconds, not hours. Start your journey immediately.', color: '#f8893a' },
  ]

  return (
    <div ref={containerRef} className="relative">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            style={{ y: y1 }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            <div className="w-full h-full bg-mm-green/[0.06] rounded-full animate-pulse-slow" />
          </motion.div>
          <motion.div
            style={{ y: y2 }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          >
            <div className="w-full h-full bg-mm-blue/[0.05] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
          </motion.div>
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1 }}
          >
            <div className="w-full h-full bg-mm-purple/[0.04] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
          </motion.div>
        </div>

        <motion.div
          style={{ opacity, scale }}
          className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-24"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-mm-green/20 bg-mm-green/5 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-mm-green animate-pulse" />
            <span className="text-sm font-medium text-mm-green">AI-Powered Career Intelligence</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl lg:text-8xl font-bold mb-8 leading-[0.95] tracking-tight font-heading"
          >
            <span className="text-white block">Where your</span>
            <span className="gradient-text block mt-2">career lives</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Upload your resume, pick your dream job, and discover exactly
            what skills you need to get there. Your career GPS.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="btn-primary text-base px-10 py-4"
            >
              Get Started <ArrowRight size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onViewDemo}
              className="btn-secondary text-base px-10 py-4"
            >
              View Demo
            </motion.button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="scroll-indicator"
          >
            <ChevronDown size={24} className="text-zinc-500 mx-auto" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bento-card"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
              <StatCard value="50+" label="Job Roles" color="#baf24a" delay={0.1} />
              <StatCard value="200+" label="Skills Tracked" color="#89b0ff" delay={0.2} />
              <StatCard value="95%" label="Accuracy" color="#d075ff" delay={0.3} />
              <StatCard value="3s" label="Analysis Time" color="#f8893a" delay={0.4} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
              Everything you need to
              <br />
              <span className="gradient-text">level up your career</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              From skill analysis to resume optimization, we've got your entire career journey covered.
            </p>
          </motion.div>

          <div className="bento-grid">
            {features.map((f, i) => (
              <div key={f.label} className="bento-col-6 md:bento-col-3">
                <FeatureCard {...f} delay={i * 0.1} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading">
              How it <span className="gradient-text-alt">works</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Three simple steps to transform your career trajectory.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Target, title: 'Upload Resume', desc: 'Share your resume and let our AI extract your skills, experience, and education.', color: '#baf24a' },
              { step: '02', icon: Brain, title: 'Analyze Gaps', desc: 'Enter your target job and see exactly what skills you need to develop.', color: '#89b0ff' },
              { step: '03', icon: Rocket, title: 'Launch Career', desc: 'Follow your personalized roadmap and optimize your resume for the job.', color: '#d075ff' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className="bento-card relative overflow-hidden group"
              >
                <div
                  className="absolute top-0 right-0 text-[120px] font-bold leading-none opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
                  style={{ color: item.color }}
                >
                  {item.step}
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: `${item.color}15` }}
                >
                  <item.icon size={24} style={{ color: item.color }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 font-heading">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="gradient-border p-12 md:p-16"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-mm-green/[0.03] via-transparent to-mm-purple/[0.03] rounded-3xl" />
            <div className="relative z-10">
              <Shield size={40} className="text-mm-green mx-auto mb-6" />
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-heading">
                Ready to transform<br />
                <span className="gradient-text">your career?</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
                Join thousands of professionals who've accelerated their career growth with AI-powered insights.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onGetStarted}
                className="btn-primary text-lg px-12 py-5"
              >
                Start Your Journey <ArrowRight size={20} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}