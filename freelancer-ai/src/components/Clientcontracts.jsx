import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, query, where, onSnapshot,
  doc, getDoc, updateDoc, addDoc,
  getDocs, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './ClientContracts.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function StatusBadge({ status }) {
  const map = {
    active:    { label: 'Active',    cls: 'ccbadge--active'    },
    completed: { label: 'Completed', cls: 'ccbadge--completed' },
    cancelled: { label: 'Cancelled', cls: 'ccbadge--cancelled' },
    pending:   { label: 'Pending',   cls: 'ccbadge--pending'   },
    accepted:  { label: 'Accepted',  cls: 'ccbadge--active'    },
    rejected:  { label: 'Rejected',  cls: 'ccbadge--cancelled' },
  };
  const s = map[status] || map.pending;
  return <span className={`cc-status-badge ${s.cls}`}>{s.label}</span>;
}

export default function ClientContracts() {
  const [userData,  setUserData]  = useState(null);
  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeNav, setActiveNav] = useState('contracts');
  const [filter,    setFilter]    = useState('all');
  const [updating,  setUpdating]  = useState(null);
  const [tab,       setTab]       = useState('proposals');

  const navigate = useNavigate();

  // ── Message handler (inside component → has access to userData + navigate) ──
  const handleMessage = async (contract) => {
    try {
      const chatsQ = query(
        collection(db, 'chats'),
        where('clientId',     '==', auth.currentUser.uid),
        where('freelancerId', '==', contract.freelancerId)
      );
      const snap = await getDocs(chatsQ);

      let chatId;
      if (!snap.empty) {
        chatId = snap.docs[0].id;
      } else {
        const chatRef = await addDoc(collection(db, 'chats'), {
          clientId:       auth.currentUser.uid,
          clientName:     userData?.name || 'Client',
          freelancerId:   contract.freelancerId,
          freelancerName: contract.freelancerName,
          contractId:     contract.id,
          projectTitle:   contract.projectTitle,
          lastMessage:    '',
          lastAt:         serverTimestamp(),
          createdAt:      serverTimestamp(),
        });
        chatId = chatRef.id;
      }

      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error('Error opening chat:', err);
    }
  };

  // ── Auth + realtime listeners ──
  useEffect(() => {
    let unsubProposals = null;
    let unsubContracts = null;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/login'); return; }

      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserData(snap.data());

      const proposalsQ = query(
        collection(db, 'proposals'),
        where('clientId', '==', user.uid)
      );
      unsubProposals = onSnapshot(proposalsQ, (snapshot) => {
        setProposals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      const contractsQ = query(
        collection(db, 'contracts'),
        where('clientId', '==', user.uid)
      );
      unsubContracts = onSnapshot(contractsQ, (snapshot) => {
        setContracts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsub();
      if (unsubProposals) unsubProposals();
      if (unsubContracts) unsubContracts();
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
      settings:   '/client/profile',
    };
    if (routes[id]) navigate(routes[id]);
  };

  // ── Accept proposal → create contract → close job ──
  const acceptProposal = async (proposal) => {
    setUpdating(proposal.id);
    try {
      // 1. Mark proposal accepted
      await updateDoc(doc(db, 'proposals', proposal.id), { status: 'accepted' });

      // 2. Create contract
      await addDoc(collection(db, 'contracts'), {
        clientId:       auth.currentUser.uid,
        clientName:     userData?.name || 'Client',
        freelancerId:   proposal.freelancerId,
        freelancerName: proposal.freelancerName,
        jobId:          proposal.jobId,
        projectTitle:   proposal.jobTitle,
        agreedAmount:   proposal.bidAmount,
        coverLetter:    proposal.coverLetter,
        status:         'active',
        createdAt:      serverTimestamp(),
        deadline:       'Not specified',
      });

      // 3. Close the job so no freelancer can see it anymore
      if (proposal.jobId) {
        await updateDoc(doc(db, 'jobs', proposal.jobId), { open: false });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  // ── Reject proposal ──
  const rejectProposal = async (proposalId) => {
    setUpdating(proposalId);
    try {
      await updateDoc(doc(db, 'proposals', proposalId), { status: 'rejected' });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  // ── Update contract status ──
  const updateContractStatus = async (contractId, status) => {
    setUpdating(contractId);
    try {
      await updateDoc(doc(db, 'contracts', contractId), { status });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredContracts = filter === 'all'
    ? contracts
    : contracts.filter((c) => c.status === filter);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', color:'#fff', fontSize:'14px' }}>
      Loading...
    </div>
  );

  const name     = userData?.name || 'Client';
  const initials = getInitials(name);
  const role     = userData?.role || 'client';

  const counts = {
    all:       contracts.length,
    active:    contracts.filter((c) => c.status === 'active').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
    cancelled: contracts.filter((c) => c.status === 'cancelled').length,
  };

  const pendingProposals  = proposals.filter((p) => p.status === 'pending');
  const reviewedProposals = proposals.filter((p) => p.status !== 'pending');

  return (
    <div className="cc-shell">

      {/* ── Sidebar ── */}
      <aside className="cc-sidebar">
        <div className="cc-brand">
          <div className="cc-brand-icon">
            <img src="/image.png" alt="Logo"
              style={{ width:20, height:20, objectFit:'contain' }} />
          </div>
          <span className="cc-brandname">Hustlance<span>AI</span></span>
        </div>

        <nav className="cc-nav">
          {[
            { id:'dashboard',  label:'Dashboard'  },
            { id:'post-job',   label:'Post a Job' },
            { id:'messages',   label:'Messages'   },
            { id:'contracts',  label:'Contracts', badge: pendingProposals.length },
            { id:'settings',   label:'Settings'   },
          ].map((item) => (
            <button key={item.id}
              className={`cc-nav-btn ${activeNav === item.id ? 'cc-nav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}>
              <span className="cc-nav-label">{item.label}</span>
              {item.badge > 0 && <span className="cc-nav-badge">{item.badge}</span>}
            </button>
          ))}
          <button className="cc-nav-btn" onClick={handleLogout}
            style={{ marginTop:'auto', color:'#ef4444' }}>
            <span className="cc-nav-label">Logout</span>
          </button>
        </nav>

        <div className="cc-profile">
          <div className="cc-profile-av">{initials}</div>
          <div className="cc-profile-info">
            <p className="cc-profile-name">{name}</p>
            <p className="cc-profile-role" style={{ textTransform:'capitalize' }}>{role}</p>
          </div>
          <span className="cc-online-dot" />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="cc-main">
        <div className="cc-header">
          <div>
            <h1 className="cc-title">Contracts</h1>
            <p className="cc-sub">Review proposals and manage your active contracts</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="cc-stats">
          {[
            { label: 'Total Contracts', value: counts.all              },
            { label: 'Active',          value: counts.active           },
            { label: 'Completed',       value: counts.completed        },
            { label: 'New Proposals',   value: pendingProposals.length },
          ].map((s) => (
            <div key={s.label} className="cc-stat-card">
              <p className="cc-stat-label">{s.label}</p>
              <p className="cc-stat-value">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="cc-tabs">
          <button
            className={`cc-tab-btn ${tab === 'proposals' ? 'cc-tab-btn--active' : ''}`}
            onClick={() => setTab('proposals')}>
            Proposals
            {pendingProposals.length > 0 && (
              <span className="cc-tab-badge">{pendingProposals.length}</span>
            )}
          </button>
          <button
            className={`cc-tab-btn ${tab === 'contracts' ? 'cc-tab-btn--active' : ''}`}
            onClick={() => setTab('contracts')}>
            Contracts
          </button>
        </div>

        {/* ── Proposals Tab ── */}
        {tab === 'proposals' && (
          <div>
            {proposals.length === 0 ? (
              <div className="cc-empty">No proposals received yet.</div>
            ) : (
              <div className="cc-list">

                {/* Pending */}
                {pendingProposals.length > 0 && (
                  <>
                    <p style={{ color:'#888', fontSize:'13px', marginBottom:'8px' }}>
                      Awaiting review
                    </p>
                    {pendingProposals.map((p) => (
                      <div key={p.id} className="cc-card">
                        <div className="cc-card-top">
                          <div className="cc-card-left">
                            <div className="cc-freelancer-av">
                              {getInitials(p.freelancerName || 'F')}
                            </div>
                            <div>
                              <p className="cc-freelancer-name">{p.freelancerName || 'Freelancer'}</p>
                              <p className="cc-job-title">{p.jobTitle || 'Job'}</p>
                            </div>
                          </div>
                          <div className="cc-card-right">
                            <StatusBadge status={p.status} />
                            <span className="cc-bid">${p.bidAmount}</span>
                          </div>
                        </div>
                        <p className="cc-cover-letter">{p.coverLetter}</p>
                        <div className="cc-card-footer">
                          <div className="cc-actions">
                            <button className="cc-btn-cancel"
                              disabled={updating === p.id}
                              onClick={() => rejectProposal(p.id)}>
                              Reject
                            </button>
                            <button className="cc-btn-complete"
                              disabled={updating === p.id}
                              onClick={() => acceptProposal(p)}>
                              {updating === p.id ? 'Saving...' : 'Accept & Create Contract'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Reviewed */}
                {reviewedProposals.length > 0 && (
                  <>
                    <p style={{ color:'#888', fontSize:'13px', margin:'16px 0 8px' }}>
                      Already reviewed
                    </p>
                    {reviewedProposals.map((p) => (
                      <div key={p.id} className="cc-card" style={{ opacity: 0.6 }}>
                        <div className="cc-card-top">
                          <div className="cc-card-left">
                            <div className="cc-freelancer-av">
                              {getInitials(p.freelancerName || 'F')}
                            </div>
                            <div>
                              <p className="cc-freelancer-name">{p.freelancerName || 'Freelancer'}</p>
                              <p className="cc-job-title">{p.jobTitle || 'Job'}</p>
                            </div>
                          </div>
                          <div className="cc-card-right">
                            <StatusBadge status={p.status} />
                            <span className="cc-bid">${p.bidAmount}</span>
                          </div>
                        </div>
                        <p className="cc-cover-letter">{p.coverLetter}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Contracts Tab ── */}
        {tab === 'contracts' && (
          <div>
            <div className="cc-filters">
              {['all', 'active', 'completed', 'cancelled'].map((f) => (
                <button key={f}
                  className={`cc-filter-btn ${filter === f ? 'cc-filter-btn--active' : ''}`}
                  onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className="cc-filter-count">{counts[f]}</span>
                </button>
              ))}
            </div>

            {filteredContracts.length === 0 ? (
              <div className="cc-empty">
                No {filter === 'all' ? '' : filter} contracts yet.
              </div>
            ) : (
              <div className="cc-list">
                {filteredContracts.map((contract) => (
                  <div key={contract.id} className="cc-card">
                    <div className="cc-card-top">
                      <div className="cc-card-left">
                        <div className="cc-freelancer-av">
                          {getInitials(contract.freelancerName || 'F')}
                        </div>
                        <div>
                          <p className="cc-freelancer-name">
                            {contract.freelancerName || 'Freelancer'}
                          </p>
                          <p className="cc-job-title">
                            {contract.projectTitle || 'Project'}
                          </p>
                        </div>
                      </div>
                      <div className="cc-card-right">
                        <StatusBadge status={contract.status} />
                        <span className="cc-bid">${contract.agreedAmount || 0}</span>
                      </div>
                    </div>

                    <p className="cc-cover-letter">{contract.coverLetter}</p>

                    <div className="cc-card-footer">
                      {contract.status === 'active' && (
                        <div className="cc-actions">
                          <button className="cc-btn-cancel"
                            disabled={updating === contract.id}
                            onClick={() => updateContractStatus(contract.id, 'cancelled')}>
                            Cancel
                          </button>
                          <button className="cc-btn-complete"
                            disabled={updating === contract.id}
                            onClick={() => updateContractStatus(contract.id, 'completed')}>
                            {updating === contract.id ? 'Saving...' : 'Mark Complete'}
                          </button>
                          <button className="cc-btn-message"
                            onClick={() => handleMessage(contract)}>
                            💬 Message
                          </button>
                        </div>
                      )}
                      {contract.status !== 'active' && (
                        <div className="cc-actions">
                          <button className="cc-btn-reset"
                            onClick={() => updateContractStatus(contract.id, 'active')}>
                            Reactivate
                          </button>
                          <button className="cc-btn-message"
                            onClick={() => handleMessage(contract)}>
                            💬 Message
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}