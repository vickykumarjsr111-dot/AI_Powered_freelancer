import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './FreelancerMessages.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function FreelancerMessages() {
  const [chats, setChats]     = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { navigate('/login'); return; }

      const q = query(
        collection(db, 'chats'),
        where('freelancerId', '==', user.uid),
        orderBy('lastAt', 'desc')
      );

      const unsubSnap = onSnapshot(q, (snap) => {
        setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      return () => unsubSnap();
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleNavigation = (id) => {
    switch (id) {
      case 'dashboard': navigate('/freelancer/dashboard'); break;
      case 'jobs':      navigate('/freelancer/jobs');      break;
      case 'proposals': navigate('/freelancer/proposals'); break;
      case 'messages':  navigate('/freelancer/messages');  break;
      case 'settings':  navigate('/freelancer/profile');   break;
      default: break;
    }
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
    <div className="fmsg-shell">
      <aside className="fmsg-sidebar">
        <div className="fmsg-brand">
          <div className="fmsg-brand-icon">
            <img src="/image.png" alt="Logo"
              style={{ width:20, height:20, objectFit:'contain' }} />
          </div>
          <span className="fmsg-brandname">Hustlance<span>AI</span></span>
        </div>

        <nav className="fmsg-nav">
          {[
            { id:'dashboard', label:'Dashboard'  },
            { id:'jobs',      label:'Browse Jobs' },
            { id:'proposals', label:'Proposals'  },
            { id:'messages',  label:'Messages'   },
            { id:'earnings',  label:'Earnings'   },
            { id:'settings',  label:'Settings'   },
          ].map((item) => (
            <button key={item.id}
              className={`fmsg-nav-btn ${item.id === 'messages' ? 'fmsg-nav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}>
              {item.label}
            </button>
          ))}

          <div style={{ flex: 1 }} />
            <button className="fmsg-nav-btn" onClick={handleLogout}
              style={{ color:'#ef4444' }}>
              Logout
            </button>
        </nav>
      </aside>

      <main className="fmsg-main">
        <div className="fmsg-header">
          <h1>Messages</h1>
          <p>Conversations from clients</p>
        </div>

        {chats.length === 0 ? (
          <div className="fmsg-empty">
            No messages yet. Clients will appear here when they message you.
          </div>
        ) : (
          <div className="fmsg-list">
            {chats.map((chat) => (
              <div key={chat.id} className="fmsg-item"
                onClick={() => navigate(`/chat/${chat.id}`)}>
                <div className="fmsg-av">
                  {getInitials(chat.clientName || 'C')}
                </div>
                <div className="fmsg-info">
                  <p className="fmsg-name">{chat.clientName || 'Client'}</p>
                  <p className="fmsg-last">{chat.lastMessage || 'No messages yet'}</p>
                </div>
                <div className="fmsg-time">
                  {chat.lastAt?.toDate
                    ? chat.lastAt.toDate().toLocaleDateString()
                    : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}