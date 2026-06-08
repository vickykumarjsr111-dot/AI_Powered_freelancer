import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc, getDoc, collection, query, where,
  onSnapshot, addDoc, updateDoc, serverTimestamp, orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Clientpayments.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ClientPayments() {
  const [userData,  setUserData]  = useState(null);
  const [contracts, setContracts] = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeNav, setActiveNav] = useState('payments');
  const [activeTab, setActiveTab] = useState('overview');
  const [payModal,  setPayModal]  = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paying,    setPaying]    = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let unsubContracts = null;
    let unsubPayments  = null;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/login'); return; }

      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserData(snap.data());

      const contractsQ = query(
        collection(db, 'contracts'),
        where('clientId', '==', user.uid)
      );
      unsubContracts = onSnapshot(contractsQ, (snapshot) => {
        setContracts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      const paymentsQ = query(
        collection(db, 'payments'),
        where('clientId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      unsubPayments = onSnapshot(paymentsQ, (snapshot) => {
        setPayments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsub();
      if (unsubContracts) unsubContracts();
      if (unsubPayments)  unsubPayments();
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
      payments:   '/client/payments',
      settings:   '/client/profile',
    };
    if (routes[id]) navigate(routes[id]);
  };

  const handleRelease = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0 || !payModal) return;
    setPaying(true);
    try {
      await addDoc(collection(db, 'payments'), {
        clientId:       auth.currentUser.uid,
        clientName:     userData?.name || 'Client',
        freelancerId:   payModal.freelancerId,
        freelancerName: payModal.freelancerName,
        contractId:     payModal.id,
        projectTitle:   payModal.projectTitle,
        amount:         amt,
        status:         'released',
        createdAt:      serverTimestamp(),
      });

      const totalPaid = payments
        .filter(p => p.contractId === payModal.id && p.status === 'released')
        .reduce((s, p) => s + (p.amount || 0), 0) + amt;

      if (payModal.agreedAmount && totalPaid >= Number(payModal.agreedAmount)) {
        await updateDoc(doc(db, 'contracts', payModal.id), { status: 'completed' });
      }

      setPayModal(null);
      setPayAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', color:'#fff', fontSize:'14px' }}>Loading...</div>
  );

  const name     = userData?.name || 'Client';
  const initials = getInitials(name);
  const role     = userData?.role || 'client';

  const totalSpent      = payments.filter(p => p.status === 'released').reduce((s, p) => s + (p.amount || 0), 0);
  const pendingPayouts  = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const contractBudget  = contracts.filter(c => c.status === 'active').reduce((s, c) => s + (Number(c.agreedAmount) || 0), 0);

  const paidForContract = (contractId) =>
    payments.filter(p => p.contractId === contractId && p.status === 'released')
      .reduce((s, p) => s + (p.amount || 0), 0);

  const remainingForContract = (c) => Math.max((Number(c.agreedAmount) || 0) - paidForContract(c.id), 0);

  return (
    <div className="cp-shell">

      <aside className="cp-sidebar">
        <div className="cp-brand">
          <div className="cp-brand-icon">
            <img src="/image.png" alt="Logo" style={{ width:20, height:20, objectFit:'contain' }} />
          </div>
          <span className="cp-brandname">Hustlance<span>AI</span></span>
        </div>

        <nav className="cp-nav">
          {[
            { id:'dashboard',  label:'Dashboard'  },
            { id:'post-job',   label:'Post a Job' },
            { id:'messages',   label:'Messages'   },
            { id:'contracts',  label:'Contracts'  },
            { id:'payments',   label:'Payments'   },
            { id:'settings',   label:'Settings'   },
          ].map((item) => (
            <button key={item.id}
              className={`cp-nav-btn ${activeNav === item.id ? 'cp-nav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}>
              <span className="cp-nav-label">{item.label}</span>
            </button>
          ))}
          <button className="cp-nav-btn" onClick={handleLogout}
            style={{ marginTop:'auto', color:'#ef4444' }}>
            <span className="cp-nav-label">Logout</span>
          </button>
        </nav>

        <div className="cp-profile">
          <div className="cp-profile-av">{initials}</div>
          <div className="cp-profile-info">
            <p className="cp-profile-name">{name}</p>
            <p className="cp-profile-role" style={{ textTransform:'capitalize' }}>{role}</p>
          </div>
          <span className="cp-online-dot" />
        </div>
      </aside>

      <main className="cp-main">
        <div className="cp-header">
          <div>
            <h1 className="cp-title">Payments</h1>
            <p className="cp-sub">Release funds to freelancers and track spending</p>
          </div>
        </div>

        <div className="cp-stats">
          {[
            { label: 'Total Spent',      value: `$${totalSpent.toLocaleString()}`    },
            { label: 'Active Contracts', value: activeContracts                       },
            { label: 'Committed Budget', value: `$${contractBudget.toLocaleString()}` },
            { label: 'Pending Releases', value: `$${pendingPayouts.toLocaleString()}` },
          ].map((s) => (
            <div key={s.label} className="cp-stat-card">
              <p className="cp-stat-label">{s.label}</p>
              <p className="cp-stat-value">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="cp-tabs">
          {['overview', 'release funds', 'history'].map(t => (
            <button key={t}
              className={`cp-tab-btn ${activeTab === t ? 'cp-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="cp-overview">
            <div className="cp-panel">
              <h2 className="cp-section-title">Active Contracts</h2>
              {contracts.filter(c => c.status === 'active').length === 0 ? (
                <div className="cp-empty">No active contracts yet.</div>
              ) : (
                <div className="cp-contract-list">
                  {contracts.filter(c => c.status === 'active').map(c => {
                    const paid      = paidForContract(c.id);
                    const total     = Number(c.agreedAmount) || 0;
                    const pct       = total ? Math.min((paid / total) * 100, 100) : 0;
                    const remaining = Math.max(total - paid, 0);
                    return (
                      <div key={c.id} className="cp-contract-card">
                        <div className="cp-contract-top">
                          <div className="cp-contract-left">
                            <div className="cp-contract-av">{getInitials(c.freelancerName || 'F')}</div>
                            <div>
                              <p className="cp-contract-title">{c.projectTitle || 'Project'}</p>
                              <p className="cp-contract-who">{c.freelancerName || 'Freelancer'}</p>
                            </div>
                          </div>
                          <div className="cp-contract-right">
                            <span className="cp-amount">${total.toLocaleString()}</span>
                            {remaining > 0 && (
                              <button className="cp-pay-btn" onClick={() => { setPayModal(c); setPayAmount(''); }}>
                                Release Payment
                              </button>
                            )}
                            {remaining === 0 && <span className="cp-paid-chip">Fully Paid</span>}
                          </div>
                        </div>
                        <div className="cp-progress-wrap">
                          <div className="cp-progress-bar">
                            <div className="cp-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="cp-progress-label">
                            ${paid.toLocaleString()} of ${total.toLocaleString()} released
                            {remaining > 0 && ` · $${remaining.toLocaleString()} remaining`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="cp-panel">
              <h2 className="cp-section-title">Recent Payments</h2>
              {payments.length === 0 ? (
                <div className="cp-empty">No payments yet.</div>
              ) : (
                <div className="cp-tx-list">
                  {payments.slice(0, 5).map(p => (
                    <div key={p.id} className="cp-tx-row">
                      <div className="cp-tx-icon">💸</div>
                      <div className="cp-tx-info">
                        <p className="cp-tx-title">{p.projectTitle || 'Payment'}</p>
                        <p className="cp-tx-to">to {p.freelancerName || 'Freelancer'}</p>
                      </div>
                      <div className="cp-tx-meta">
                        <span className="cp-tx-amount">-${(p.amount || 0).toLocaleString()}</span>
                        <span className="cp-tx-date">
                          {p.createdAt?.toDate
                            ? p.createdAt.toDate().toLocaleDateString()
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'release funds' && (
          <div>
            <p style={{ color:'#6b7280', fontSize:'13px', marginBottom:'16px' }}>
              Select an active contract to release a payment to the freelancer.
            </p>
            {contracts.filter(c => c.status === 'active').length === 0 ? (
              <div className="cp-empty">No active contracts available for payment.</div>
            ) : (
              <div className="cp-release-list">
                {contracts.filter(c => c.status === 'active').map(c => {
                  const paid      = paidForContract(c.id);
                  const total     = Number(c.agreedAmount) || 0;
                  const remaining = Math.max(total - paid, 0);
                  const pct       = total ? Math.min((paid / total) * 100, 100) : 0;
                  return (
                    <div key={c.id} className="cp-release-card">
                      <div className="cp-contract-top">
                        <div className="cp-contract-left">
                          <div className="cp-contract-av">{getInitials(c.freelancerName || 'F')}</div>
                          <div>
                            <p className="cp-contract-title">{c.projectTitle || 'Project'}</p>
                            <p className="cp-contract-who">{c.freelancerName} · Agreed: ${total.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="cp-contract-right">
                          {remaining > 0 ? (
                            <button className="cp-pay-btn" onClick={() => { setPayModal(c); setPayAmount(''); }}>
                              💳 Release ${remaining.toLocaleString()}
                            </button>
                          ) : (
                            <span className="cp-paid-chip">✓ Fully Paid</span>
                          )}
                        </div>
                      </div>
                      <div className="cp-progress-wrap" style={{ marginTop:12 }}>
                        <div className="cp-progress-bar">
                          <div className="cp-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="cp-progress-label">
                          ${paid.toLocaleString()} paid · ${remaining.toLocaleString()} remaining
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {payments.length === 0 ? (
              <div className="cp-empty">No payment history yet.</div>
            ) : (
              <div className="cp-history-list">
                <div className="cp-history-header">
                  <span>Project / Freelancer</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span>Amount</span>
                </div>
                {payments.map(p => (
                  <div key={p.id} className="cp-history-row">
                    <div>
                      <p className="cp-tx-title">{p.projectTitle || 'Payment'}</p>
                      <p className="cp-tx-to">to {p.freelancerName || 'Freelancer'}</p>
                    </div>
                    <span className="cp-tx-date">
                      {p.createdAt?.toDate
                        ? p.createdAt.toDate().toLocaleDateString()
                        : 'Just now'}
                    </span>
                    <span className={`cp-status-badge cp-status-badge--${p.status}`}>
                      {p.status}
                    </span>
                    <span className="cp-tx-amount">-${(p.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {payModal && (
        <div className="cp-modal-overlay"
          onMouseDown={e => { if (e.target === e.currentTarget) setPayModal(null); }}>
          <div className="cp-modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 className="cp-modal-title">Release Payment</h2>
              <button onClick={() => setPayModal(null)}
                style={{ background:'none', border:'none', color:'#888', fontSize:'22px', cursor:'pointer' }}>×</button>
            </div>

            <div className="cp-modal-info">
              <div className="cp-contract-av" style={{ width:40, height:40, fontSize:14 }}>
                {getInitials(payModal.freelancerName || 'F')}
              </div>
              <div>
                <p className="cp-modal-project">{payModal.projectTitle || 'Project'}</p>
                <p className="cp-modal-freelancer">to {payModal.freelancerName || 'Freelancer'}</p>
              </div>
            </div>

            <div className="cp-modal-summary">
              <div className="cp-modal-row">
                <span>Agreed Amount</span>
                <strong>${Number(payModal.agreedAmount || 0).toLocaleString()}</strong>
              </div>
              <div className="cp-modal-row">
                <span>Already Released</span>
                <strong>${paidForContract(payModal.id).toLocaleString()}</strong>
              </div>
              <div className="cp-modal-row" style={{ borderTop:'1px solid #1f1f1f', paddingTop:8, marginTop:4 }}>
                <span>Remaining</span>
                <strong style={{ color:'#22c55e' }}>${remainingForContract(payModal).toLocaleString()}</strong>
              </div>
            </div>

            <div className="cp-modal-field">
              <label>Amount to Release ($)</label>
              <input type="number"
                placeholder={`Max $${remainingForContract(payModal)}`}
                value={payAmount}
                max={remainingForContract(payModal)}
                onChange={e => setPayAmount(e.target.value)} />
            </div>

            <p className="cp-modal-note">
              By releasing this payment, you confirm the work has been completed to your satisfaction. This action cannot be undone.
            </p>

            <div className="cp-modal-actions">
              <button className="cp-modal-cancel" onClick={() => setPayModal(null)}>Cancel</button>
              <button className="cp-modal-submit"
                disabled={paying || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > remainingForContract(payModal)}
                onClick={handleRelease}>
                {paying ? 'Processing...' : `Release $${payAmount || '0'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}