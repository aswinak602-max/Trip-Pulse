import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Sparkles, Check, ArrowRight, CornerDownLeft, RefreshCw } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

export const ChatBox = ({ tripId, destination = 'Ooty', onActionExecute }) => {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I'm your **AI Tourist Assistant** for **${destination}**. I have full context of your trip dates, budget, group size, and weather. How can I assist your travel plans today?`,
      suggested_actions: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'What should I visit in Ooty?',
    'Is the weather suitable for outdoor treks?',
    'How can I optimize and reduce my trip budget?',
    'What clothes and items should I pack?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/chat', {
        trip_id: tripId,
        message: text
      });

      if (res.success && res.data) {
        const assistantMsg = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: res.data.reply,
          suggested_actions: res.data.suggested_actions || []
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: 'AI Assistant temporarily unavailable. Please try again in a moment.'
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to reach AI server. Fallback: Check the Itinerary or Weather tabs for details.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '640px', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(88, 28, 135, 0.3))',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
          }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>
              AI Tourist Assistant
            </div>
            <div style={{ fontSize: '0.74rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
              Context-Aware • {destination} Mode
            </div>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '10px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {!isUser && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px'
                }}>
                  <Sparkles size={14} color="#a5b4fc" />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser ? 'var(--accent-gradient)' : 'rgba(31, 41, 55, 0.8)',
                    border: isUser ? 'none' : '1px solid var(--border)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {m.content}
                </div>

                {/* Suggested Action Proposal Card */}
                {m.suggested_actions && m.suggested_actions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    {m.suggested_actions.map((act, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#93c5fd' }}>
                            {act.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {act.description}
                          </div>
                        </div>

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onActionExecute && onActionExecute(act)}
                        >
                          Confirm <ArrowRight size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={14} color="#a5b4fc" />
            </div>
            <div style={{
              padding: '10px 16px',
              borderRadius: '16px 16px 16px 4px',
              background: 'rgba(31, 41, 55, 0.8)',
              border: '1px solid var(--border)'
            }}>
              <LoadingSpinner text="Thinking with trip context..." />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(17, 24, 39, 0.6)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.color = '#93c5fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          padding: '14px 20px',
          background: 'rgba(17, 24, 39, 0.95)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '10px'
        }}
      >
        <input
          type="text"
          placeholder="Ask tourist assistant about places, weather, budget..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="form-input"
          style={{ flex: 1, padding: '10px 14px' }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !inputMessage.trim()}
          style={{ padding: '0 16px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
