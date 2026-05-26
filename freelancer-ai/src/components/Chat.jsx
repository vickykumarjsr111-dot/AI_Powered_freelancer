// src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc, getDoc, collection,
  addDoc, onSnapshot, query,
  orderBy, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import './Chat.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Chat() {
  const { chatId }  = useParams();
  const navigate    = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [userData,    setUserData]    = useState(null);
  const [chatData,    setChatData]    = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState('');
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);   // ← v1: double-send guard
  const bottomRef = useRef(null);

  // ── Auth + initial data load ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/login'); return; }
      setCurrentUser(user);

      try {
        const [userSnap, chatSnap] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDoc(doc(db, 'chats', chatId)),
        ]);

        if (userSnap.exists()) setUserData(userSnap.data());
        if (!chatSnap.exists()) { navigate('/'); return; }
        setChatData(chatSnap.data());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [chatId, navigate]);

  // ── Live messages ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),   // ← v1: consistent sub-collection name
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [chatId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim() || !currentUser || sending) return;  // ← v1: sending guard

    const isClient     = currentUser.uid === chatData?.clientId;
    const isFreelancer = currentUser.uid === chatData?.freelancerId;
    if (!isClient && !isFreelancer) return;               // ← v2: role check

    setSending(true);
    const msgText = text.trim();
    setText('');

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId:   currentUser.uid,
        senderName: userData?.name || 'User',             // ← v2: name from Firestore
        text:       msgText,
        createdAt:  serverTimestamp(),
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: msgText,
        lastAt:      serverTimestamp(),
      });
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);                                  // ← v1: always release lock
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', color:'#fff', fontSize:'14px' }}>
      Loading chat...
    </div>
  );

  const isClient  = currentUser?.uid === chatData?.clientId;
  const otherName = isClient ? chatData?.freelancerName : chatData?.clientName;
  const freelancerCannotSendYet = !isClient && messages.length === 0;

  // ← v1: back to /messages routes, not dashboard
  const backPath  = isClient ? '/client/messages' : '/freelancer/messages';

  return (
    <div className="chat-shell">

      {/* ── Header ── */}
      <div className="chat-header">
        <button className="chat-back" onClick={() => navigate(backPath)}>
          ← Back
        </button>
        <div className="chat-peer">
          <div className="chat-peer-av">{getInitials(otherName || 'U')}</div>
          <div>
            <p className="chat-peer-name">{otherName || 'User'}</p>
            {/* ← v1: show project title when available */}
            {chatData?.projectTitle
              ? <p className="chat-peer-role">{chatData.projectTitle}</p>
              : <p className="chat-peer-role">{isClient ? 'Freelancer' : 'Client'}</p>
            }
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            {isClient
              ? 'No messages yet. Send the first message!'
              : 'Waiting for the client to message first.'}
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser?.uid;
          return (
            <div key={msg.id}
              className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
              {/* ← v2: avatar only on received messages */}
              {!isMine && (
                <div className="chat-bubble-av">{getInitials(msg.senderName)}</div>
              )}
              <div className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}>
                <p className="chat-bubble-text">{msg.text}</p>
                <p className="chat-bubble-time">
                  {msg.createdAt?.toDate
                    ? msg.createdAt.toDate().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
                    : '...'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder={
            isClient            ? 'Type a message...' :
            freelancerCannotSendYet ? 'Wait for the client to message first...' :
                                  'Type a reply...'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={freelancerCannotSendYet}
        />
        <button
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!text.trim() || sending || freelancerCannotSendYet}
        >
          {sending ? '...' : 'Send'}        {/* ← v1: sending feedback */}
        </button>
      </div>
    </div>
  );
}