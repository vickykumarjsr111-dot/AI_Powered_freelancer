import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './FreelancerProposals.css';

const JOBS = [
  { id: 'j1', title: 'Senior React Developer – SaaS Dashboard', company: 'TechFlow Inc.', budget: '$4,500', skills: ['React', 'Node.js', 'TypeScript'] },
  { id: 'j2', title: 'Full-Stack Engineer – Fintech Startup', company: 'Paybridge', budget: '$6,000', skills: ['React', 'Python', 'AWS'] },
  { id: 'j3', title: 'Frontend Architect – E-commerce Platform', company: 'ShopNest', budget: '$3,200', skills: ['Next.js', 'Tailwind'] },
  { id: 'j4', title: 'React Native Developer – Mobile Revamp', company: 'Wanderly', budget: '$5,800', skills: ['React Native', 'Redux'] },
];

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', cls: 'badge--pending' },
    accepted: { label: 'Accepted', cls: 'badge--accepted' },
    rejected: { label: 'Rejected', cls: 'badge--rejected' },
  };

  const s = map[status] || map.pending;

  return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
}

export default function FreelancerProposals() {
  const [userData, setUserData] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('proposals');
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState({
    coverLetter: '',
    bidAmount: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let unsubSnap = null;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));

        if (snap.exists()) {
          setUserData(snap.data());
        }

        const q = query(
          collection(db, 'proposals'),
          where('freelancerId', '==', user.uid)
        );

        unsubSnap = onSnapshot(q, (snapshot) => {
          setProposals(
            snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data()
            }))
          );
          setLoading(false);
        });

      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    });

    return () => {
      unsub();
      if (unsubSnap) unsubSnap();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleNavigation = (id) => {
    setActiveNav(id);
    setMobileMenuOpen(false);

    const routes = {
      dashboard: '/freelancer/dashboard',
      jobs: '/freelancer/jobs',
      messages: '/freelancer/messages',
      earnings: '/freelancer/earnings',
      settings: '/freelancer/profile',
    };

    if (routes[id]) {
      navigate(routes[id]);
    }
  };

  const alreadyApplied = (jobId) =>
    proposals.some((p) => p.jobId === jobId);

  const openModal = (job) => {
    if (alreadyApplied(job.id)) return;

    setSelectedJob(job);
    setForm({
      coverLetter: '',
      bidAmount: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.coverLetter.trim() || !form.bidAmount) return;

    const user = auth.currentUser;
    if (!user || !selectedJob) return;

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'proposals'), {
        freelancerId: user.uid,
        freelancerName: userData?.name || 'Freelancer',
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        bidAmount: Number(form.bidAmount),
        coverLetter: form.coverLetter.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setShowModal(false);

    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
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
          fontSize: '14px'
        }}
      >
        Loading...
      </div>
    );
  }

  const name = userData?.name || 'User';
  const initials = getInitials(name);
  const role = userData?.role || 'freelancer';

  return (
    <>
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

      <div className="fp-shell">
        <aside className={`fp-sidebar ${mobileMenuOpen ? 'fp-sidebar--open' : ''}`}>
          <div className="fp-brand">
            <div className="fp-brand-icon">
              <img
                src="/image.png"
                alt="Logo"
                style={{
                  width: 20,
                  height: 20,
                  objectFit: 'contain'
                }}
              />
            </div>

            <span className="fp-brandname">
              Hustlance<span>AI</span>
            </span>
          </div>

          <nav className="fp-nav">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'jobs', label: 'Browse Jobs' },
              { id: 'proposals', label: 'Proposals', badge: proposals.length },
              { id: 'messages', label: 'Messages' },
              { id: 'earnings', label: 'Earnings' },
              { id: 'settings', label: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                className={`fp-nav-btn ${activeNav === item.id ? 'fp-nav-btn--active' : ''}`}
                onClick={() => handleNavigation(item.id)}
              >
                <span className="fp-nav-label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="fp-nav-badge">{item.badge}</span>
                )}
              </button>
            ))}

            <button
              className="fp-nav-btn"
              onClick={handleLogout}
              style={{ marginTop: 'auto', color: '#ef4444' }}
            >
              <span className="fp-nav-label">Logout</span>
            </button>
          </nav>

          <div className="fp-profile">
            <div className="fp-profile-av">{initials}</div>
            <div className="fp-profile-info">
              <p className="fp-profile-name">{name}</p>
              <p className="fp-profile-role" style={{ textTransform: 'capitalize' }}>
                {role}
              </p>
            </div>
            <span className="fp-online-dot" />
          </div>
        </aside>

        <div
          className={`fp-overlay ${mobileMenuOpen ? 'fp-overlay--active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        />

        <main className="fp-main">
          <div className="fp-header">
            <div>
              <h1 className="fp-title">Proposals</h1>
              <p className="fp-sub">Submit proposals and track their status</p>
            </div>
          </div>

          <div className="fp-stats">
            {[
              { label: 'Total Sent', value: proposals.length },
              { label: 'Pending', value: proposals.filter((p) => p.status === 'pending').length },
              { label: 'Accepted', value: proposals.filter((p) => p.status === 'accepted').length },
              { label: 'Rejected', value: proposals.filter((p) => p.status === 'rejected').length },
            ].map((s) => (
              <div key={s.label} className="fp-stat-card">
                <p className="fp-stat-label">{s.label}</p>
                <p className="fp-stat-value">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="fp-grid">
            <section>
              <h2 className="fp-section-title">Available Jobs</h2>
              <div className="fp-job-list">
                {JOBS.map((job) => {
                  const applied = alreadyApplied(job.id);

                  return (
                    <div key={job.id} className="fp-job-card">
                      <div className="fp-job-top">
                        <div>
                          <p className="fp-job-title">{job.title}</p>
                          <p className="fp-job-company">{job.company}</p>
                        </div>
                        <span className="fp-job-budget">{job.budget}</span>
                      </div>

                      <div className="fp-job-tags">
                        {job.skills.map((skill) => (
                          <span key={skill} className="fp-tag">{skill}</span>
                        ))}
                      </div>

                      <button
                        className={`fp-apply-btn ${applied ? 'fp-apply-btn--done' : ''}`}
                        onClick={() => openModal(job)}
                        disabled={applied}
                      >
                        {applied ? '✓ Applied' : 'Submit Proposal'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="fp-section-title">My Proposals</h2>

              {proposals.length === 0 ? (
                <div className="fp-empty">No proposals submitted yet.</div>
              ) : (
                <div className="fp-proposal-list">
                  {proposals.map((p) => (
                    <div key={p.id} className="fp-proposal-card">
                      <div className="fp-proposal-top">
                        <div>
                          <p className="fp-proposal-title">{p.jobTitle}</p>
                          <p className="fp-proposal-company">{p.company}</p>
                        </div>

                        <StatusBadge status={p.status} />
                      </div>

                      <p className="fp-proposal-letter">{p.coverLetter}</p>

                      <div className="fp-proposal-meta">
                        <span>Bid: <strong>${p.bidAmount}</strong></span>
                        <span>
                          {p.createdAt?.toDate
                            ? p.createdAt.toDate().toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>

        {showModal && selectedJob && (
          <div className="fp-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
              <h2 className="fp-modal-title">Submit Proposal</h2>
              <p className="fp-modal-job">{selectedJob.title}</p>
              <p className="fp-modal-company">
                {selectedJob.company} · {selectedJob.budget}
              </p>

              <div className="fp-modal-field">
                <label>Your Bid Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 4000"
                  value={form.bidAmount}
                  onChange={(e) =>
                    setForm({ ...form, bidAmount: e.target.value })
                  }
                />
              </div>

              <div className="fp-modal-field">
                <label>Cover Letter</label>
                <textarea
                  rows={5}
                  placeholder="Why are you the best fit for this job?"
                  value={form.coverLetter}
                  onChange={(e) =>
                    setForm({ ...form, coverLetter: e.target.value })
                  }
                />
              </div>

              <div className="fp-modal-actions">
                <button
                  className="fp-modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="fp-modal-submit"
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !form.coverLetter.trim() ||
                    !form.bidAmount
                  }
                >
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}