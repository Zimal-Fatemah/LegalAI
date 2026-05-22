import { useState, useRef, useEffect } from 'react';
import {
  Globe, Telescope, Mic, ArrowUp,
  BookOpen, Code2, Coffee, ImageIcon, FlaskConical,
  ChevronDown,
} from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import TypingIndicator from '../components/TypingIndicator';
import { api } from '../services/api';

/* ─── Design tokens (Dynamic) ───────────────────────────── */
const getTokens = (darkMode) => ({
  BG: darkMode ? '#1a1a1a' : '#fbf7ef',
  CARD_BG: darkMode ? 'rgba(38,38,38,0.7)' : 'rgba(225,229,230,0.5)',
  CARD_BORDER: darkMode ? 'rgba(60,60,60,0.5)' : 'rgba(189,196,198,0.5)',
  FG: darkMode ? '#ffffff' : '#24252d',
  FG_SECONDARY: darkMode ? '#d4a85a' : '#b0823a',
  FG_MUTED: darkMode ? '#a0a09e' : '#61686b',
  PLACEHOLDER: darkMode ? '#737373' : '#838b8e',
  darkMode
});

/* ─── Spectre gradient background (right-side glow) ─────── */
function Spectre({ darkMode }) {
  return (
    <>
      {/* Right-side gradients */}
      <div
        style={{
          position: 'absolute',
          top: '0.5px',
          bottom: '-1.5px',
          right: 0,
          width: '756px',
          opacity: darkMode ? 0.4 : 0.8,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* warm amber blob */}
        <div
          style={{
            position: 'absolute',
            top: '280px',
            left: '18px',
            width: '650px',
            height: '327px',
            borderRadius: '50%',
            background: darkMode 
              ? 'radial-gradient(ellipse, rgba(212, 168, 90, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(222, 181, 105, 0.45) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* teal/sage blob */}
        <div
          style={{
            position: 'absolute',
            top: '465px',
            left: '-2px',
            width: '671px',
            height: '522px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(43, 160, 132, 0.1) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(161,197,193,0.35) 0%, transparent 70%)',
            filter: 'blur(50px)',
            transform: 'rotate(-15deg)',
          }}
        />
      </div>
      
      {/* Left-side gradients */}
      <div
        style={{
          position: 'absolute',
          top: '0.5px',
          bottom: '-1.5px',
          left: 0,
          width: '756px',
          opacity: darkMode ? 0.3 : 0.6,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* warm amber blob - left upper */}
        <div
          style={{
            position: 'absolute',
            top: '120px',
            right: '18px',
            width: '600px',
            height: '300px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(212, 168, 90, 0.12) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(222, 181, 105, 0.4) 0%, transparent 70%)',
            filter: 'blur(45px)',
          }}
        />
        {/* teal/sage blob - left */}
        <div
          style={{
            position: 'absolute',
            top: '200px',
            right: '-20px',
            width: '650px',
            height: '480px',
            borderRadius: '50%',
            background: darkMode
              ? 'radial-gradient(ellipse, rgba(43, 160, 132, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(ellipse, rgba(161,197,193,0.3) 0%, transparent 70%)',
            filter: 'blur(55px)',
            transform: 'rotate(15deg)',
          }}
        />
      </div>
    </>
  );
}

/* ─── Navbar ─────────────────────────────────────────────── */
function Navbar({ tokens, onOpenQuiz }) {
  return (
    <div
      style={{
        height: '66px',
        background: tokens.BG,
        borderBottom: `1px solid ${tokens.CARD_BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Left: Logo + model selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4.5px', padding: '5.7px 9px' }}>
          {/* Logo icon placeholder – a small circle representing the Discourse mark */}
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #b0823a 0%, #24252d 100%)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 400,
              fontSize: '22.7px',
              color: tokens.FG,
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
            }}
          >
            LegalAI
          </span>
        </div>

        {/* Divider slash */}
        <span
          style={{
            fontFamily: "'Geist', sans-serif",
            fontWeight: 400,
            fontSize: '22px',
            color: tokens.PLACEHOLDER,
            lineHeight: 1,
          }}
        >
          /
        </span>

        {/* Model selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 600,
              fontSize: '12px',
              color: tokens.FG,
              whiteSpace: 'nowrap',
            }}
          >
            lex-fast
          </span>
       
        </div>
      </div>

      {/* Right: Share + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onOpenQuiz}
          style={{
            background: 'linear-gradient(135deg, #c89b4a 0%, #9d7031 100%)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '10px',
            padding: '6px 12px',
            minWidth: '124px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0px 6px 18px rgba(176,130,58,0.28)',
          }}
        >
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '20px',
              color: 'white',
              whiteSpace: 'nowrap',
            }}
          >
            Generate Quiz
          </span>
        </button>

        <button
          style={{
            background: tokens.darkMode ? 'rgba(50,50,50,0.7)' : 'rgba(225,229,230,0.7)',
            backdropFilter: 'blur(16px)',
            border: 'none',
            borderRadius: '8px',
            padding: '2px 12px',
            minWidth: '64px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '24px',
              color: tokens.FG,
            }}
          >
            Share
          </span>
        </button>

        {/* Avatar */}
        <div
          style={{
            background: 'rgba(255,115,0,0.6)',
            backdropFilter: 'blur(16px)',
            borderRadius: '6px',
            padding: '2px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Geist', sans-serif",
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '24px',
              color: tokens.FG,
            }}
          >
            S
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Chatbox (input box) ─────────────────────────────── */
function AIChatbox({ value, onChange, onSend, onKeyDown, mode, onModeChange, tokens }) {
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const hasText = value.trim().length > 0;
  const modes = ['Student', 'Lawyer', 'Citizen'];

  return (
    <div
      style={{
        width: '650px',
        background: tokens.CARD_BG,
        backdropFilter: 'blur(42px)',
        borderRadius: '16px',
        padding: '18px 24px',
        boxShadow: tokens.darkMode ? '0px 4px 24px 0px rgba(0,0,0,0.2)' : '0px 4px 24px 0px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        border: `1px solid ${tokens.CARD_BORDER}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '87px',
          justifyContent: 'space-between',
        }}
      >
        {/* Textarea */}
        <textarea
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Ask anything"
          rows={2}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: "'Geist', sans-serif",
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: 1.4,
            color: tokens.FG,
            width: '100%',
            flex: 1,
          }}
        />

        {/* Bottom row: tools + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '28px' }}>
          {/* Left tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            {/* Mode Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                style={{
                  background: tokens.PLACEHOLDER,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Geist', sans-serif",
                    fontWeight: 500,
                    fontSize: '12px',
                    color: 'white',
                  }}
                >
                  {mode || 'Mode'}
                </span>
                <ChevronDown size={14} color="white" />
              </button>
              
              {showModeDropdown && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 40,
                    }}
                    onClick={() => setShowModeDropdown(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '36px',
                      left: 0,
                      background: tokens.BG,
                      border: `1px solid ${tokens.CARD_BORDER}`,
                      borderRadius: '8px',
                      boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
                      zIndex: 50,
                      minWidth: '140px',
                      overflow: 'hidden',
                    }}
                  >
                    {modes.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          onModeChange(m);
                          setShowModeDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: mode === m ? 'rgba(189,196,198,0.3)' : 'transparent',
                          border: 'none',
                          borderBottom: m !== modes[modes.length - 1] ? `1px solid ${tokens.CARD_BORDER}` : 'none',
                          color: mode === m ? tokens.FG : tokens.FG_MUTED,
                          fontFamily: "'Geist', sans-serif",
                          fontWeight: mode === m ? 600 : 400,
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Online */}
            <button
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '2px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0',
                minWidth: '64px',
              }}
            >
              <Globe size={16} color={tokens.FG_MUTED} />
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '24px',
                  color: tokens.FG_MUTED,
                  paddingLeft: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                Online
              </span>
            </button>

            {/* Research */}
            <button
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '2px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                minWidth: '64px',
              }}
            >
              <Telescope size={16} color={tokens.FG_MUTED} />
              <span
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '24px',
                  color: tokens.FG_MUTED,
                  paddingLeft: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                Research
              </span>
            </button>
          </div>

          {/* Right: mic + send */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mic size={16} color={tokens.FG_MUTED} />
            </button>

            {/* Send button */}
            <button
              onClick={onSend}
              disabled={!hasText}
              style={{
                background: tokens.PLACEHOLDER,
                opacity: hasText ? 1 : 0.5,
                border: 'none',
                borderRadius: '6px',
                padding: '4px',
                cursor: hasText ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                transition: 'opacity 0.2s',
              }}
            >
              <ArrowUp size={20} color="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Quick Action Buttons ───────────────────────────────── */
const QUICK_ACTIONS = [
  { id: 'learn', label: 'Constitution', icon: BookOpen },
  { id: 'build', label: 'Penal Code', icon: Code2 },
  { id: 'advice', label: 'Generate Quiz', icon: Coffee },
  { id: 'image', label: 'FIR Pocedure', icon: ImageIcon },
  { id: 'research', label: 'Research', icon: FlaskConical },
];

function QuickActions({ onAction, onOpenQuiz, tokens }) {
  return (
    <div
      style={{
        width: '648px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      {/* Spacer matching Figma's x:1 offset */}
      <div style={{ width: '1px' }} />
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => {
              if (action.id === 'advice') {
                onOpenQuiz();
                return;
              }
              onAction(action.label);
            }}
            style={{
              background: tokens.CARD_BG,
              backdropFilter: 'blur(42px)',
              border: `1px solid ${tokens.CARD_BORDER}`,
              borderRadius: '12px',
              padding: '10px 12px',
              minWidth: '64px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = tokens.darkMode ? 'rgba(60,60,60,0.8)' : 'rgba(225,229,230,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = tokens.CARD_BG; }}
          >
            <Icon size={16} color={tokens.FG} />
            <span
              style={{
                fontFamily: "'Geist', sans-serif",
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: 1.35,
                color: tokens.FG,
                whiteSpace: 'nowrap',
                paddingLeft: '4px',
              }}
            >
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Welcome / Empty State ──────────────────────────────── */
function WelcomeState({ input, setInput, onSend, onKeyDown, mode, onModeChange, onOpenQuiz, tokens }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
        paddingBottom: '84px',
        paddingTop: '100px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        {/* Greeting */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            width: '608px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '42px',
              letterSpacing: '-0.84px',
              lineHeight: 1,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 400,
                color: tokens.FG,
              }}
            >
              Hey{' '}
            </span>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontWeight: 400,
                color: tokens.FG_SECONDARY,
              }}
            >
              Counselor
            </span>
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', serif",
              fontWeight: 400,
              fontSize: '42px',
              lineHeight: 1,
              letterSpacing: '-0.84px',
              color: tokens.FG,
            }}
          >
            What legal matter can I help with?
          </p>
        </div>

        {/* Chatbox */}
        <AIChatbox
          value={input}
          onChange={e => setInput(e.target.value)}
          onSend={onSend}
          onKeyDown={onKeyDown}
          mode={mode}
          onModeChange={onModeChange}
          tokens={tokens}
        />

        {/* Quick actions */}
        <QuickActions onAction={label => setInput(label + ' ')} onOpenQuiz={onOpenQuiz} tokens={tokens} />
      </div>
    </div>
  );
}

