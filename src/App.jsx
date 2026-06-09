import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import './App.css'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const starterMessages = [
  {
    id: 1,
    role: 'bot',
    text: '👋 Hello! I am your AI assistant. Ask me anything about coding, career guidance, study plans, fitness, writing, or daily productivity.',
  },
]

async function fetchBotReply(text, messages = []) {
  try {
    // ✅ FIX 1: env check (this is your production issue)
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    if (!apiKey) {
      console.error('❌ Missing VITE_GROQ_API_KEY in production env')
      return '⚠️ API key missing. Please configure environment variable VITE_GROQ_API_KEY.'
    }

    const conversationHistory = messages.map((msg) => ({
      role: msg.role === 'bot' ? 'assistant' : 'user',
      content: msg.text,
    }))

    const { data } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `
You are an expert AI assistant.

u created by bhuvan alias bhuvanesh.

Always format responses professionally using:
give only few lines of information and if user ask for more details then give more information.
# Main Headings
## Sub Headings

- Bullet points
- Numbered lists

if someone text bhu bhu or bu bu then user name is tejuu...😊  no headings just simple msgs.

Use code blocks with language names:

\`\`\`javascript
const x = 10;
\`\`\`

Use tables when comparing items.

Keep responses clean, structured, and easy to read.
            `,
          },
          ...conversationHistory,
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return data.choices[0].message.content
  } catch (error) {
    console.error('❌ Groq API Error:', error?.response?.data || error.message)

    // FIX 2: show real issue instead of silent fail
    return 'Sorry, I am unable to respond right now. Check API key or network.'
  }
}

function App() {
  const [messages, setMessages] = useState(starterMessages)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, typing])

  // FIX 3: safe localStorage load
  useEffect(() => {
    const saved = localStorage.getItem('chat-history')

    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (e) {
        console.error('Invalid chat history')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('chat-history', JSON.stringify(messages))
  }, [messages])

  const sendMessage = async (value) => {
    const text = value.trim()
    if (!text) return

    const userMessage = { id: Date.now(), role: 'user', text }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setTyping(true)

    try {
      const reply = await fetchBotReply(text, [...messages, userMessage])

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', text: reply },
      ])
    } finally {
      setTyping(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  const quickPrompts = [
    'Create a study plan',
    'Explain React hooks',
    'Build a Django API',
    'Review my resume',
    'Weight loss diet plan',
    'Interview questions',
  ]

  return (
    <main className="chat-shell">
      <aside className="profile-panel">
     <div className="profile-badge">✨ AI Companion • By Bhuvan</div>
        <button
          type="button"
          className="new-chat-btn"
          onClick={() => setMessages(starterMessages)}
        >
          + New chat
        </button>

        <section className="panel-card">
          <p className="panel-label">Workspace</p>
          <h1>Personal Chat Bot</h1>
          <p className="profile-copy">
            A polished assistant workspace for planning, writing, and everyday ideas.
          </p>
        </section>

        <section className="panel-card">
          <p className="panel-label">Recent chats</p>
          <ul className="conversation-list">
            <li>Daily planning</li>
            <li>Creative ideas</li>
            <li>Quick summaries</li>
          </ul>
        </section>

        <section className="panel-card compact">
          <p className="panel-label">Quick actions</p>
          <div className="chip-row">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chip"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Modern assistant</p>
            <h2>Chat with your personal AI</h2>
          </div>
          <div className="status-group">
            {/* <span className="mini-stat">Fast</span> */}
            <span className="status-pill">Free Model</span>
          </div>
        </header>

        {/* <div className="top-grid">
          <article className="mini-card accent-card">
            <p>Today’s focus</p>
            <strong>Plan, write, and organize with clarity.</strong>
          </article>
          <article className="mini-card">
            <p>Response style</p>
            <strong>Friendly, concise, and professional.</strong>
          </article>
          <article className="mini-card">
            <p>Mode</p>
            <strong>Personal productivity assistant</strong>
          </article>
        </div> */}

        <div className="messages">
          {messages.map((message) => (
            <article
              key={message.id}
              className={message.role === 'bot' ? 'bubble bot' : 'bubble user'}
            >
              {message.role === 'bot' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')

                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              ) : (
                <p>{message.text}</p>
              )}
            </article>
          ))}

          {typing ? <p className="typing">Assistant is thinking…</p> : null}
          <div ref={messagesEndRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your message here..."
            aria-label="Chat input"
          />
          <button type="submit">Send</button>
        </form>
      </section>
    </main>
  )
}

export default App