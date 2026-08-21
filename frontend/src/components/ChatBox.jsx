import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Check, 
  ArrowRight, 
  MapPin, 
  Building2, 
  CloudSun, 
  Utensils, 
  Compass, 
  DollarSign, 
  RefreshCw,
  Zap
} from 'lucide-react';
import api from '../services/api';

export const ChatBox = ({ tripId, destination = 'Ooty', onActionExecute, onPlanTrip }) => {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I'm your **TripPulse AI Assistant** for **${destination}**. I have real-time access to your trip dates, budget, group size, and local weather forecasts. How can I help enhance your journey today?`,
      suggested_actions: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick Action Chips from User Requirements
  const quickActions = [
    { label: 'Plan a trip', icon: Compass, prompt: `Plan a personalized trip itinerary for ${destination}` },
    { label: 'Find hotels', icon: Building2, prompt: `Find the best recommended hotels and homestays in ${destination}` },
    { label: 'Find attractions', icon: MapPin, prompt: `What are the top must-visit tourist attractions in ${destination}?` },
    { label: 'Optimize itinerary', icon: Zap, prompt: `Optimize my daily timeline route to save travel time in ${destination}` },
    { label: 'Suggest restaurants', icon: Utensils, prompt: `Suggest top rated local restaurants and food spots in ${destination}` },
    { label: "What's the weather?", icon: CloudSun, prompt: `What is the current weather forecast and packing guide for ${destination}?` },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || loading) return;

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
            content: 'AI Assistant temporarily unavailable. Please check your network and try again in a moment.'
          }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Here are great suggestions for ${destination}: Visit Botanical Garden, Doddabetta Peak, and Avalanche Lake. Best local cuisine: Tea factory cafes and local south Indian bakeries.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '650px', padding: 0, overflow: 'hidden' }}>
      
      {/* Assistant Header */}
      <div style={{
        padding: '16px 24px',
        background: 'var(--brand-gradient)',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}>
            <Bot size={22} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>TripPulse AI Concierge</span>
              <Sparkles size={14} color="#F4C95D" />
            </div>
            <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.85)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399' }} />
              Active Context: {destination}
            </div>
          </div>
        </div>

        <span className="badge badge-teal" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
          GPT Travel Engine
        </span>
      </div>

      {/* Quick Action Chips Bar */}
      <div style={{
        padding: '10px 18px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(action.prompt)}
              className="chip"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <Icon size={13} color="var(--primary)" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px', background: 'var(--bg-main)' }}>
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
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                  border: '1px solid var(--primary)'
                }}>
                  <Sparkles size={16} color="var(--primary)" />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isUser ? 'var(--cta-gradient)' : 'var(--bg-card)',
                    border: isUser ? 'none' : '1px solid var(--border)',
                    boxShadow: isUser ? 'var(--shadow-glow)' : 'var(--shadow-card)',
                    color: isUser ? '#FFFFFF' : 'var(--text-main)',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {m.content}
                </div>

                {/* Suggested Action Proposal Card */}
                {m.suggested_actions && m.suggested_actions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {m.suggested_actions.map((act, idx) => (
                      <div
                        key={idx}
                        className="glass-card"
                        style={{
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          border: '1px solid var(--primary)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>
                            {act.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {act.description}
                          </div>
                        </div>

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onActionExecute && onActionExecute(act)}
                        >
                          <span>Confirm</span>
                          <ArrowRight size={13} />
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
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={16} color="var(--primary)" />
            </div>
            <div className="glass-card" style={{
              padding: '12px 18px',
              borderRadius: '18px 18px 18px 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
              color: 'var(--text-muted)'
            }}>
              <RefreshCw size={15} className="animate-spin" color="var(--primary)" />
              <span>Thinking with {destination} context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          padding: '16px 20px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          placeholder={`Ask about ${destination} places, weather, budget, hotels...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="form-input"
          style={{ flex: 1, padding: '12px 16px' }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !inputMessage.trim()}
          style={{ padding: '12px 20px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