/* ─── ChatScreen ─────────────────────────────────────────── */
export default function ChatScreen({ mode, onModeChange, messages, setMessages, darkMode, onOpenQuiz, onUserMessage }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const tokens = getTokens(darkMode);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { content: input, isUser: true };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    onUserMessage?.(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      const response = await api.sendMessage(input, mode);
      const botMessage = { content: response.answer, isUser: false, sources: response.sources, mode };
      const withBot = [...newMessages, botMessage];
      setMessages(withBot);
      onUserMessage?.(withBot);
    } catch {
      const errMsg = { content: 'Sorry, I encountered an error. Please make sure the backend is running.', isUser: false };
      const withErr = [...newMessages, errMsg];
      setMessages(withErr);
      onUserMessage?.(withErr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: tokens.BG,
        transition: 'background 0.3s ease',
      }}
    >
      {/* Spectre decorative gradient */}
      <Spectre darkMode={darkMode} />

      {/* Navbar */}
      <Navbar tokens={tokens} onOpenQuiz={onOpenQuiz} />

      {/* Content */}
      {!hasMessages ? (
        <WelcomeState
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onKeyDown={handleKeyDown}
          mode={mode}
          onModeChange={onModeChange}
          onOpenQuiz={onOpenQuiz}
          tokens={tokens}
        />
      ) : (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '32px 48px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} isUser={msg.isUser} darkMode={darkMode} />
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#2ba084',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>L</span>
                </div>
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar (conversation mode) */}
          <div
            style={{
              borderTop: `1px solid ${tokens.CARD_BORDER}`,
              background: tokens.BG,
              padding: '20px 48px',
              position: 'relative',
              zIndex: 10,
              backdropFilter: 'blur(42px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ width: '650px' }}>
              <AIChatbox
                value={input}
                onChange={e => setInput(e.target.value)}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                mode={mode}
                onModeChange={onModeChange}
                tokens={tokens}
              />
              <p
                style={{
                  fontFamily: "'Geist', sans-serif",
                  fontSize: '12px',
                  color: tokens.PLACEHOLDER,
                  textAlign: 'center',
                  marginTop: '12px',
                }}
              >
                LegalAI may make mistakes. Not a substitute for professional legal advice.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}