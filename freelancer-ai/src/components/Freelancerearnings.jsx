import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc, getDoc, collection, query, where,
  onSnapshot, addDoc, serverTimestamp, orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './FreelancerEarnings.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function FreelancerEarnings() {
  const [userData, setUserData]           = useState(null);
  const [contracts, setContracts]         = useState([]);
  const [payments, setPayments]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeNav, setActiveNav]         = useState('earnings');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing]     = useState(false);
  const [activeTab, setActiveTab]         = useState('overview');

  const navigate = useNavigate();

  useEffect(() => {
    let unsubContracts = null;
    let unsubPayments  = null;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/login'); return; }

      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserData(snap.data());

      // Live contracts for this freelancer
      const contractsQ = query(
        collection(db, 'contracts'),
        where('freelancerId', '==', user.uid)
      );
      unsubContracts = onSnapshot(contractsQ, (snapshot) => {
        setContracts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      // Live payments for this freelancer
      const paymentsQ = query(
        collection(db, 'payments'),
        where('freelancerId', '==', user.uid),
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
    setMobileMenuOpen(false);
    const routes = {
      dashboard: '/freelancer/dashboard',
      jobs:      '/freelancer/jobs',
      proposals: '/freelancer/proposals',
      messages:  '/freelancer/messages',
      earnings:  '/freelancer/earnings',
      settings:  '/freelancer/profile',
    };
    if (routes[id]) navigate(routes[id]);
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0 || amt > availableBalance) return;
    setWithdrawing(true);
    try {
      await addDoc(collection(db, 'withdrawals'), {
        freelancerId:   auth.currentUser.uid,
        freelancerName: userData?.name || 'Freelancer',
        amount:         amt,
        status:         'pending',
        createdAt:      serverTimestamp(),
      });
      setWithdrawModal(false);
      setWithdrawAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', color:'#fff', fontSize:'14px' }}>Loading...</div>
  );

  const name     = userData?.name || 'User';
  const initials = getInitials(name);
  const role     = userData?.role || 'freelancer';

  // Derive totals from completed contracts + payments
  const totalEarned      = payments.filter(p => p.status === 'released').reduce((s, p) => s + (p.amount || 0), 0);
  const pendingEarnings  = payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
  const availableBalance = payments.filter(p => p.status === 'released' && !p.withdrawn).reduce((s, p) => s + (p.amount || 0), 0);
  const activeContracts  = contracts.filter(c => c.status === 'active').length;

  // Build monthly chart data from payments
  const monthlyMap = {};
  payments.forEach(p => {
    if (!p.createdAt?.toDate) return;
    const d   = p.createdAt.toDate();
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + (p.amount || 0);
  });
  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d   = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    return { month: MONTHS[d.getMonth()], amount: monthlyMap[key] || 0 };
  });
  const maxBar = Math.max(...chartData.map(d => d.amount), 1);

  return (
    <>
      {!mobileMenuOpen && createPortal(
        <button className="fe-mobile-btn" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={22} />
        </button>,
        document.body
      )}

      <div className="fe-shell">
        {/* Sidebar */}
        <aside className={`fe-sidebar ${mobileMenuOpen ? 'fe-sidebar--open' : ''}`}>
          <div className="fe-brand">
            <div className="fe-brand-icon">
              <img src="/image.png" alt="Logo" style={{ width:20, height:20, objectFit:'contain' }} />
            </div>
            <span className="fe-brandname">Hustlance<span>AI</span></span>
          </div>

          <nav className="fe-nav">
            {[
              { id:'dashboard', label:'Dashboard'  },
              { id:'jobs',      label:'Browse Jobs' },
              { id:'proposals', label:'Proposals'  },
              { id:'messages',  label:'Messages'   },
              { id:'earnings',  label:'Earnings'   },
              { id:'settings',  label:'Settings'   },
            ].map((item) => (
              <button key={item.id}
                className={`fe-nav-btn ${activeNav === item.id ? 'fe-nav-btn--active' : ''}`}
                onClick={() => handleNavigation(item.id)}>
                <span className="fe-nav-label">{item.label}</span>
              </button>
            ))}
            <button className="fe-nav-btn" onClick={handleLogout}
              style={{ marginTop:'auto', color:'#ef4444' }}>
              <span className="fe-nav-label">Logout</span>
            </button>
          </nav>

          <div className="fe-profile">
            <div className="fe-profile-av">{initials}</div>
            <div className="fe-profile-info">
              <p className="fe-profile-name">{name}</p>
              <p className="fe-profile-role" style={{ textTransform:'capitalize' }}>{role}</p>
            </div>
            <span className="fe-online-dot" />
          </div>
        </aside>

        <div className={`fe-overlay ${mobileMenuOpen ? 'fe-overlay--active' : ''}`}
          onClick={() => setMobileMenuOpen(false)} />

        {/* Main */}
        <main className="fe-main">
          <div className="fe-header">
            <div>
              <h1 className="fe-title">Earnings</h1>
              <p className="fe-sub">Track your income and withdraw funds</p>
            </div>
            <button className="fe-withdraw-btn" onClick={() => setWithdrawModal(true)}
              disabled={availableBalance <= 0}>
              Withdraw Funds
            </button>
          </div>

          {/* Stats */}
          <div className="fe-stats">
            {[
              { label: 'Total Earned',      value: `$${totalEarned.toLocaleString()}`,     color: '#22c55e' },
              { label: 'Available Balance', value: `$${availableBalance.toLocaleString()}`, color: '#3b82f6' },
              { label: 'Pending',           value: `$${pendingEarnings.toLocaleString()}`,  color: '#f59e0b' },
              { label: 'Active Contracts',  value: activeContracts,                          color: '#a78bfa' },
            ].map((s) => (
              <div key={s.label} className="fe-stat-card">
                <p className="fe-stat-label">{s.label}</p>
                <p className="fe-stat-value" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="fe-tabs">
            {['overview', 'transactions', 'contracts'].map(t => (
              <button key={t}
                className={`fe-tab-btn ${activeTab === t ? 'fe-tab-btn--active' : ''}`}
                onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="fe-overview">
              <div className="fe-chart-card">
                <h2 className="fe-section-title">Earnings (Last 6 Months)</h2>
                <div className="fe-chart">
                  {chartData.map((d) => (
                    <div key={d.month} className="fe-bar-group">
                      <div className="fe-bar-wrap">
                        <div className="fe-bar"
                          style={{ height: `${(d.amount / maxBar) * 100}%` }}>
                          {d.amount > 0 && (
                            <span className="fe-bar-tip">${d.amount.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <span className="fe-bar-label">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fe-contracts-summary">
                <h2 className="fe-section-title">Contract Summary</h2>
                {contracts.length === 0 ? (
                  <div className="fe-empty">No contracts yet.</div>
                ) : (
                  <div className="fe-contract-list">
                    {contracts.slice(0, 5).map(c => (
                      <div key={c.id} className="fe-contract-row">
                        <div className="fe-contract-left">
                          <div className="fe-contract-av">{getInitials(c.clientName || 'C')}</div>
                          <div>
                            <p className="fe-contract-title">{c.projectTitle || 'Project'}</p>
                            <p className="fe-contract-client">{c.clientName || 'Client'}</p>
                          </div>
                        </div>
                        <div className="fe-contract-right">
                          <span className={`fe-contract-badge fe-contract-badge--${c.status}`}>
                            {c.status}
                          </span>
                          <span className="fe-contract-amount">${c.agreedAmount || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="fe-transactions">
              {payments.length === 0 ? (
                <div className="fe-empty">No transactions yet. Payments will appear here once clients release funds.</div>
              ) : (
                <div className="fe-tx-list">
                  <div className="fe-tx-header">
                    <span>Description</span>
                    <span>Date</span>
                    <span>Status</span>
                    <span>Amount</span>
                  </div>
                  {payments.map(p => (
                    <div key={p.id} className="fe-tx-row">
                      <div>
                        <p className="fe-tx-title">{p.projectTitle || 'Payment'}</p>
                        <p className="fe-tx-from">from {p.clientName || 'Client'}</p>
                      </div>
                      <span className="fe-tx-date">
                        {p.createdAt?.toDate
                          ? p.createdAt.toDate().toLocaleDateString()
                          : 'Just now'}
                      </span>
                      <span className={`fe-tx-status fe-tx-status--${p.status}`}>
                        {p.status}
                      </span>
                      <span className="fe-tx-amount">+${(p.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <div className="fe-contracts-tab">
              {contracts.length === 0 ? (
                <div className="fe-empty">No contracts yet.</div>
              ) : (
                <div className="fe-contract-list">
                  {contracts.map(c => {
                    const contractPayments = payments.filter(p => p.contractId === c.id);
                    const paid = contractPayments.filter(p => p.status === 'released').reduce((s, p) => s + (p.amount || 0), 0);
                    const pct  = c.agreedAmount ? Math.min((paid / c.agreedAmount) * 100, 100) : 0;
                    return (
                      <div key={c.id} className="fe-contract-card">
                        <div className="fe-contract-card-top">
                          <div className="fe-contract-left">
                            <div className="fe-contract-av">{getInitials(c.clientName || 'C')}</div>
                            <div>
                              <p className="fe-contract-title">{c.projectTitle || 'Project'}</p>
                              <p className="fe-contract-client">{c.clientName || 'Client'}</p>
                            </div>
                          </div>
                          <div className="fe-contract-right">
                            <span className={`fe-contract-badge fe-contract-badge--${c.status}`}>
                              {c.status}
                            </span>
                            <span className="fe-contract-amount">${c.agreedAmount || 0}</span>
                          </div>
                        </div>
                        <div className="fe-progress-wrap">
                          <div className="fe-progress-bar">
                            <div className="fe-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="fe-progress-label">${paid} / ${c.agreedAmount || 0} received</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Withdraw Modal */}
      {withdrawModal && (
        <div className="fe-modal-overlay"
          onMouseDown={e => { if (e.target === e.currentTarget) setWithdrawModal(false); }}>
          <div className="fe-modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 className="fe-modal-title">Withdraw Funds</h2>
              <button onClick={() => setWithdrawModal(false)}
                style={{ background:'none', border:'none', color:'#888', fontSize:'22px', cursor:'pointer' }}>×</button>
            </div>
            <p className="fe-modal-balance">Available: <strong>${availableBalance.toLocaleString()}</strong></p>
            <div className="fe-modal-field">
              <label>Amount ($)</label>
              <input type="number" placeholder={`Max $${availableBalance}`}
                value={withdrawAmount}
                max={availableBalance}
                onChange={e => setWithdrawAmount(e.target.value)} />
            </div>
            <p className="fe-modal-note">
              Withdrawals are processed within 2–3 business days to your registered bank account.
            </p>
            <div className="fe-modal-actions">
              <button className="fe-modal-cancel" onClick={() => setWithdrawModal(false)}>Cancel</button>
              <button className="fe-modal-submit"
                disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > availableBalance}
                onClick={handleWithdraw}>
                {withdrawing ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}