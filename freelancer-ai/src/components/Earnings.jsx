import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import './Earnings.css';

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Earnings() {

  const navigate = useNavigate();

  const location = useLocation();

  const [userData, setUserData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // FIXED ACTIVE NAV
  const [activeNav, setActiveNav] =
    useState('earnings');

  // AUTO ACTIVE NAV BASED ON URL
  useEffect(() => {

    if (
      location.pathname.includes('/dashboard')
    ) {
      setActiveNav('dashboard');
    }

    else if (
      location.pathname.includes('/jobs')
    ) {
      setActiveNav('jobs');
    }

    else if (
      location.pathname.includes('/proposals')
    ) {
      setActiveNav('proposals');
    }

    else if (
      location.pathname.includes('/messages')
    ) {
      setActiveNav('messages');
    }

    else if (
      location.pathname.includes('/earnings')
    ) {
      setActiveNav('earnings');
    }

    else if (
      location.pathname.includes('/profile')
    ) {
      setActiveNav('settings');
    }

  }, [location.pathname]);

  useEffect(() => {

    const unsub = onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {
          navigate('/login');
          return;
        }

        try {

          const snap = await getDoc(
            doc(db, 'users', user.uid)
          );

          if (snap.exists()) {
            setUserData(snap.data());
          }

        } catch (err) {

          console.error(err);

        } finally {

          setLoading(false);

        }
      }
    );

    return () => unsub();

  }, [navigate]);

  const handleLogout = async () => {

    await signOut(auth);

    navigate('/');

  };

  // PERFECT NAVIGATION
  const handleNavigation = (id) => {

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

  if (loading) {

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          color: '#fff',
        }}
      >
        Loading...
      </div>
    );
  }

  const transactions = [
    {
      client: 'NovaSpark',
      amount: '$1200',
      status: 'Paid',
      date: '2 May 2026',
    },

    {
      client: 'CloudBuild',
      amount: '$850',
      status: 'Pending',
      date: '28 Apr 2026',
    },

    {
      client: 'TechFlow Inc.',
      amount: '$430',
      status: 'Paid',
      date: '21 Apr 2026',
    },
  ];

  const name = userData?.name || 'User';

  const initials = getInitials(name);

  const role = userData?.role || 'freelancer';

  return (
    <>

      {!mobileMenuOpen &&
        createPortal(
          <button
            className="fp-mobile-menu-btn"
            onClick={() =>
              setMobileMenuOpen(true)
            }
            aria-label="Toggle menu"
            type="button"
          >
            <Menu size={22} />
          </button>,
          document.body
        )}

      <div className="fp-shell">

        {/* SIDEBAR */}

        <aside
          className={`fp-sidebar ${
            mobileMenuOpen
              ? 'fp-sidebar--open'
              : ''
          }`}
        >

          <div className="fp-brand">

            <div className="fp-brand-icon">

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

            <span className="fp-brandname">
              Hustlance<span>AI</span>
            </span>

          </div>

          {/* NAVIGATION */}

          <nav className="fp-nav">

            {[
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
                type="button"
                key={item.id}
                className={`fp-nav-btn ${
                  activeNav === item.id
                    ? 'fp-nav-btn--active'
                    : ''
                }`}
                onClick={() =>
                  handleNavigation(item.id)
                }
              >

                <span className="fp-nav-label">
                  {item.label}
                </span>

              </button>

            ))}

            <button
              type="button"
              className="fp-nav-btn"
              onClick={handleLogout}
              style={{
                marginTop: 'auto',
                color: '#ef4444',
              }}
            >

              <span className="fp-nav-label">
                Logout
              </span>

            </button>

          </nav>

          {/* PROFILE */}

          <div className="fp-profile">

            <div className="fp-profile-av">
              {initials}
            </div>

            <div className="fp-profile-info">

              <p className="fp-profile-name">
                {name}
              </p>

              <p
                className="fp-profile-role"
                style={{
                  textTransform:
                    'capitalize',
                }}
              >
                {role}
              </p>

            </div>

            <span className="fp-online-dot" />

          </div>

        </aside>

        {/* OVERLAY */}

        <div
          className={`fp-overlay ${
            mobileMenuOpen
              ? 'fp-overlay--active'
              : ''
          }`}
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />

        {/* MAIN */}

        <main className="fp-main">

          <div className="earnings-page">

            {/* HEADER */}

            <div className="earnings-header">

              <h1>Earnings</h1>

              <button className="withdraw-btn">
                Withdraw Funds
              </button>

            </div>

            {/* STATS */}

            <div className="earnings-stats">

              <div className="earning-card">
                <p>Total Earnings</p>
                <h2>$12,430</h2>
              </div>

              <div className="earning-card">
                <p>This Month</p>
                <h2>$3,200</h2>
              </div>

              <div className="earning-card">
                <p>Pending Payments</p>
                <h2>$850</h2>
              </div>

            </div>

            {/* CHART */}

            <div className="earnings-chart-card">

              <div className="chart-header">
                <h3>Earnings Overview</h3>
              </div>

              <div className="fake-chart">

                <div className="bar bar1"></div>
                <div className="bar bar2"></div>
                <div className="bar bar3"></div>
                <div className="bar bar4"></div>
                <div className="bar bar5"></div>
                <div className="bar bar6"></div>

              </div>

            </div>

            {/* TRANSACTIONS */}

            <div className="transactions-card">

              <h3>Recent Transactions</h3>

              <div className="transactions-list">

                {transactions.map(
                  (item, index) => (

                    <div
                      className="transaction-item"
                      key={index}
                    >

                      <div>

                        <h4>{item.client}</h4>

                        <p>{item.date}</p>

                      </div>

                      <div className="transaction-right">

                        <span className="amount">
                          {item.amount}
                        </span>

                        <span
                          className={`status ${
                            item.status ===
                            'Paid'
                              ? 'paid'
                              : 'pending'
                          }`}
                        >
                          {item.status}
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </main>

      </div>

    </>
  );
}