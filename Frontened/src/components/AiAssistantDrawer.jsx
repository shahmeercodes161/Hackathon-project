import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/api';
import { Sparkles, Send, X, Bot, User, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import './AiAssistantDrawer.css';

export default function AiAssistantDrawer({ isOpen, onClose }) {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.name || 'there'}! I am your **HCM Lite AI Assistant**. You can ask me questions about attendance, leaves, headcount, policies, or test role-scoped queries.`,
      tag: 'AI-generated',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = {
    admin: [
      'Who is on leave today?',
      "What is this month's attendance rate?",
      'Who came late most often this month?',
      'How many active employees are in Engineering?',
      'What are the official attendance and leave policies?',
    ],
    hr: [
      'How many active employees are in Engineering?',
      'Who came late most often this month?',
      "What is this month's attendance rate?",
      'Who is on leave today?',
      'What is the current payroll summary for this month?',
    ],
    employee: [
      'How many sick leaves do I have left this year?',
      "What is my colleague's salary?",
      'I need next Monday and Tuesday off for my sister wedding',
      'What are the company office hours and late penalty rules?',
    ],
  };

  const currentPrompts = quickPrompts[role] || quickPrompts.employee;

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat(query);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer || 'No response generated.',
        tag: res.tag || 'AI-generated',
        toolCalled: res.toolCalled,
        latencyMs: res.latencyMs,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `⚠️ ${err.message || 'Error communicating with AI Assistant.'}`,
          tag: 'Error',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-drawer-overlay" onClick={onClose}>
      <div className="ai-drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-drawer-header">
          <div className="ai-header-title">
            <div className="ai-header-icon-box">
              <Sparkles size={20} className="ai-header-sparkle" />
            </div>
            <div>
              <h3>HCM Lite Assistant</h3>
              <span className="ai-role-badge">Role: {role?.toUpperCase() || 'GUEST'}</span>
            </div>
          </div>
          <button className="ai-close-btn" onClick={onClose} title="Close Assistant">
            <X size={20} />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="ai-quick-prompts-container">
          <span className="ai-quick-label">Suggested for {role}:</span>
          <div className="ai-quick-chips">
            {currentPrompts.map((p, idx) => (
              <button key={idx} className="ai-chip-btn" onClick={() => handleSend(p)} disabled={loading}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Feed */}
        <div className="ai-messages-feed">
          {messages.map((m) => (
            <div key={m.id} className={`ai-message-row ${m.sender}`}>
              <div className="ai-message-avatar">
                {m.sender === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="ai-message-content-wrapper">
                <div className="ai-message-bubble">
                  <div className="ai-message-text" style={{ whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </div>
                </div>
                <div className="ai-message-meta">
                  <span>{m.time}</span>
                  {m.tag && <span className="ai-tag-pill">{m.tag}</span>}
                  {m.latencyMs !== undefined && (
                    <span className="ai-latency-pill">
                      <Clock size={10} /> {m.latencyMs}ms
                    </span>
                  )}
                  {m.toolCalled && m.toolCalled !== 'none' && (
                    <span className="ai-tool-pill">Tool: {m.toolCalled}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-message-row assistant">
              <div className="ai-message-avatar">
                <Bot size={16} />
              </div>
              <div className="ai-message-bubble loading-bubble">
                <div className="ai-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <small style={{ color: '#8892b0', marginLeft: '8px' }}>Executing tool query against real DB...</small>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          className="ai-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="ai-input-field"
            placeholder={`Ask about attendance, leaves, headcount, policies...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="ai-send-btn" disabled={!input.trim() || loading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
