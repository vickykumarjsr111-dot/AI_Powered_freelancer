import { useState, useEffect, useRef } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import {
  doc, getDoc, collection, getDocs,
  addDoc, query, where, onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Clientdashboard.css';

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
  const [detailFreelancer, setDetailFreelancer] = useState(null);
  const [modalTab, setModalTab]               = useState('about');

  const [activeContractsCount, setActiveContractsCount]   = useState(0);
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);
  const [totalSpent, setTotalSpent]                       = useState(0);

  const profileRef = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => {
    let unsubContracts = null;
    let unsubProposals = null;
    let unsubPayments  = null;

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
        else { navigate('/login'); return; }

        const fsSnap = await getDocs(collection(db, 'freelancers'));
        setFreelancers(fsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        unsubContracts = onSnapshot(
          query(collection(db, 'contracts'),
            where('clientId', '==', currentUser.uid),
            where('status',   '==', 'active')),
          (s) => setActiveContractsCount(s.size)
        );
        unsubProposals = onSnapshot(
          query(collection(db, 'proposals'),
            where('clientId', '==', currentUser.uid),
            where('status',   '==', 'pending')),
          (s) => setPendingProposalsCount(s.size)
        );
        unsubPayments = onSnapshot(
          query(collection(db, 'payments'),
            where('clientId', '==', currentUser.uid),
            where('status',   '==', 'released')),
          (s) => {
            const sum = s.docs.reduce((acc, d) => acc + (d.data().amount || 0), 0);
            setTotalSpent(sum);
          }
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsub();
      if (unsubContracts) unsubContracts();
      if (unsubProposals) unsubProposals();
      if (unsubPayments)  unsubPayments();
    };
  }, [navigate]);

  useEffect(() => {
    const handle = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

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

  const closeModal = () => {
    setDetailFreelancer(null);
    setModalTab('about');
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
      <div className="cdash-loading">Loading...</div>
    );
  }

  const name      = userData?.name || 'Client';
  const role      = userData?.role || 'client';
  const initials  = getInitials(name);
  const firstName = name.split(' ')[0];

  const spentLabel = totalSpent >= 1000
    ? `$${(totalSpent / 1000).toFixed(1)}k`
    : `$${totalSpent}`;

  const STATS = [
    { label: 'Freelancers Available', value: freelancers.length.toString() },
    { label: 'Active Contracts',      value: activeContractsCount.toString() },
    { label: 'Pending Proposals',     value: pendingProposalsCount.toString() },
    { label: 'Total Spent',           value: spentLabel },
  ];

  return (
    <div className="cdash-shell">

      {/* ── Sidebar ── */}
      <aside className="cdash-sidebar">
        <div className="cdash-brand">
          <div className="cbrand-icon">
            <img src="/image.png" alt="Logo" style={{ width: 20, height: 20, objectFit: 'contain' }} />
          </div>
          <span className="cdash-brandname">Hustlance<span>AI</span></span>
        </div>

        <nav className="cdash-nav">
          {[
            { id: 'dashboard', label: 'Dashboard'  },
            { id: 'post-job',  label: 'Post a Job' },
            { id: 'messages',  label: 'Messages'   },
            { id: 'contracts', label: 'Contracts'  },
            { id: 'payments',  label: 'Payments'   },
            { id: 'settings',  label: 'Settings'   },
          ].map((item) => (
            <button key={item.id}
              className={`cnav-btn ${activeNav === item.id ? 'cnav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}>
              <span className="cnav-label">{item.label}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="cnav-btn cnav-btn--logout" onClick={handleLogout}>
            <span className="cnav-label">Logout</span>
          </button>
        </nav>

        <div className="cdash-profile" ref={profileRef}
          onClick={() => setProfileMenuOpen((p) => !p)}>
          <div className="cprofile-av">{initials}</div>
          <div className="cprofile-info">
            <p className="cprofile-name">{name}</p>
            <p className="cprofile-role">{role}</p>
          </div>
          <span className="conline-dot" />

          {profileMenuOpen && (
            <div className="cprofile-popup" onClick={(e) => e.stopPropagation()}>
              <div className="cpopup-header">
                <div className="cpopup-av">{initials}</div>
                <div>
                  <p className="cpopup-name">{name}</p>
                  <p className="cpopup-role">{role}</p>
                </div>
              </div>
              <div className="cpopup-divider" />
              <button className="cpopup-item"
                onClick={() => { setProfileMenuOpen(false); navigate('/client/profile'); }}>
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

      {/* ── Main ── */}
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
                  <p className="cfc-exp">🕐 {f.experience}</p>
                )}

                <div className="cfc-actions">
                  <button className="cfc-btn-outline"
                    onClick={() => { setDetailFreelancer(f); setModalTab('about'); }}>
                    View Details
                  </button>
                  <button className="cfc-btn-solid" onClick={() => handleMessage(f)}>
                    💬 Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {detailFreelancer && (
        <div
          className="cdash-modal-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="cdash-modal">

            <div className="cdash-modal-header">
              <div className="cdash-modal-identity">
                <div className="cfc-avatar cdash-modal-avatar">
                  {getInitials(detailFreelancer.name || 'U')}
                </div>
                <div>
                  <p className="cdash-modal-name">{detailFreelancer.name || 'Unknown'}</p>
                  <p className="cdash-modal-meta">
                    {detailFreelancer.location || 'Remote'}
                    {detailFreelancer.hourlyRate > 0 && ` · $${detailFreelancer.hourlyRate}/hr`}
                  </p>
                </div>
              </div>
              <button className="cdash-modal-close" onClick={closeModal}>×</button>
            </div>

            {detailFreelancer.availability && (
              <div className="cdash-modal-avail-row">
                <span className={`cdash-modal-avail cdash-modal-avail--${detailFreelancer.availability}`}>
                  {detailFreelancer.availability}
                </span>
              </div>
            )}

            <div className="cdash-modal-tabs">
              {['about', 'skills', 'links'].map((tab) => (
                <button
                  key={tab}
                  className={`cdash-modal-tab ${modalTab === tab ? 'cdash-modal-tab--active' : ''}`}
                  onClick={() => setModalTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {modalTab === 'about' && (
              <div className="cdash-modal-tab-panel">
                {detailFreelancer.bio && (
                  <div className="cdash-modal-field">
                    <p className="cdash-modal-label">About</p>
                    <p className="cdash-modal-value">{detailFreelancer.bio}</p>
                  </div>
                )}
                {detailFreelancer.experience && (
                  <div className="cdash-modal-field">
                    <p className="cdash-modal-label">Experience</p>
                    <p className="cdash-modal-value">🕐 {detailFreelancer.experience}</p>
                  </div>
                )}
                {detailFreelancer.hourlyRate > 0 && (
                  <div className="cdash-modal-field">
                    <p className="cdash-modal-label">Hourly Rate</p>
                    <p className="cdash-modal-rate">${detailFreelancer.hourlyRate}/hr</p>
                  </div>
                )}
                {!detailFreelancer.bio && !detailFreelancer.experience && (
                  <p className="cdash-modal-empty">No details provided.</p>
                )}
              </div>
            )}

            {modalTab === 'skills' && (
              <div className="cdash-modal-tab-panel">
                {(detailFreelancer.skills || []).length > 0 ? (
                  <div className="cdash-modal-field">
                    <p className="cdash-modal-label">
                      Skills ({detailFreelancer.skills.length})
                    </p>
                    <div className="cdash-modal-tags">
                      {detailFreelancer.skills.map((s) => (
                        <span key={s} className="cfc-tag cdash-modal-skill-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="cdash-modal-empty">No skills listed.</p>
                )}
              </div>
            )}

            {modalTab === 'links' && (
              <div className="cdash-modal-tab-panel">
                {detailFreelancer.portfolioLink && (
                  <div className="cdash-modal-field">
                    <p className="cdash-modal-label">Portfolio</p>
                    <a
                      href={detailFreelancer.portfolioLink}
                      target="_blank"
                      rel="noreferrer"
                      className="cdash-modal-link">
                      🔗 {detailFreelancer.portfolioLink}
                    </a>
                  </div>
                )}
                {detailFreelancer.linkedin && (
                  <div className="cdash-modal-field">
                    <p className="cdash-modal-label">LinkedIn</p>
                    <a
                      href={detailFreelancer.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="cdash-modal-link">
                      🔗 {detailFreelancer.linkedin}
                    </a>
                  </div>
                )}
                {detailFreelancer.github && (
                  <div className="cdash-modal-field">
                    <p className="cdash-modal-label">GitHub</p>
                    <a
                      href={detailFreelancer.github}
                      target="_blank"
                      rel="noreferrer"
                      className="cdash-modal-link">
                      🔗 {detailFreelancer.github}
                    </a>
                  </div>
                )}
                {!detailFreelancer.portfolioLink && !detailFreelancer.linkedin && !detailFreelancer.github && (
                  <p className="cdash-modal-empty">No links provided.</p>
                )}
              </div>
            )}

            <div className="cdash-modal-actions">
              <button
                className="cfc-btn-solid"
                onClick={() => { closeModal(); handleMessage(detailFreelancer); }}>
                💬 Message
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}