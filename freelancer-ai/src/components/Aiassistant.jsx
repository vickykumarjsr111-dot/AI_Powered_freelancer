import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AIAssistant() {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([
    { role: 'assistant', content: "Hi! I'm your HustlanceAI assistant 👋 I can help you find jobs, discover freelancers, answer platform questions, and more. What can I help you with?" }
  ]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [userData, setUserData]   = useState(null);
  const bottomRef                 = useRef(null);

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

  const fetchPlatformData = async () => {
    try {
      // Fetch open jobs
      const jobsSnap = await getDocs(query(
        collection(db, 'jobs'),
        where('open', '==', true)
      ));
      const jobs = jobsSnap.docs.map(d => ({
        id:          d.id,
        title:       d.data().title,
        budget:      d.data().budget,
        duration:    d.data().duration,
        skills:      d.data().skills,
        description: d.data().description,
        clientName:  d.data().clientName,
        experience:  d.data().experience,
      }));

      // Fetch freelancers
      const freelancersSnap = await getDocs(collection(db, 'freelancers'));
      const freelancers = freelancersSnap.docs.map(d => ({
        id:         d.id,
        name:       d.data().name,
        skills:     d.data().skills,
        hourlyRate: d.data().hourlyRate,
        bio:        d.data().bio,
        location:   d.data().location,
        experience: d.data().experience,
      }));

      return { jobs, freelancers };
    } catch (e) {
      console.error(e);
      return { jobs: [], freelancers: [] };
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { jobs, freelancers } = await fetchPlatformData();

      const systemPrompt = `You are HustlanceAI Assistant, a helpful AI for a freelancing platform called HustlanceAI.

CURRENT PLATFORM DATA:
=== OPEN JOBS (${jobs.length} available) ===
${jobs.length === 0 ? 'No jobs currently posted.' : jobs.map((j, i) =>
  `${i+1}. "${j.title}" by ${j.clientName}
   Budget: $${j.budget} | Duration: ${j.duration} | Level: ${j.experience || 'Any'}
   Skills: ${(j.skills || []).join(', ')}
   Description: ${j.description || 'N/A'}`
).join('\n\n')}

=== FREELANCERS (${freelancers.length} registered) ===
${freelancers.length === 0 ? 'No freelancers registered.' : freelancers.map((f, i) =>
  `${i+1}. ${f.name} — ${f.location || 'Remote'}
   Rate: $${f.hourlyRate || 0}/hr | Experience: ${f.experience || 'N/A'}
   Skills: ${(f.skills || []).join(', ')}
   Bio: ${f.bio || 'N/A'}`
).join('\n\n')}

=== CURRENT USER ===
${userData ? `Name: ${userData.name}, Role: ${userData.role}` : 'Not logged in'}

INSTRUCTIONS:
- Help users find the best jobs or freelancers based on their needs
- Answer questions about the platform (how to post jobs, submit proposals, release payments, etc.)
- Give personalized recommendations based on skills and budget
- Be concise, friendly and helpful
- If asked for job recommendations, match their skills to available jobs
- Format responses clearly with bullet points where helpful
- Keep responses under 200 words unless detail is needed`;

      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      conversationHistory.push({ role: 'user', content: userMsg });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     systemPrompt,
          messages:   conversationHistory,
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not get a response.';

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
      {/* Floating button */}
      <button className="ai-fab" onClick={() => setOpen(o => !o)} title="AI Assistant">
        {open ? '✕' : '✦'}
      </button>

      {/* Chat window */}
      {open && (
        <div className="ai-window">
          <div className="ai-window-header">
            <div className="ai-header-left">
              <div className="ai-avatar">✦</div>
              <div>
                <p className="ai-header-title">HustlanceAI Assistant</p>
                <p className="ai-header-sub">Powered by Claude</p>
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg--${m.role}`}>
                {m.role === 'assistant' && (
                  <div className="ai-msg-avatar">✦</div>
                )}
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
            {['Find me a job', 'Best freelancers', 'How to post a job?'].map(s => (
              <button key={s} className="ai-suggestion-btn"
                onClick={() => { setInput(s); }}>
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
            <button className="ai-send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}