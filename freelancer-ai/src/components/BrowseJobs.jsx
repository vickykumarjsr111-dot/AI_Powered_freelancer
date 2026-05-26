import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './BrowseJobs.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function BrowseJobs() {
  const navigate = useNavigate();

  const [userData, setUserData]         = useState(null);
  const [jobs, setJobs]                 = useState([]);
  const [savedJobs, setSavedJobs]       = useState(new Set());
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedJob, setSelectedJob]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
        else navigate('/login');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    const unsubJobs = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub(); unsubJobs(); };
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
    setMobileMenuOpen(false);
    switch (id) {
      case 'dashboard': navigate('/freelancer/dashboard'); break;
      case 'jobs':      navigate('/freelancer/jobs');      break;
      case 'proposals': navigate('/freelancer/proposals'); break;
      case 'messages':  navigate('/freelancer/messages');  break;
      case 'settings':  navigate('/freelancer/profile');   break;
      default: break;
    }
  };

  const toggleSave = (id) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredJobs = jobs.filter((job) => {
    const searchMatch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const skillMatch =
      selectedSkill === 'All' || (job.skills || []).includes(selectedSkill);
    return searchMatch && skillMatch;
  });

  if (loading) return <div className="browse-loading">Loading...</div>;

  const name     = userData?.name || 'User';
  const role     = userData?.role || 'freelancer';
  const initials = getInitials(name);

  return (
    <div className="browse-shell">

      {/* Sidebar */}
      <aside className={`browse-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="browse-brand">
          <div className="brand-icon">
            <img src="/image.png" alt="Logo" />
          </div>
          <span className="brand-name">Hustlance<span>AI</span></span>
        </div>

        <nav className="browse-nav">
          {[
            { id: 'dashboard', label: 'Dashboard'  },
            { id: 'jobs',      label: 'Browse Jobs' },
            { id: 'proposals', label: 'Proposals'   },
            { id: 'messages',  label: 'Messages'    },
            { id: 'earnings',  label: 'Earnings'    },
            { id: 'settings',  label: 'Settings'    },
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${item.id === 'jobs' ? 'nav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}
            >
              {item.label}
            </button>
          ))}

          <button className="nav-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </nav>

        {/* Profile row with popup */}
        <div className="browse-profile" ref={profileRef}
          onClick={() => setProfileMenuOpen((p) => !p)}>
          <div className="profile-avatar">{initials}</div>
          <div>
            <p className="profile-name">{name}</p>
            <p className="profile-role" style={{ textTransform: 'capitalize' }}>{role}</p>
          </div>
          <span className="online-dot" />

          {profileMenuOpen && (
            <div className="browse-profile-popup" onClick={(e) => e.stopPropagation()}>
              <div className="bpopup-header">
                <div className="bpopup-av">{initials}</div>
                <div>
                  <p className="bpopup-name">{name}</p>
                  <p className="bpopup-role" style={{ textTransform:'capitalize' }}>{role}</p>
                </div>
              </div>
              <div className="bpopup-divider" />
              <button className="bpopup-item"
                onClick={() => { setProfileMenuOpen(false); navigate('/freelancer/profile'); }}>
                ✏️ &nbsp;Update Profile
              </button>
              <button className="bpopup-item"
                onClick={() => { setProfileMenuOpen(false); navigate('/freelancer/profile'); }}>
                ⚙️ &nbsp;Settings
              </button>
              <div className="bpopup-divider" />
              <button className="bpopup-item bpopup-item--danger"
                onClick={() => { setProfileMenuOpen(false); handleLogout(); }}>
                🚪 &nbsp;Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="browse-main">
        {!mobileMenuOpen &&
  createPortal(
    <button
      className="fp-mobile-menu-btn"
      onClick={() => setMobileMenuOpen(true)}
      aria-label="Toggle menu"
    >
      <Menu size={22} />
    </button>,
    document.body
  )}

        <div
          className={`browse-overlay ${mobileMenuOpen ? 'browse-overlay--active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        />

        <div className="browse-header">
          <div>
            <h1>Browse Jobs</h1>
            <p>AI-matched opportunities tailored for your skills</p>
          </div>
        </div>

        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search jobs, companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="skill-filters">
            {['All', 'React', 'Node.js', 'Python', 'AWS'].map((skill) => (
              <button
                key={skill}
                className={selectedSkill === skill ? 'skill-active' : ''}
                onClick={() => setSelectedSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs */}
        <div className="browse-content">
          <section className="jobs-list">
            {filteredJobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-top">
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.clientName || 'Client'}</p>
                  </div>
                  <div className="job-match">🟢 Open</div>
                </div>

                <div className="job-meta">
                  <span>${job.budget}</span>
                  <span>{job.duration}</span>
                  <span>{job.experience || 'Any level'}</span>
                  <span>{job.createdAt?.toDate
                    ? job.createdAt.toDate().toLocaleDateString()
                    : 'Just now'}</span>
                </div>
                  
                <div className="job-tags">
                  {(job.skills || []).map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>

                <div className="job-actions">
                  <button onClick={() => toggleSave(job.id)}>
                    {savedJobs.has(job.id) ? '♥ Saved' : '♡ Save'}
                  </button>
                  <button onClick={() => setSelectedJob(job)}>Details</button>
                  <button className="apply-btn"
                    onClick={() => navigate('/freelancer/proposals')}>
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* Right Panel */}
          <aside className="browse-right">
            <div className="insight-card">
              <span>AI Insight</span>
              <p>Jobs requiring <strong>React + TypeScript</strong> have 38% less competition this week.</p>
            </div>
            <div className="insight-card">
              <h3>Recommended Skills</h3>
              <div className="recommended-skills">
                <span>Next.js</span>
                <span>Firebase</span>
                <span>GraphQL</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Modal */}
      {selectedJob && (
        <div className="job-modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="job-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedJob.title}</h2>
            <p className="modal-company">{selectedJob.clientName || 'Client'}</p>
            <p>{selectedJob.description}</p>
            <div className="modal-tags">
              {selectedJob.skills.map((skill) => (
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
                onClick={() => { setSelectedJob(null); navigate('/freelancer/proposals'); }}>
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}