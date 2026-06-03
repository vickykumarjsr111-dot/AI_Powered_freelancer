import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import {
<<<<<<< HEAD
  doc, getDoc, collection, getDocs,
  addDoc, query, where, onSnapshot,
  serverTimestamp, orderBy
=======
  doc,
  getDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  where
>>>>>>> fd88854a84e9b8a4f3628bbbdfdc1082c5e9be8f
} from 'firebase/firestore';

import { useNavigate } from 'react-router-dom';

import './BrowseJobs.css';

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

<<<<<<< HEAD
export default function ClientDashboard() {
  const [userData, setUserData]               = useState(null);
  const [freelancers, setFreelancers]         = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [activeNav, setActiveNav]             = useState('dashboard');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedSkill, setSelectedSkill]     = useState('All');

  // ── Real stats from Firestore ──
  const [activeContractsCount, setActiveContractsCount]   = useState(0);
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);
  const [totalSpent, setTotalSpent]                       = useState(0);
=======
function serializeJob(job) {
  const { createdAt, ...rest } = job;
  return rest;
}

export default function BrowseJobs() {

  const navigate = useNavigate();

  const [userData, setUserData] =
    useState(null);

  const [jobs, setJobs] =
    useState([]);

  const [savedJobs, setSavedJobs] =
    useState(new Set());

  const [searchTerm, setSearchTerm] =
    useState('');

  const [selectedSkill, setSelectedSkill] =
    useState('All');

  const [selectedJob, setSelectedJob] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);
>>>>>>> fd88854a84e9b8a4f3628bbbdfdc1082c5e9be8f

  const profileRef = useRef(null);

  useEffect(() => {
<<<<<<< HEAD
    let unsubContracts  = null;
    let unsubProposals  = null;
    let unsubPayments   = null;

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) setUserData(snap.data());
        else { navigate('/login'); return; }

        // Freelancers (one-time fetch — doesn't change often)
        const fsSnap = await getDocs(collection(db, 'freelancers'));
        setFreelancers(fsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        // ── Live: active contracts ──
        unsubContracts = onSnapshot(
          query(collection(db, 'contracts'),
            where('clientId', '==', currentUser.uid),
            where('status',   '==', 'active')),
          (s) => setActiveContractsCount(s.size)
        );

        // ── Live: pending proposals ──
        unsubProposals = onSnapshot(
          query(collection(db, 'proposals'),
            where('clientId', '==', currentUser.uid),
            where('status',   '==', 'pending')),
          (s) => setPendingProposalsCount(s.size)
        );

        // ── Live: total spent (released payments) ──
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
=======

    const unsub =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          if (!currentUser) {
            navigate('/login');
            return;
          }

          try {

            const snap = await getDoc(
              doc(db, 'users', currentUser.uid)
            );

            if (snap.exists()) {
              setUserData(snap.data());
            } else {
              navigate('/login');
            }

          } catch (err) {

            console.error(err);

          } finally {

            setLoading(false);

          }
        }
      );

    const q = query(
      collection(db, 'jobs'),
      where('open', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubJobs =
      onSnapshot(q, (snap) => {

        setJobs(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      });

    return () => {

      unsub();
      unsubJobs();

    };

>>>>>>> fd88854a84e9b8a4f3628bbbdfdc1082c5e9be8f
  }, [navigate]);

  useEffect(() => {

    const handle = (e) => {

      if (
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handle
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handle
      );

  }, []);

  const handleLogout = async () => {

    await signOut(auth);

    navigate('/');

  };

  const handleNavigation = (id) => {
<<<<<<< HEAD
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
=======
>>>>>>> fd88854a84e9b8a4f3628bbbdfdc1082c5e9be8f

    setMobileMenuOpen(false);

    switch (id) {

      case 'dashboard':
        navigate('/freelancer/dashboard');
        break;

      case 'jobs':
        navigate('/freelancer/jobs');
        break;

      case 'proposals':
        navigate('/freelancer/proposals');
        break;

      case 'messages':
        navigate('/freelancer/messages');
        break;

      case 'earnings':
        navigate('/freelancer/earnings');
        break;

      case 'settings':
        navigate('/freelancer/settings');
        break;

      default:
        break;
    }
  };

  const toggleSave = (id) => {

    setSavedJobs((prev) => {

      const next = new Set(prev);

      next.has(id)
        ? next.delete(id)
        : next.add(id);

      return next;
    });
  };

  const handleApply = (job) => {

    navigate(
      '/freelancer/proposals',
      {
        state: {
          applyJob: serializeJob(job),
        },
      }
    );
  };

  const filteredJobs = jobs.filter(
    (job) => {

      const searchMatch =

        job.title
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          ) ||

        (job.clientName || '')
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );

      const skillMatch =

        selectedSkill === 'All' ||

        (job.skills || [])
          .includes(selectedSkill);

      return searchMatch && skillMatch;
    }
  );

  if (loading) {

    return (
      <div className="browse-loading">
        Loading...
      </div>
    );
  }

  const name =
    userData?.name || 'User';

