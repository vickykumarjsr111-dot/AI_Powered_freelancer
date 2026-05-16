import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const JOBS = [
  {
    id: 1,
    title: 'Senior React Developer – SaaS Dashboard',
    company: 'TechFlow Inc.',
    budget: '$4,500',
    duration: '3 months',
    match: 97,
    skills: ['React', 'Node.js', 'TypeScript'],
    proposals: 4,
    posted: '2h ago',
  },
  {
    id: 2,
    title: 'Full-Stack Engineer – Fintech Startup',
    company: 'Paybridge',
    budget: '$6,000',
    duration: '4 months',
    match: 91,
    skills: ['React', 'Python', 'AWS'],
    proposals: 7,
    posted: '5h ago',
  },
  {
    id: 3,
    title: 'Frontend Architect – E-commerce Platform',
    company: 'ShopNest',
    budget: '$3,200',
    duration: '2 months',
    match: 85,
    skills: ['Next.js', 'Tailwind'],
    proposals: 12,
    posted: '1d ago',
  },
  {
    id: 4,
    title: 'React Native Developer – Mobile Revamp',
    company: 'Wanderly',
    budget: '$5,800',
    duration: '6 months',
    match: 79,
    skills: ['React Native', 'Redux'],
    proposals: 9,
    posted: '2d ago',
  },
];

const ACTIVITY = [
  {
    id: 1,
    type: 'pending',
    text: 'Proposal sent to DataViz Studio',
    time: '1h ago',
  },
  {
    id: 2,
    type: 'new',
    text: 'Message from Aria at CloudBuild',
    time: '3h ago',
  },
  {
    id: 3,
    type: 'success',
    text: 'Contract started with NovaSpark',
    time: 'Yesterday',
  },
  {
    id: 4,
    type: 'success',
    text: '5-star review from Kelvin M.',
    time: '2d ago',
  },
];

const CIRC = 2 * Math.PI * 14;

