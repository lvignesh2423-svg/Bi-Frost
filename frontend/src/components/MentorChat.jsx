import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, Lightbulb } from 'lucide-react'

function renderMarkdown(text) {
  if (!text) return null

  const lines = text.split('\n')
  const elements = []
  let inList = false
  let listItems = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-zinc-200">{renderInline(item)}</li>
          ))}
        </ul>
      )
      listItems = []
    }
    inList = false
  }

  const flushNumberedList = (items) => {
    return (
      <ol className="list-decimal pl-5 space-y-1 my-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-zinc-200">{renderInline(item)}</li>
        ))}
      </ol>
    )
  }

  const renderInline = (text) => {
    const parts = []
    let remaining = text
    let key = 0

    while (remaining.length > 0) {
      let match = null

      match = remaining.match(/\*\*(.+?)\*\*/)
      if (match) {
        const idx = remaining.indexOf(match[0])
        if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
        parts.push(<strong key={key++} className="text-white font-semibold">{match[1]}</strong>)
        remaining = remaining.slice(idx + match[0].length)
        continue
      }

      match = remaining.match(/`(.+?)`/)
      if (match) {
        const idx = remaining.indexOf(match[0])
        if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-dark-800 text-mm-blue text-xs font-mono">
            {match[1]}
          </code>
        )
        remaining = remaining.slice(idx + match[0].length)
        continue
      }

      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    return parts
  }

  let numberedBuffer = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '') {
      flushList()
      if (numberedBuffer.length > 0) {
        elements.push(flushNumberedList(numberedBuffer))
        numberedBuffer = []
      }
      continue
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      if (numberedBuffer.length > 0) {
        elements.push(flushNumberedList(numberedBuffer))
        numberedBuffer = []
      }
      elements.push(
        <h3 key={elements.length} className="text-sm font-bold text-mm-blue mt-3 mb-1">
          {trimmed.slice(4)}
        </h3>
      )
      continue
    }

    if (trimmed.startsWith('## ')) {
      flushList()
      if (numberedBuffer.length > 0) {
        elements.push(flushNumberedList(numberedBuffer))
        numberedBuffer = []
      }
      elements.push(
        <h2 key={elements.length} className="text-base font-bold text-white mt-3 mb-1">
          {trimmed.slice(3)}
        </h2>
      )
      continue
    }

    if (trimmed.match(/^\d+\.\s/)) {
      flushList()
      numberedBuffer.push(trimmed.replace(/^\d+\.\s/, ''))
      continue
    } else if (numberedBuffer.length > 0) {
      elements.push(flushNumberedList(numberedBuffer))
      numberedBuffer = []
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true
      listItems.push(trimmed.slice(2))
      continue
    }

    flushList()
    elements.push(
      <p key={elements.length} className="text-sm text-zinc-200 leading-relaxed my-1">
        {renderInline(trimmed)}
      </p>
    )
  }

  flushList()
  if (numberedBuffer.length > 0) {
    elements.push(flushNumberedList(numberedBuffer))
  }

  return elements
}

export default function MentorChat({ analysisContext }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI career mentor. I've analyzed your resume and skill gaps. Ask me anything about your learning path, specific skills, or career strategy!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMessage = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { mentorChat } = await import('../utils/api.js')
      const result = await mentorChat({
        message: msg,
        context: analysisContext || {},
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      })

      setMessages(prev => [...prev, { role: 'assistant', content: result.reply }])
      setSuggestions(result.suggestions || [])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bento-card flex flex-col h-[600px]">
      <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mm-blue to-mm-purple flex items-center justify-center">
          <Bot size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-heading font-semibold text-white text-base">AI Mentor</h2>
          <p className="text-xs text-zinc-500">Context-aware career guidance</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-mm-green/15'
                  : 'bg-gradient-to-br from-mm-blue to-mm-purple'
              }`}>
                {msg.role === 'user' ? (
                  <User size={14} className="text-mm-green" />
                ) : (
                  <Bot size={14} className="text-white" />
                )}
              </div>
              <div className={`max-w-[85%] p-3 rounded-xl ${
                msg.role === 'user'
                  ? 'bg-mm-green/10 border border-mm-green/15 text-white'
                  : 'bg-dark-600 border border-white/[0.04] text-zinc-200'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose-sm">{renderMarkdown(msg.content)}</div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mm-blue to-mm-purple flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="p-3 rounded-xl bg-dark-600 border border-white/[0.04]">
              <Loader2 size={16} className="animate-spin text-mm-blue" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && !loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-dark-600 border border-white/[0.06] text-zinc-300 hover:border-mm-blue/30 hover:text-mm-blue transition-all"
            >
              <Lightbulb size={10} className="inline mr-1" />
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-white/[0.04]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your skill gaps, learning path, career strategy..."
            className="input-dark flex-1 text-sm"
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 py-2 disabled:opacity-50"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}