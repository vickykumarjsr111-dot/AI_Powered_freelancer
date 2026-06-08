import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, query, where, onSnapshot,
  addDoc, serverTimestamp, doc, getDoc, orderBy, deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import './Freelancerproposals.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function StatusBadge({ status }) {
  const map = {
    pending:  { label: 'Pending',  cls: 'badge--pending'  },
    accepted: { label: 'Accepted', cls: 'badge--accepted' },
    rejected: { label: 'Rejected', cls: 'badge--rejected' },
  };
  const s = map[status] || map.pending;
  return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
}

export default function FreelancerProposals() {
  const [userData, setUserData]             = useState(null);
  const [uid, setUid]                       = useState(null);
  const [proposals, setProposals]           = useState([]);
  const [jobs, setJobs]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [activeNav, setActiveNav]           = useState('proposals');
  const [showModal, setShowModal]           = useState(false);
  const [selectedJob, setSelectedJob]       = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm]                     = useState({ coverLetter: '', bidAmount: '' });
  const [submitting, setSubmitting]         = useState(false);
  const [deleting, setDeleting]             = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setUserData(snap.data());
        setUid(user.uid);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'proposals'),
      where('freelancerId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setProposals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const q = query(
      collection(db, 'jobs'),
      where('open', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!location.state?.applyJob) return;
    const raw = location.state.applyJob;
    setSelectedJob({
      id:         raw.id,
      title:      raw.title,
      clientName: raw.clientName || raw.company || 'Client',
      clientId:   raw.clientId   || null,
      budget:     raw.budget,
      skills:     raw.skills     || [],
      duration:   raw.duration   || '',
      experience: raw.experience || '',
    });
    setForm({ coverLetter: '', bidAmount: '' });
    setShowModal(true);
    window.history.replaceState({}, document.title);
  }, [location.state]);

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

  const handleNavigation = (id) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
    const routes = {
      dashboard: '/freelancer/dashboard',
      jobs:      '/freelancer/jobs',
      messages:  '/freelancer/messages',
      earnings:  '/freelancer/earnings',
      settings:  '/freelancer/profile',
    };
    if (routes[id]) navigate(routes[id]);
  };

  const alreadyApplied = (jobId) => proposals.some((p) => p.jobId === jobId);

  const openModal = (job) => {
    if (alreadyApplied(job.id)) return;
    setSelectedJob(job);
    setForm({ coverLetter: '', bidAmount: '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.coverLetter.trim() || !form.bidAmount) return;
    const user = auth.currentUser;
    if (!user || !selectedJob) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'proposals'), {
        freelancerId:   user.uid,
        freelancerName: userData?.name || 'Freelancer',
        jobId:          selectedJob.id,
        jobTitle:       selectedJob.title,
        clientId:       selectedJob.clientId || null,
        clientName:     selectedJob.clientName || selectedJob.company || 'Client',
        company:        selectedJob.clientName || selectedJob.company || 'Client',
        bidAmount:      Number(form.bidAmount),
        coverLetter:    form.coverLetter.trim(),
        status:         'pending',
        createdAt:      serverTimestamp(),
      });
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (proposalId) => {
    if (!window.confirm('Delete this proposal? This cannot be undone.')) return;
    setDeleting(proposalId);
    try {
      await deleteDoc(doc(db, 'proposals', proposalId));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', color:'#fff', fontSize:'14px' }}>
      Loading...
    </div>
  );

  const name     = userData?.name || 'User';
  const initials = getInitials(name);
  const role     = userData?.role || 'freelancer';

  return (
    <>
      {!mobileMenuOpen && createPortal(
        <button className="fp-mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}
          aria-label="Toggle menu">
          <Menu size={22} />
        </button>,
        document.body
      )}

      <div className="fp-shell">
        <aside className={`fp-sidebar ${mobileMenuOpen ? 'fp-sidebar--open' : ''}`}>
          <div className="fp-brand">
            <div className="fp-brand-icon">
              <img src="/image.png" alt="Logo" style={{ width:20, height:20, objectFit:'contain' }} />
            </div>
            <span className="fp-brandname">Hustlance<span>AI</span></span>
          </div>

          <nav className="fp-nav">
            {[
              { id:'dashboard', label:'Dashboard'  },
              { id:'jobs',      label:'Browse Jobs' },
              { id:'proposals', label:'Proposals', badge: proposals.length },
              { id:'messages',  label:'Messages'   },
              { id:'earnings',  label:'Earnings'   },
              { id:'settings',  label:'Settings'   },
            ].map((item) => (
              <button key={item.id}
                className={`fp-nav-btn ${activeNav === item.id ? 'fp-nav-btn--active' : ''}`}
                onClick={() => handleNavigation(item.id)}>
                <span className="fp-nav-label">{item.label}</span>
                {item.badge > 0 && <span className="fp-nav-badge">{item.badge}</span>}
              </button>
            ))}
            <button className="fp-nav-btn" onClick={handleLogout}
              style={{ marginTop:'auto', color:'#ef4444' }}>
              <span className="fp-nav-label">Logout</span>
            </button>
          </nav>

          <div className="fp-profile">
            <div className="fp-profile-av">{initials}</div>
            <div className="fp-profile-info">
              <p className="fp-profile-name">{name}</p>
              <p className="fp-profile-role" style={{ textTransform:'capitalize' }}>{role}</p>
            </div>
            <span className="fp-online-dot" />
          </div>
        </aside>

        <div className={`fp-overlay ${mobileMenuOpen ? 'fp-overlay--active' : ''}`}
          onClick={() => setMobileMenuOpen(false)} />

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
              { label: 'Pending',    value: proposals.filter((p) => p.status === 'pending').length  },
              { label: 'Accepted',   value: proposals.filter((p) => p.status === 'accepted').length },
              { label: 'Rejected',   value: proposals.filter((p) => p.status === 'rejected').length },
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
              {jobs.length === 0 ? (
                <div className="fp-empty">No jobs available right now.</div>
              ) : (
                <div className="fp-job-list">
                  {jobs.map((job) => {
                    const applied = alreadyApplied(job.id);
                    return (
                      <div key={job.id} className="fp-job-card">
                        <div className="fp-job-top">
                          <div>
                            <p className="fp-job-title">{job.title}</p>
                            <p className="fp-job-company">{job.clientName || 'Client'}</p>
                          </div>
                          <span className="fp-job-budget">${job.budget}</span>
                        </div>
                        <div className="fp-job-tags">
                          {(job.skills || []).map((skill) => (
                            <span key={skill} className="fp-tag">{skill}</span>
                          ))}
                        </div>
                        <button
                          className={`fp-apply-btn ${applied ? 'fp-apply-btn--done' : ''}`}
                          onClick={() => openModal(job)}
                          disabled={applied}>
                          {applied ? '✓ Applied' : 'Submit Proposal'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
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
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <StatusBadge status={p.status} />
                          {/* Delete button — only for pending proposals */}
                          {p.status === 'pending' && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deleting === p.id}
                              style={{
                                background: 'none', border: '1px solid #2a2a2a',
                                color: '#6b7280', cursor: 'pointer',
                                fontSize: '11px', padding: '3px 8px',
                                borderRadius: '6px', transition: 'all 0.15s',
                                fontFamily: 'Inter, sans-serif',
                              }}
                              onMouseEnter={e => {
                                e.target.style.borderColor = '#ef4444';
                                e.target.style.color = '#ef4444';
                              }}
                              onMouseLeave={e => {
                                e.target.style.borderColor = '#2a2a2a';
                                e.target.style.color = '#6b7280';
                              }}>
                              {deleting === p.id ? '...' : 'Delete'}
                            </button>
                          )}
                        </div>
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

        {/* ── Modal ── */}
        {showModal && selectedJob && (
          <div className="fp-modal-overlay"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="fp-modal">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <h2 className="fp-modal-title">Submit Proposal</h2>
                <button onClick={() => setShowModal(false)}
                  style={{ background:'none', border:'none', color:'#888',
                    fontSize:'22px', cursor:'pointer', lineHeight:1 }}>×</button>
              </div>
              <p className="fp-modal-job">{selectedJob.title}</p>
              <p className="fp-modal-company">
                {selectedJob.clientName || selectedJob.company || 'Client'} · ${selectedJob.budget}
              </p>

              <div className="fp-modal-field">
                <label>Your Bid Amount ($)</label>
                <input type="number" placeholder="e.g. 4000"
                  value={form.bidAmount}
                  onChange={(e) => setForm({ ...form, bidAmount: e.target.value })} />
              </div>

              <div className="fp-modal-field">
                <label>Cover Letter</label>
                <textarea rows={5} placeholder="Why are you the best fit for this job?"
                  value={form.coverLetter}
                  onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} />
              </div>

              <div className="fp-modal-actions">
                <button className="fp-modal-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="fp-modal-submit" onClick={handleSubmit}
                  disabled={submitting || !form.coverLetter.trim() || !form.bidAmount}>
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