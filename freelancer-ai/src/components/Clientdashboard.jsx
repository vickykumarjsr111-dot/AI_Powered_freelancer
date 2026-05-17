import { useState, useEffect, useRef } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import {
  doc, getDoc, collection, getDocs,
  addDoc, query, where, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './ClientDashboard.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ClientDashboard() {
  const [userData, setUserData]               = useState(null);
  const [freelancers, setFreelancers]         = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [activeNav, setActiveNav]             = useState('dashboard');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedSkill, setSelectedSkill]     = useState('All');
  const profileRef = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
        else { navigate('/login'); return; }

        const fsSnap = await getDocs(collection(db, 'freelancers'));
        const list = fsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFreelancers(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const handle = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleNavigation = (id) => {
    setActiveNav(id);
    if (id === 'messages') navigate('/client/messages');
    if (id === 'dashboard') navigate('/client/dashboard');
  };

  const handleMessage = async (freelancer) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, 'chats'),
        where('clientId',     '==', currentUser.uid),
        where('freelancerId', '==', freelancer.id)
      );
      const existing = await getDocs(q);
      let chatId;
      if (!existing.empty) {
        chatId = existing.docs[0].id;
      } else {
        const ref = await addDoc(collection(db, 'chats'), {
          clientId:       currentUser.uid,
          clientName:     userData.name,
          freelancerId:   freelancer.id,
          freelancerName: freelancer.name,
          createdAt:      serverTimestamp(),
          lastMessage:    '',
          lastAt:         serverTimestamp(),
        });
        chatId = ref.id;
      }
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  const allSkills = ['All', ...new Set(freelancers.flatMap((f) => f.skills || []))];

  const filtered = freelancers.filter((f) => {
    const matchSearch =
      f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSkill =
      selectedSkill === 'All' || (f.skills || []).includes(selectedSkill);
    return matchSearch && matchSkill;
  });

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', color:'#fff', fontSize:'14px' }}>
        Loading...
      </div>
    );
  }

  const name      = userData?.name || 'Client';
  const role      = userData?.role || 'client';
  const initials  = getInitials(name);
  const firstName = name.split(' ')[0];

  const STATS = [
    { label: 'Freelancers Available', value: freelancers.length.toString(), delta: null },
    { label: 'Active Contracts',      value: '2',    delta: null     },
    { label: 'Pending Proposals',     value: '5',    delta: '↑ +2'  },
    { label: 'Total Spent',           value: '$12k', delta: '↑ +8%' },
  ];

  return (
    <div className="cdash-shell">

      {/* Sidebar */}
      <aside className="cdash-sidebar">
        <div className="cdash-brand">
          <div className="cbrand-icon">
            <img src="/image.png" alt="Logo"
              style={{ width:20, height:20, objectFit:'contain' }} />
          </div>
          <span className="cdash-brandname">Hustlance<span>AI</span></span>
        </div>

        <nav className="cdash-nav">
          {[
            { id:'dashboard', label:'Dashboard' },
            { id:'messages',  label:'Messages'  },
            { id:'contracts', label:'Contracts' },
            { id:'settings',  label:'Settings'  },
          ].map((item) => (
            <button key={item.id}
              className={`cnav-btn ${activeNav === item.id ? 'cnav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}>
              <span className="cnav-label">{item.label}</span>
            </button>
          ))}

          <button className="cnav-btn" onClick={handleLogout}
            style={{ marginTop:'auto', color:'#ef4444' }}>
            <span className="cnav-label">Logout</span>
          </button>
        </nav>

        {/* Profile row */}
        <div className="cdash-profile" ref={profileRef}
          onClick={() => setProfileMenuOpen((p) => !p)}>
          <div className="cprofile-av">{initials}</div>
          <div className="cprofile-info">
            <p className="cprofile-name">{name}</p>
            <p className="cprofile-role" style={{ textTransform:'capitalize' }}>{role}</p>
          </div>
          <span className="conline-dot" />

          {profileMenuOpen && (
            <div className="cprofile-popup" onClick={(e) => e.stopPropagation()}>
              <div className="cpopup-header">
                <div className="cpopup-av">{initials}</div>
                <div>
                  <p className="cpopup-name">{name}</p>
                  <p className="cpopup-role" style={{ textTransform:'capitalize' }}>{role}</p>
                </div>
              </div>
              <div className="cpopup-divider" />
              <button className="cpopup-item"
                onClick={() => { setProfileMenuOpen(false); navigate('/freelancer/profile'); }}>
                ✏️ &nbsp;Update Profile
              </button>
              <div className="cpopup-divider" />
              <button className="cpopup-item cpopup-item--danger"
                onClick={() => { setProfileMenuOpen(false); handleLogout(); }}>
                🚪 &nbsp;Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="cdash-main">
        <div className="cdash-header">
          <div>
            <h1 className="cdash-greeting">Welcome, {firstName} 👋</h1>
            <p className="cdash-sub">Find and hire the best freelancers for your projects</p>
          </div>
        </div>

        <div className="cstats-row">
          {STATS.map((s) => (
            <div key={s.label} className="cstat-card">
              <p className="cstat-label">{s.label}</p>
              <p className="cstat-value">{s.value}</p>
              {s.delta && <span className="cstat-delta">{s.delta}</span>}
            </div>
          ))}
        </div>

        <div className="csearch-section">
          <input
            type="text"
            placeholder="Search freelancers by name or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="cskill-filters">
            {allSkills.slice(0, 8).map((skill) => (
              <button key={skill}
                className={selectedSkill === skill ? 'cskill-active' : ''}
                onClick={() => setSelectedSkill(skill)}>
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="csection-hdr">
          <h2 className="csection-title">Available Freelancers</h2>
          <span className="clive-chip">{filtered.length} found</span>
        </div>

        {filtered.length === 0 ? (
          <div className="cempty">No freelancers found. Try a different search.</div>
        ) : (
          <div className="cfreelancer-grid">
            {filtered.map((f) => (
              <div key={f.id} className="cfreelancer-card">
                <div className="cfc-top">
                  <div className="cfc-avatar">{getInitials(f.name || 'U')}</div>
                  <div className="cfc-info">
                    <p className="cfc-name">{f.name || 'Unknown'}</p>
                    <p className="cfc-location">{f.location || 'Remote'}</p>
                  </div>
                  {f.hourlyRate > 0 && (
                    <span className="cfc-rate">${f.hourlyRate}/hr</span>
                  )}
                </div>

                {f.bio && (
                  <p className="cfc-bio">
                    {f.bio.slice(0, 120)}{f.bio.length > 120 ? '...' : ''}
                  </p>
                )}

                <div className="cfc-tags">
                  {(f.skills || []).slice(0, 4).map((skill) => (
                    <span key={skill} className="cfc-tag">{skill}</span>
                  ))}
                </div>

                {f.experience && (
                  <p className="cfc-exp">🕐 {f.experience} experience</p>
                )}

                <div className="cfc-actions">
                  {f.portfolioLink && (
                    <a href={f.portfolioLink} target="_blank" rel="noreferrer"
                      className="cfc-btn-outline">
                      Portfolio
                    </a>
                  )}
                  <button className="cfc-btn-solid" onClick={() => handleMessage(f)}>
                    💬 Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}