<<<<<<< HEAD
  // Format total spent nicely
  const spentLabel = totalSpent >= 1000
    ? `$${(totalSpent / 1000).toFixed(1)}k`
    : `$${totalSpent}`;

  const STATS = [
    { label: 'Freelancers Available', value: freelancers.length.toString(), delta: null    },
    { label: 'Active Contracts',      value: activeContractsCount.toString(), delta: null  },
    { label: 'Pending Proposals',     value: pendingProposalsCount.toString(), delta: null },
    { label: 'Total Spent',           value: spentLabel,                       delta: null },
  ];
=======
  const role =
    userData?.role || 'freelancer';

  const initials =
    getInitials(name);
>>>>>>> fd88854a84e9b8a4f3628bbbdfdc1082c5e9be8f

  return (

<<<<<<< HEAD
      {/* ── Sidebar ── */}
      <aside className="cdash-sidebar">
        <div className="cdash-brand">
          <div className="cbrand-icon">
            <img src="/image.png" alt="Logo"
              style={{ width:20, height:20, objectFit:'contain' }} />
=======
    <div className="browse-shell">

      {/* SIDEBAR */}

      <aside
        className={`browse-sidebar ${
          mobileMenuOpen
            ? 'mobile-open'
            : ''
        }`}
      >

        <div className="browse-brand">

          <div className="brand-icon">

            <img
              src="/image.png"
              alt="Logo"
            />

>>>>>>> fd88854a84e9b8a4f3628bbbdfdc1082c5e9be8f
          </div>

          <span className="brand-name">
            Hustlance<span>AI</span>
          </span>

        </div>

        <nav className="browse-nav">

          {[
<<<<<<< HEAD
            { id:'dashboard', label:'Dashboard'  },
            { id:'post-job',  label:'Post a Job' },
            { id:'messages',  label:'Messages'   },
            { id:'contracts', label:'Contracts'  },
            { id:'payments',  label:'Payments'   },
            { id:'settings',  label:'Settings'   },
          ].map((item) => (
            <button key={item.id}
              className={`cnav-btn ${activeNav === item.id ? 'cnav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}>
              <span className="cnav-label">{item.label}</span>
=======
            {
              id: 'dashboard',
              label: 'Dashboard',
            },

            {
              id: 'jobs',
              label: 'Browse Jobs',
            },

            {
              id: 'proposals',
              label: 'Proposals',
            },

            {
              id: 'messages',
              label: 'Messages',
            },

            {
              id: 'earnings',
              label: 'Earnings',
            },

            {
              id: 'settings',
              label: 'Settings',
            },

          ].map((item) => (

            <button
              key={item.id}
              className={`nav-btn ${
                item.id === 'jobs'
                  ? 'nav-btn--active'
                  : ''
              }`}
              onClick={() =>
                handleNavigation(item.id)
              }
            >
              {item.label}
>>>>>>> fd88854a84e9b8a4f3628bbbdfdc1082c5e9be8f
            </button>

          ))}

          <button
            className="nav-btn logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </nav>

        {/* PROFILE */}

        <div
          className="browse-profile"
          ref={profileRef}
          onClick={() =>
            setProfileMenuOpen((p) => !p)
          }
        >

          <div className="profile-avatar">
            {initials}
          </div>

          <div className="profile-info">

            <p className="profile-name">
              {name}
            </p>

            <p
              className="profile-role"
              style={{
                textTransform:
                  'capitalize',
              }}
            >
              {role}
            </p>

          </div>

          <span className="online-dot" />

          {/* POPUP */}

          {profileMenuOpen && (

            <div
              className="browse-profile-popup"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="bpopup-header">

                <div className="bpopup-av">
                  {initials}
                </div>

                <div>

                  <p className="bpopup-name">
                    {name}
                  </p>

                  <p
                    className="bpopup-role"
                    style={{
                      textTransform:
                        'capitalize',
                    }}
                  >
                    {role}
                  </p>

                </div>

              </div>
<<<<<<< HEAD
              <div className="cpopup-divider" />
              <button className="cpopup-item"
                onClick={() => { setProfileMenuOpen(false); navigate('/client/profile'); }}>
                ✏️ &nbsp;Update Profile
              </button>
      
              <div className="cpopup-divider" />
              <button className="cpopup-item cpopup-item--danger"
                onClick={() => { setProfileMenuOpen(false); handleLogout(); }}>
=======

              <div className="bpopup-divider" />

              {/* UPDATE PROFILE */}

              <button
                className="bpopup-item"
                onClick={() => {

                  setProfileMenuOpen(false);

                  navigate(
                    '/freelancer/profile'
                  );
                }}
              >
                📝 &nbsp;Update Profile
              </button>

              {/* SETTINGS */}

              <button
                className="bpopup-item"
                onClick={() => {

                  setProfileMenuOpen(false);

                  navigate(
                    '/freelancer/settings'
                  );
                }}
              >
                ⚙️ &nbsp;Settings
              </button>

              <div className="bpopup-divider" />

              {/* LOGOUT */}

              <button
                className="bpopup-item bpopup-item--danger"
                onClick={() => {

                  setProfileMenuOpen(false);

                  handleLogout();
                }}
              >
>>>>>>> fd88854a84e9b8a4f3628bbbdfdc1082c5e9be8f
                🚪 &nbsp;Logout
              </button>

            </div>

          )}

        </div>

      </aside>

<<<<<<< HEAD
      {/* ── Main ── */}
      <main className="cdash-main">
        <div className="cdash-header">
         <div>
          <h1 className="cdash-greeting">Welcome, {firstName} 👋</h1>
          <p className="cdash-sub">Find and hire the best freelancers for your projects</p>
         </div>
=======
      {/* MAIN */}

      <main className="browse-main">

        {!mobileMenuOpen &&
          createPortal(

            <button
              className="mobile-menu-btn"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              aria-label="Toggle menu"
            >
              <Menu size={22} />
            </button>,

            document.body
          )}

        <div
          className={`browse-overlay ${
            mobileMenuOpen
              ? 'browse-overlay--active'
              : ''
          }`}
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />

        <div className="browse-header">

          <h1>Browse Jobs</h1>

          <p>
            AI-matched opportunities
            tailored for your skills
          </p>

>>>>>>> fd88854a84e9b8a4f3628bbbdfdc1082c5e9be8f
        </div>

        {/* SEARCH */}

        <div className="search-section">

          <input
            type="text"
            placeholder="Search jobs, companies..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

          <div className="skill-filters">

            {[
              'All',
              'React',
              'Node.js',
              'Python',
              'AWS',
            ].map((skill) => (

              <button
                key={skill}
                className={
                  selectedSkill === skill
                    ? 'skill-active'
                    : ''
                }
                onClick={() =>
                  setSelectedSkill(skill)
                }
              >
                {skill}
              </button>

            ))}

          </div>

        </div>

        {/* CONTENT */}

        <div className="browse-content">

          <section className="jobs-list">

            {filteredJobs.length === 0 ? (

              <p
                style={{
                  color: '#888',
                  fontSize: '14px',
                  padding: '16px 0',
                }}
              >
                No jobs found.
              </p>

            ) : (

              filteredJobs.map((job) => (

                <div
                  key={job.id}
                  className="job-card"
                >

                  <div className="job-top">

                    <div>

                      <h3>{job.title}</h3>

                      <p>
                        {job.clientName ||
                          'Client'}
                      </p>

                    </div>

                    <div className="job-match">
                      🟢 Open
                    </div>

                  </div>

                  <div className="job-meta">

                    <span>
                      ${job.budget}
                    </span>

                    <span>
                      {job.duration}
                    </span>

                    <span>
                      {job.experience ||
                        'Any level'}
                    </span>

                    <span>

                      {job.createdAt?.toDate

                        ? job.createdAt
                            .toDate()
                            .toLocaleDateString()

                        : 'Just now'}

                    </span>

                  </div>

                  <div className="job-tags">

                    {(job.skills || []).map(
                      (skill) => (

                        <span key={skill}>
                          {skill}
                        </span>

                      )
                    )}

                  </div>

                  <div className="job-actions">

                    <button
                      onClick={() =>
                        toggleSave(job.id)
                      }
                    >
                      {savedJobs.has(job.id)
                        ? '♥ Saved'
                        : '♡ Save'}
                    </button>

                    <button
                      onClick={(e) => {

                        e.stopPropagation();

                        setSelectedJob(job);
                      }}
                    >
                      Details
                    </button>

                    <button
                      className="apply-btn"
                      onClick={() =>
                        handleApply(job)
                      }
                    >
                      Apply Now
                    </button>

                  </div>

                </div>

              ))
            )}

          </section>

          {/* RIGHT SIDE */}

          <aside className="browse-right">

            <div className="insight-card">

              <span>AI Insight</span>

              <p>

                Jobs requiring
                <strong>
                  {' '}React + TypeScript
                </strong>
                {' '}have 38% less
                competition this week.

              </p>

            </div>

            <div className="insight-card">

              <h3>
                Recommended Skills
              </h3>

              <div className="recommended-skills">

                <span>Next.js</span>

                <span>Firebase</span>

                <span>GraphQL</span>

              </div>

            </div>

          </aside>

        </div>

      </main>

      {/* MODAL */}

      {selectedJob && (

        <div
          className="job-modal-overlay"
          onMouseDown={(e) => {

            if (
              e.target === e.currentTarget
            ) {
              setSelectedJob(null);
            }
          }}
        >

          <div className="job-modal">

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'flex-start',
              }}
            >

              <h2>
                {selectedJob.title}
              </h2>

              <button
                onClick={() =>
                  setSelectedJob(null)
                }
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '22px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>

            </div>

            <p className="modal-company">

              {selectedJob.clientName ||
                'Client'}

            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                fontSize: '13px',
                color: '#aaa',
                margin: '8px 0',
              }}
            >

              <span>
                ${selectedJob.budget}
              </span>

              <span>·</span>

              <span>
                {selectedJob.duration}
              </span>

              <span>·</span>

              <span>
                {selectedJob.experience ||
                  'Any level'}
              </span>

            </div>

            <p
              style={{
                fontSize: '14px',
                color: '#ccc',
                lineHeight: 1.6,
              }}
            >
              {selectedJob.description ||
                'No description provided.'}
            </p>

            <div className="modal-tags">

              {(selectedJob.skills || [])
                .map((skill) => (

                  <span key={skill}>
                    {skill}
                  </span>

                ))}

            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '16px',
              }}
            >

              <button
                className="close-modal"
                style={{ flex: 1 }}
                onClick={() =>
                  setSelectedJob(null)
                }
              >
                Close
              </button>

              <button
                className="close-modal"
                style={{
                  flex: 1,
                  background: '#fff',
                  color: '#000',
                }}
                onClick={() => {

                  const j = selectedJob;

                  setSelectedJob(null);

                  handleApply(j);
                }}
              >
                Apply Now
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}