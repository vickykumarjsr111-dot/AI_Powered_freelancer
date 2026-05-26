import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const defaultACTIVITY = [
  { id: 1, type: 'pending', text: 'Proposal sent to DataViz Studio',  timestamp: Date.now() - 60 * 60 * 1000 },
  { id: 2, type: 'new',     text: 'Message from Aria at CloudBuild',  timestamp: Date.now() - 3 * 60 * 60 * 1000 },
  { id: 3, type: 'success', text: 'Contract started with NovaSpark',  timestamp: Date.now() - 24 * 60 * 60 * 1000 },
  { id: 4, type: 'success', text: '5-star review from Kelvin M.',     timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 },
];

const CIRC = 2 * Math.PI * 14;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

// Strip Firestore Timestamp before passing via navigation state
function serializeJob(job) {
  const { createdAt, ...rest } = job;
  return rest;
}

export default function Dashboard() {
  const [userData, setUserData]               = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [activeNav, setActiveNav]             = useState('dashboard');
  const [saved, setSaved]                     = useState(new Set());
  const [jobs, setJobs]                       = useState([]);
  const [selectedJob, setSelectedJob]         = useState(null); // for details modal
  const [activity, setActivity]               = useState(() => {
    const savedActivity = localStorage.getItem('activityData');
    return savedActivity ? JSON.parse(savedActivity) : defaultACTIVITY;
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const profileRef = useRef(null);
  const navigate   = useNavigate();

  // ── Auth + live jobs ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
        else navigate('/login');
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    });

    const q = query(
      collection(db, 'jobs'),
      where('open', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsubJobs = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubscribe(); unsubJobs(); };
  }, [navigate]);

  // ── Close profile popup on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Persist activity ──
  useEffect(() => {
    localStorage.setItem('activityData', JSON.stringify(activity));
  }, [activity]);

  useEffect(() => {
    const stored = localStorage.getItem('newActivity');
    if (stored) {
      setActivity((prev) => [JSON.parse(stored), ...prev]);
      localStorage.removeItem('newActivity');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActivity((prev) => [...prev]), 60000);
    return () => clearInterval(interval);
  }, []);

  const addActivity = (type, text) => {
    setActivity((prev) => [{ id: Date.now(), type, text, timestamp: Date.now() }, ...prev]);
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  };

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

  const toggleSave = (id) => {
    const isAlreadySaved = saved.has(id);
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    addActivity(
      isAlreadySaved ? 'pending' : 'new',
      isAlreadySaved ? 'Job removed from saved items' : 'Job saved to favorites'
    );
  };

  const handleNavigation = (itemId) => {
    setActiveNav(itemId);
    setMobileMenuOpen(false);
    switch (itemId) {
      case 'dashboard': navigate('/freelancer/dashboard'); break;
      case 'jobs':      navigate('/freelancer/jobs');      break;
      case 'proposals': navigate('/freelancer/proposals'); break;
      case 'settings':  navigate('/freelancer/profile');   break;
      case 'messages':  navigate('/freelancer/messages');  break;
      default: break;
    }
  };

  const handleApply = (job) => {
    addActivity('pending', `Started proposal for ${job.clientName || 'Client'}`);
    navigate('/freelancer/proposals', { state: { applyJob: serializeJob(job) } });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', color: '#fff', fontSize: '14px' }}>
        Loading...
      </div>
    );
  }

  const name      = userData?.name || 'User';
  const role      = userData?.role || 'Freelancer';
  const initials  = getInitials(name);
  const firstName = name.split(' ')[0];

  const STATS = [
    { label: 'Profile Views',     value: '284',   delta: '↑ +18%' },
    { label: 'Proposals Sent',    value: '12',    delta: '↑ +3'   },
    { label: 'Active Contracts',  value: '3',     delta: null      },
    { label: 'Earned This Month', value: '$8.3k', delta: '↑ +22%' },
  ];

  return (
    <div className="dash-shell">

      {/* ── Sidebar ── */}
      <aside className={`dash-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="dash-brand">
          <div className="brand-icon">
            <img src="/image.png" alt="Logo"
              style={{ width: 20, height: 20, objectFit: 'contain' }} />
          </div>
          <span className="dash-brandname">Hustlance<span>AI</span></span>
        </div>

        <nav className="dash-nav">
          {[
            { id: 'dashboard', label: 'Dashboard'   },
            { id: 'jobs',      label: 'Browse Jobs' },
            { id: 'proposals', label: 'Proposals'   },
            { id: 'messages',  label: 'Messages'    },
            { id: 'earnings',  label: 'Earnings'    },
            { id: 'settings',  label: 'Settings'    },
          ].map((item) => (
            <button key={item.id}
              className={`nav-btn ${activeNav === item.id ? 'nav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
          <button className="nav-btn" onClick={handleLogout}
            style={{ marginTop: 'auto', color: '#ef4444' }}>
            <span className="nav-label">Logout</span>
          </button>
        </nav>

        {/* ── Profile row with popup ── */}
        <div className="dash-profile" ref={profileRef}
          onClick={() => setProfileMenuOpen((prev) => !prev)}>
          <div className="profile-av">{initials}</div>
          <div className="profile-info">
            <p className="profile-name">{name}</p>
            <p className="profile-role" style={{ textTransform: 'capitalize' }}>{role}</p>
          </div>
          <span className="online-dot" />

          {profileMenuOpen && (
            <div className="profile-popup" onClick={(e) => e.stopPropagation()}>
              <div className="profile-popup-header">
                <div className="profile-popup-av">{initials}</div>
                <div>
                  <p className="profile-popup-name">{name}</p>
                  <p className="profile-popup-role" style={{ textTransform: 'capitalize' }}>{role}</p>
                </div>
              </div>
              <div className="profile-popup-divider" />
              <button className="profile-popup-item"
                onClick={() => { setProfileMenuOpen(false); navigate('/freelancer/profile'); }}>
                ✏️ &nbsp;Update Profile
              </button>
              <button className="profile-popup-item"
                onClick={() => { setProfileMenuOpen(false); handleNavigation('settings'); }}>
                ⚙️ &nbsp;Settings
              </button>
              <div className="profile-popup-divider" />
              <button className="profile-popup-item profile-popup-item--danger"
                onClick={() => { setProfileMenuOpen(false); handleLogout(); }}>
                🚪 &nbsp;Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile hamburger ── */}
      {createPortal(
        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? 'mobile-menu-btn--open' : ''}`}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>,
        document.body
      )}

      <div className={`dash-overlay ${mobileMenuOpen ? 'dash-overlay--active' : ''}`}
        onClick={() => setMobileMenuOpen(false)} />

      {/* ── Main ── */}
      <main className="dash-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">{getGreeting()}, {firstName} 👋</h1>
            <p className="dash-sub">
              Your AI found <strong>{jobs.length} open jobs</strong> right now
            </p>
          </div>
        </div>

        <div className="stats-row">
          {STATS.map((s) => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
              {s.delta && <span className="stat-delta">{s.delta}</span>}
            </div>
          ))}
        </div>

        <div className="content-grid">
          <section className="jobs-col">
            <div className="section-hdr">
              <h2 className="section-title">AI-matched jobs</h2>
              <span className="live-chip">Live</span>
            </div>

            <div className="job-list">
              {jobs.length === 0 ? (
                <p style={{ color: '#888', fontSize: '14px', padding: '16px 0' }}>
                  No jobs posted yet. Check back soon!
                </p>
              ) : (
                jobs.map((job) => {
                  const match = 85;
                  const arc   = (match / 100) * CIRC;
                  return (
                    <div key={job.id} className="job-card">
                      <div className="job-top">
                        <div className="match-ring">
                          <svg viewBox="0 0 36 36" width="36" height="36">
                            <circle className="ring-bg"   cx="18" cy="18" r="14" />
                            <circle className="ring-fill" cx="18" cy="18" r="14"
                              strokeDasharray={`${arc.toFixed(1)} ${CIRC}`}
                              transform="rotate(-90 18 18)" />
                          </svg>
                          <span className="match-pct">{match}%</span>
                        </div>

                        <div className="job-info">
                          <p className="job-title">{job.title}</p>
                          <p className="job-company">{job.clientName || 'Client'}</p>
                        </div>

                        <button
                          className={`save-btn ${saved.has(job.id) ? 'save-btn--saved' : ''}`}
                          onClick={() => toggleSave(job.id)}>
                          {saved.has(job.id) ? '♥' : '♡'}
                        </button>
                      </div>

                      <div className="job-meta">
                        <span className="job-budget">${job.budget}</span>
                        <span className="sep">·</span>
                        <span>{job.duration}</span>
                        <span className="sep">·</span>
                        <span>{job.experience || 'Any level'}</span>
                        <span className="job-posted">
                          {job.createdAt?.toDate
                            ? job.createdAt.toDate().toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>

                      <div className="job-tags">
                        {(job.skills || []).map((skill) => (
                          <span key={skill} className="skill-tag">{skill}</span>
                        ))}
                      </div>

                      <div className="job-actions">
                        <button
                          className="btn-apply"
                          onClick={() => handleApply(job)}>
                          Apply Now
                        </button>
                        {/* ── Details button now works ── */}
                        <button
                          className="btn-details"
                          onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <aside className="right-col">
            <div className="panel-card">
              <h2 className="section-title">Activity</h2>
              <ul className="activity-list">
                {activity.map((a) => (
                  <li key={a.id} className="activity-item">
                    <span className={`activity-dot activity-dot--${a.type}`} />
                    <div>
                      <p className="activity-text">{a.text}</p>
                      <p className="activity-time">
                        {a.timestamp ? formatTimeAgo(a.timestamp) : a.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel-card">
              <h2 className="section-title">Profile strength</h2>
              <div className="strength-row">
                <div className="strength-bar">
                  <div className="strength-fill" style={{ width: '72%' }} />
                </div>
                <span className="strength-pct">72%</span>
              </div>
              <p className="strength-hint">
                Add a portfolio to reach <strong>90%</strong> and get 3× more visibility.
              </p>
              <button className="btn-full-outline"
                onClick={() => navigate('/freelancer/profile')}>
                Complete Profile
              </button>
            </div>

            <div className="panel-card panel-card--ai">
              <span className="ai-badge">AI Insight</span>
              <p className="ai-text">
                Jobs requiring <strong>TypeScript</strong> have 40% less competition this week.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Details Modal ── */}
      {selectedJob && (
        <div className="job-modal-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedJob(null); }}>
          <div className="job-modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <h2>{selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)}
                style={{ background:'none', border:'none', color:'#888',
                  fontSize:'22px', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <p className="modal-company">{selectedJob.clientName || 'Client'}</p>
            <div style={{ display:'flex', gap:'12px', fontSize:'13px', color:'#aaa', margin:'8px 0' }}>
              <span>${selectedJob.budget}</span>
              <span>·</span>
              <span>{selectedJob.duration}</span>
              <span>·</span>
              <span>{selectedJob.experience || 'Any level'}</span>
            </div>
            <p style={{ fontSize:'14px', color:'#ccc', lineHeight:1.6 }}>
              {selectedJob.description || 'No description provided.'}
            </p>
            <div className="modal-tags" style={{ margin:'12px 0' }}>
              {(selectedJob.skills || []).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
              <button className="close-modal" style={{ flex:1 }}
                onClick={() => setSelectedJob(null)}>
                Close
              </button>
              <button className="close-modal"
                style={{ flex:1, background:'#fff', color:'#000' }}
                onClick={() => { const j = selectedJob; setSelectedJob(null); handleApply(j); }}>
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}