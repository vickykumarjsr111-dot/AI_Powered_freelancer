import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AIAssistant() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your HustlanceAI assistant 👋 I can help you find jobs, discover freelancers, answer platform questions, and more. What can I help you with?" }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [userData, setUserData] = useState(null);
  const bottomRef               = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) setUserData({ uid: user.uid, ...snap.data() });
        } catch (e) { console.error(e); }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const systemPrompt = `You are HustlanceAI Assistant for a freelancing platform called HustlanceAI.
USER: ${userData ? `${userData.name} (${userData.role})` : 'guest'}
Help the user with platform questions, job searching tips, proposal writing, and freelancing advice. Be concise and friendly.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 250,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-4).map(m => ({
              role:    m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
            { role: 'user', content: userMsg },
          ],
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error.message || 'Something went wrong.'}`,
        }]);
        return;
      }

      const reply = data.choices?.[0]?.message?.content || 'No response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button className="ai-fab" onClick={() => setOpen(o => !o)} title="AI Assistant">
        {open ? '✕' : '✦'}
      </button>

      {open && (
        <div className="ai-window">
          <div className="ai-window-header">
            <div className="ai-header-left">
              <div className="ai-avatar">✦</div>
              <div>
                <p className="ai-header-title">HustlanceAI Assistant</p>
                <p className="ai-header-sub">Powered by Llama 3</p>
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg--${m.role}`}>
                {m.role === 'assistant' && <div className="ai-msg-avatar">✦</div>}
                <div className={`ai-msg-bubble ai-msg-bubble--${m.role}`}>
                  {m.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai-msg--assistant">
                <div className="ai-msg-avatar">✦</div>
                <div className="ai-msg-bubble ai-msg-bubble--assistant ai-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="ai-suggestions">
            {['How to write a proposal?', 'Tips for freelancers', 'How to post a job?'].map(s => (
              <button key={s} className="ai-suggestion-btn" onClick={() => setInput(s)}>
                {s}
              </button>
            ))}
          </div>

          <div className="ai-input-row">
            <input
              className="ai-input"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
            />
            <button className="ai-send-btn" onClick={sendMessage}
              disabled={!input.trim() || loading}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}