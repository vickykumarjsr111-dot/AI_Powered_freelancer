import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Clientmessages.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ClientMessages() {
  const [chats, setChats]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeNav, setActiveNav] = useState('messages');
  const navigate = useNavigate();

  useEffect(() => {
    let unsubSnap = null;

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { navigate('/login'); return; }

      const q = query(
        collection(db, 'chats'),
        where('clientId', '==', user.uid),
        orderBy('lastAt', 'desc')
      );

      unsubSnap = onSnapshot(q, (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    });

    return () => {
      unsub();
      if (unsubSnap) unsubSnap();
    };
  }, [navigate]);

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

  const handleNavigation = (id) => {
    setActiveNav(id);
    const routes = {
      dashboard:  '/client/dashboard',
      'post-job': '/client/post-job',
      messages:   '/client/messages',
      contracts:  '/client/contracts',
      payments:   '/client/payments',
      settings:   '/client/profile',
    };
    if (routes[id]) navigate(routes[id]);
  };

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', color:'#fff', fontSize:'14px' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="cmsg-shell">
      <aside className="cmsg-sidebar">
        <div className="cmsg-brand">
          <div className="cmsg-brand-icon">
            <img src="/image.png" alt="Logo" style={{ width:20, height:20, objectFit:'contain' }} />
          </div>
          <span className="cmsg-brandname">Hustlance<span>AI</span></span>
        </div>

        <nav className="cmsg-nav">
          {[
            { id:'dashboard',  label:'Dashboard'  },
            { id:'post-job',   label:'Post a Job' },
            { id:'messages',   label:'Messages'   },
            { id:'contracts',  label:'Contracts'  },
            { id:'payments',   label:'Payments'   },
            { id:'settings',   label:'Settings'   },
          ].map((item) => (
            <button key={item.id}
              className={`cmsg-nav-btn ${activeNav === item.id ? 'cmsg-nav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}>
              {item.label}
            </button>
          ))}

          <button className="cmsg-nav-btn" onClick={handleLogout}
            style={{ marginTop:'auto', color:'#ef4444' }}>
            Logout
          </button>
        </nav>
      </aside>

      <main className="cmsg-main">
        <div className="cmsg-header">
          <h1>Messages</h1>
          <p>Your conversations with freelancers</p>
        </div>

        {chats.length === 0 ? (
          <div className="cmsg-empty">
            No conversations yet. Go to{' '}
            <button onClick={() => navigate('/client/dashboard')}
              style={{ background:'none', border:'none', color:'#22c55e', cursor:'pointer', fontWeight:600 }}>
              Dashboard
            </button>{' '}
            to message a freelancer.
          </div>
        ) : (
          <div className="cmsg-list">
            {chats.map((chat) => (
              <div key={chat.id} className="cmsg-item"
                onClick={() => navigate(`/chat/${chat.id}`)}>
                <div className="cmsg-av">{getInitials(chat.freelancerName || 'F')}</div>
                <div className="cmsg-info">
                  <p className="cmsg-name">{chat.freelancerName || 'Freelancer'}</p>
                  <p className="cmsg-last">{chat.lastMessage || 'No messages yet'}</p>
                </div>
                <div className="cmsg-time">
                  {chat.lastAt?.toDate ? chat.lastAt.toDate().toLocaleDateString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}