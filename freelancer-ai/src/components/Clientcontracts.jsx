import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './ClientContracts.css';

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function StatusBadge({ status }) {
  const map = {
    active: {
      label: 'Active',
      cls: 'ccbadge--active'
    },
    completed: {
      label: 'Completed',
      cls: 'ccbadge--completed'
    },
    cancelled: {
      label: 'Cancelled',
      cls: 'ccbadge--cancelled'
    }
  };

  const s = map[status] || map.active;

  return (
    <span className={`cc-status-badge ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function ClientContracts() {
  const [userData, setUserData] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('contracts');
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      const snap = await getDoc(doc(db, 'users', user.uid));

      if (snap.exists()) {
        setUserData(snap.data());
      }

      const q = query(collection(db, 'contracts'));

      const unsubSnap = onSnapshot(q, (snapshot) => {
        setContracts(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }))
        );
        setLoading(false);
      });

      return () => unsubSnap();
    });

    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleNavigation = (id) => {
    setActiveNav(id);

    const routes = {
      dashboard: '/client/dashboard',
      messages: '/client/messages',
      contracts: '/client/contracts',
      settings: '/client/profile'
    };

    if (routes[id]) {
      navigate(routes[id]);
    }
  };

  const updateStatus = async (contractId, status) => {
    setUpdating(contractId);

    try {
      await updateDoc(doc(db, 'contracts', contractId), {
        status
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const filtered =
    filter === 'all'
      ? contracts
      : contracts.filter((c) => c.status === filter);

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

  const name = userData?.name || 'Client';
  const initials = getInitials(name);
  const role = userData?.role || 'client';

  const counts = {
    all: contracts.length,
    active: contracts.filter((c) => c.status === 'active').length,
    completed: contracts.filter((c) => c.status === 'completed').length,
    cancelled: contracts.filter((c) => c.status === 'cancelled').length
  };

  return (
    <div className="cc-shell">
      <aside className="cc-sidebar">
        <div className="cc-brand">
          <div className="cc-brand-icon">
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
          <span className="cc-brandname">
            Hustlance<span>AI</span>
          </span>
        </div>

        <nav className="cc-nav">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'messages', label: 'Messages' },
            { id: 'contracts', label: 'Contracts', badge: counts.active },
            { id: 'settings', label: 'Settings' }
          ].map((item) => (
            <button
              key={item.id}
              className={`cc-nav-btn ${
                activeNav === item.id ? 'cc-nav-btn--active' : ''
              }`}
              onClick={() => handleNavigation(item.id)}
            >
              <span className="cc-nav-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="cc-nav-badge">{item.badge}</span>
              )}
            </button>
          ))}

          <button
            className="cc-nav-btn"
            onClick={handleLogout}
            style={{
              marginTop: 'auto',
              color: '#ef4444'
            }}
          >
            <span className="cc-nav-label">Logout</span>
          </button>
        </nav>

        <div className="cc-profile">
          <div className="cc-profile-av">{initials}</div>

          <div className="cc-profile-info">
            <p className="cc-profile-name">{name}</p>
            <p
              className="cc-profile-role"
              style={{ textTransform: 'capitalize' }}
            >
              {role}
            </p>
          </div>

          <span className="cc-online-dot" />
        </div>
      </aside>

      <main className="cc-main">
        <div className="cc-header">
          <div>
            <h1 className="cc-title">Contracts</h1>
            <p className="cc-sub">
              Manage your active freelancer contracts
            </p>
          </div>
        </div>

        <div className="cc-stats">
          {[
            { label: 'Total', value: counts.all },
            { label: 'Active', value: counts.active },
            { label: 'Completed', value: counts.completed },
            { label: 'Cancelled', value: counts.cancelled }
          ].map((s) => (
            <div key={s.label} className="cc-stat-card">
              <p className="cc-stat-label">{s.label}</p>
              <p className="cc-stat-value">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="cc-filters">
          {['all', 'active', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              className={`cc-filter-btn ${
                filter === f ? 'cc-filter-btn--active' : ''
              }`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="cc-filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="cc-empty">
            No {filter === 'all' ? '' : filter} contracts yet.
          </div>
        ) : (
          <div className="cc-list">
            {filtered.map((contract) => (
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
                    <span className="cc-bid">
                      ${contract.agreedAmount || 0}
                    </span>
                  </div>
                </div>

                <p className="cc-cover-letter">
                  Deadline:{' '}
                  {contract.deadline || 'Not specified'}
                </p>

                <div className="cc-card-footer">
                  {contract.status === 'active' && (
                    <div className="cc-actions">
                      <button
                        className="cc-btn-cancel"
                        disabled={updating === contract.id}
                        onClick={() =>
                          updateStatus(contract.id, 'cancelled')
                        }
                      >
                        Cancel
                      </button>

                      <button
                        className="cc-btn-complete"
                        disabled={updating === contract.id}
                        onClick={() =>
                          updateStatus(contract.id, 'completed')
                        }
                      >
                        {updating === contract.id
                          ? 'Saving...'
                          : 'Complete'}
                      </button>

                      <button
                        className="cc-btn-message"
                        onClick={() =>
                          navigate(`/chat/${contract.chatId}`)
                        }
                      >
                        Message
                      </button>
                    </div>
                  )}

                  {contract.status !== 'active' && (
                    <button
                      className="cc-btn-reset"
                      onClick={() =>
                        updateStatus(contract.id, 'active')
                      }
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}