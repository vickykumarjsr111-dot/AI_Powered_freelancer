import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login({ onBackToHome }) {
  const [tab, setTab]           = useState('login'); // 'login' | 'register'
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register state
  const [regData, setRegData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: ''
  });

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ── Redirect after login ─────────────────────────────────
  const handleRedirect = async (user) => {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const role = snap.data().role;
      if (role === 'freelancer') navigate('/freelancer/dashboard');
      else if (role === 'client') navigate('/client/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } else {
      setTab('register');
      setError('Account found but no profile. Please register below.');
    }
  };

  // ── Email Login ──────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages(); setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(
        auth, loginData.email, loginData.password
      );
      await handleRedirect(user);
    } catch (err) {
      console.error(err.code, err.message);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Register ─────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!regData.role)   { setError('Please select your role.'); return; }
    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    if (regData.password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth, regData.email, regData.password
      );
      await setDoc(doc(db, 'users', user.uid), {
        uid:       user.uid,
        name:      regData.name,
        email:     regData.email,
        role:      regData.role,
        createdAt: serverTimestamp(),
      });
      if (regData.role === 'freelancer') {
        await setDoc(doc(db, 'freelancers', user.uid), {
          uid:           user.uid,
          name:          regData.name,
          skills:        [],
          portfolioLink: '',
          hourlyRate:    0,
          bio:           '',
          createdAt:     serverTimestamp(),
        });
      }
      if (regData.role === 'freelancer') navigate('/freelancer/dashboard');
      else navigate('/client/dashboard');
    } catch (err) {
      console.error(err.code, err.message);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Google ───────────────────────────────────────────────
  const handleGoogle = async () => {
    clearMessages(); setLoading(true);
    try {
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        await handleRedirect(user);
      } else {
        // New Google user — create profile as freelancer by default
        await setDoc(doc(db, 'users', user.uid), {
          uid:       user.uid,
          name:      user.displayName || 'User',
          email:     user.email,
          role:      'freelancer',
          createdAt: serverTimestamp(),
        });
        navigate('/freelancer/dashboard');
      }
    } catch (err) {
      console.error(err.code, err.message);
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ──────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!loginData.email) {
      setError('Enter your email above first, then click Forgot Password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginData.email);
      setSuccess('Reset email sent! Check your inbox.');
      setError('');
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
  };

  // ── Error messages ───────────────────────────────────────
  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/user-not-found':         return 'No account found. Please register.';
      case 'auth/wrong-password':         return 'Incorrect password. Try again.';
      case 'auth/invalid-credential':     return 'Invalid email or password.';
      case 'auth/email-already-in-use':   return 'Email already registered. Please login.';
      case 'auth/invalid-email':          return 'Please enter a valid email address.';
      case 'auth/weak-password':          return 'Password too weak. Use at least 6 characters.';
      case 'auth/too-many-requests':      return 'Too many attempts. Try again later.';
      case 'auth/popup-closed-by-user':   return 'Google sign-in cancelled.';
      case 'auth/network-request-failed': return 'Network error. Check your connection.';
      default: return `Error (${code}). Check browser console.`;
    }
  };

  return (
    <div className="login-container">
      <button className="back-home-button" onClick={onBackToHome}>
        ← Back to Home
      </button>

      <div className="login-box">

        {/* Logo */}
        <div className="login-header">
          <div className="login-logo">
            <img src="/image.png" alt="Logo" />
            <span className="login-brand">HustlanceAI</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('login'); clearMessages(); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('register'); clearMessages(); }}
          >
            Create Account
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="auth-message auth-message--error">{error}</div>
        )}
        {success && (
          <div className="auth-message auth-message--success">{success}</div>
        )}

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <>
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email" className="form-input"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password" className="form-input"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox-input" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot-link" onClick={handleForgotPassword}>
                  Forgot Password?
                </button>
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="divider"><span>OR</span></div>
            <div className="social-login">
              <button type="button" className="social-button google"
                onClick={handleGoogle} disabled={loading}>
                <span className="social-icon">G</span>
                Continue with Google
              </button>
            </div>
            <div className="signup-link">
              No account?{' '}
              <button
                type="button"
                onClick={() => { setTab('register'); clearMessages(); }}
                style={{ background:'none', border:'none', color:'#fff',
                  cursor:'pointer', fontWeight:600, fontSize:'inherit' }}
              >
                Create one
              </button>
            </div>
          </>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === 'register' && (
          <>
            {/* Role selector */}
            <div className="role-selector">
              {[
                { value:'freelancer', emoji:'💼', label:'Work as Freelancer' },
                { value:'client',     emoji:'🏢', label:'Hire as Client' },
              ].map(r => (
                <button
                  key={r.value} type="button"
                  className={`role-btn ${regData.role === r.value ? 'role-btn--active' : ''}`}
                  onClick={() => setRegData({ ...regData, role: r.value })}
                >
                  <span className="role-emoji">{r.emoji}</span>
                  <span className="role-label">{r.label}</span>
                </button>
              ))}
            </div>

            <form className="login-form" onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text" className="form-input"
                  placeholder="Your full name"
                  value={regData.name}
                  onChange={e => setRegData({ ...regData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email" className="form-input"
                  placeholder="your@email.com"
                  value={regData.email}
                  onChange={e => setRegData({ ...regData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password" className="form-input"
                  placeholder="Min 6 characters"
                  value={regData.password}
                  onChange={e => setRegData({ ...regData, password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password" className="form-input"
                  placeholder="Repeat your password"
                  value={regData.confirmPassword}
                  onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="signup-link" style={{ marginTop:'1.2rem' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setTab('login'); clearMessages(); }}
                style={{ background:'none', border:'none', color:'#fff',
                  cursor:'pointer', fontWeight:600, fontSize:'inherit' }}
              >
                Sign In
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}