function getGreeting() {
  const h = new Date().getHours();

  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [saved, setSaved] = useState(new Set());

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));

        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const toggleSave = (id) => {
    setSaved((prev) => {
      const next = new Set(prev);

      next.has(id) ? next.delete(id) : next.add(id);

      return next;
    });
  };

  const handleNavigation = (itemId) => {
    setActiveNav(itemId);

    switch (itemId) {
      case 'dashboard':
        navigate('/freelancer/dashboard');
        break;

      case 'jobs':
        navigate('/freelancer/jobs');
        break;

      case 'settings':
        navigate('/freelancer/profile');
        break;

      default:
        break;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: '#fff',
          fontSize: '14px',
        }}
      >
        Loading...
      </div>
    );
  }

  const name = userData?.name || 'User';
  const role = userData?.role || 'Freelancer';
  const initials = getInitials(name);
  const firstName = name.split(' ')[0];

  const STATS = [
    { label: 'Profile Views', value: '284', delta: '↑ +18%' },
    { label: 'Proposals Sent', value: '12', delta: '↑ +3' },
    { label: 'Active Contracts', value: '3', delta: null },
    { label: 'Earned This Month', value: '$8.3k', delta: '↑ +22%' },
  ];

  return (
    <div className="dash-shell">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <div className="brand-icon">
            <img
              src="/image.png"
              alt="Logo"
              style={{
                width: 20,
                height: 20,
                objectFit: 'contain',
              }}
            />
          </div>

          <span className="dash-brandname">
            Hustlance<span>AI</span>
          </span>
        </div>

        <nav className="dash-nav">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'jobs', label: 'Browse Jobs' },
            { id: 'proposals', label: 'Proposals', badge: 2 },
            { id: 'messages', label: 'Messages', badge: 4 },
            { id: 'earnings', label: 'Earnings' },
            { id: 'settings', label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${
                activeNav === item.id ? 'nav-btn--active' : ''
              }`}
              onClick={() => handleNavigation(item.id)}
            >
              <span className="nav-label">{item.label}</span>

              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          ))}

          <button
            className="nav-btn"
            onClick={handleLogout}
            style={{
              marginTop: 'auto',
              color: '#ef4444',
            }}
          >
            <span className="nav-label">Logout</span>
          </button>
        </nav>

        <div className="dash-profile">
          <div className="profile-av">{initials}</div>

          <div className="profile-info">
            <p className="profile-name">{name}</p>

            <p
              className="profile-role"
              style={{ textTransform: 'capitalize' }}
            >
              {role}
            </p>
          </div>

          <span className="online-dot" />
        </div>
      </aside>

      {/* Main */}
      <main className="dash-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">
              {getGreeting()}, {firstName} 👋
            </h1>

            <p className="dash-sub">
              Your AI found <strong>4 new matches</strong> since yesterday
            </p>
          </div>

          <div className="dash-actions">
            <button
              className="btn-outline"
              onClick={() => navigate('/freelancer/profile')}
            >
              Update Profile
            </button>

            <button className="btn-solid">
              New Proposal
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {STATS.map((s) => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>

              {s.delta && (
                <span className="stat-delta">{s.delta}</span>
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="content-grid">
          <section className="jobs-col">
            <div className="section-hdr">
              <h2 className="section-title">AI-matched jobs</h2>
              <span className="live-chip">Live</span>
            </div>

            <div className="job-list">
              {JOBS.map((job) => {
                const arc = (job.match / 100) * CIRC;

                return (
                  <div key={job.id} className="job-card">
                    <div className="job-top">
                      <div className="match-ring">
                        <svg viewBox="0 0 36 36" width="36" height="36">
                          <circle
                            className="ring-bg"
                            cx="18"
                            cy="18"
                            r="14"
                          />

                          <circle
                            className="ring-fill"
                            cx="18"
                            cy="18"
                            r="14"
                            strokeDasharray={`${arc.toFixed(1)} ${CIRC}`}
                            transform="rotate(-90 18 18)"
                          />
                        </svg>

                        <span className="match-pct">
                          {job.match}%
                        </span>
                      </div>

                      <div className="job-info">
                        <p className="job-title">{job.title}</p>
                        <p className="job-company">{job.company}</p>
                      </div>

                      <button
                        className={`save-btn ${
                          saved.has(job.id)
                            ? 'save-btn--saved'
                            : ''
                        }`}
                        onClick={() => toggleSave(job.id)}
                      >
                        {saved.has(job.id) ? '♥' : '♡'}
                      </button>
                    </div>

                    <div className="job-meta">
                      <span className="job-budget">
                        {job.budget}
                      </span>

                      <span className="sep">·</span>
                      <span>{job.duration}</span>

                      <span className="sep">·</span>
                      <span>{job.proposals} proposals</span>

                      <span className="job-posted">
                        {job.posted}
                      </span>
                    </div>

                    <div className="job-tags">
                      {job.skills.map((skill) => (
                        <span key={skill} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="job-actions">
                      <button className="btn-apply">
                        Apply Now
                      </button>

                      <button className="btn-details">
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Panel */}
          <aside className="right-col">
            <div className="panel-card">
              <h2 className="section-title">Activity</h2>

              <ul className="activity-list">
                {ACTIVITY.map((a) => (
                  <li key={a.id} className="activity-item">
                    <span
                      className={`activity-dot activity-dot--${a.type}`}
                    />

                    <div>
                      <p className="activity-text">{a.text}</p>
                      <p className="activity-time">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel-card">
              <h2 className="section-title">Profile strength</h2>

              <div className="strength-row">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{ width: '72%' }}
                  />
                </div>

                <span className="strength-pct">72%</span>
              </div>

              <p className="strength-hint">
                Add a portfolio to reach <strong>90%</strong>
                and get 3× more visibility.
              </p>

              <button className="btn-full-outline">
                Complete Profile
              </button>
            </div>

            <div className="panel-card panel-card--ai">
              <span className="ai-badge">AI Insight</span>

              <p className="ai-text">
                Jobs requiring <strong>TypeScript</strong> have
                40% less competition this week.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}