import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'JavaScript',
  'AWS', 'Firebase', 'Next.js', 'Tailwind', 'React Native',
  'Redux', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Docker',
];

const EXPERIENCE_OPTIONS = [
  'Less than 1 year', '1-2 years', '3-5 years', '5-10 years', '10+ years'
];

function Field({ label, required, children }) {
  return (
    <div className="pf-field">
      <label className="pf-label">
        {label} {required && <span className="pf-required">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [skillInput, setSkillInput]       = useState('');
  const [activeSection, setActiveSection] = useState('basic');
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [currentUid, setCurrentUid]       = useState(null);

  const [profile, setProfile] = useState({
    name: '', role: '', bio: '', location: '',
    hourlyRate: '', portfolioLink: '', experience: '',
    skills: [], availability: 'available',
    profilePhoto: '', linkedin: '', github: '',
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUid(user.uid);

      try {
        const userSnap       = await getDoc(doc(db, 'users', user.uid));
        const freelancerSnap = await getDoc(doc(db, 'freelancers', user.uid));

        if (userSnap.exists()) {
          const d = userSnap.data();
          setProfile((p) => ({
            ...p,
            name:         d.name         || '',
            role:         d.role         || '',
            profilePhoto: d.profilePhoto || '',
          }));
        }

        if (freelancerSnap.exists()) {
          const d = freelancerSnap.data();
          setProfile((p) => ({
            ...p,
            bio:           d.bio           || '',
            skills:        d.skills        || [],
            hourlyRate:    d.hourlyRate    || '',
            portfolioLink: d.portfolioLink || '',
            experience:    d.experience    || '',
            location:      d.location      || '',
            availability:  d.availability  || 'available',
            linkedin:      d.linkedin      || '',
            github:        d.github        || '',
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [navigate]);

  const set = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !profile.skills.includes(s))
      setProfile((p) => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput('');
  };

  const removeSkill = (skill) =>
    setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('profilePhoto', reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const uid = currentUid || auth.currentUser?.uid;
    if (!uid) { navigate('/login'); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        name:         profile.name,
        role:         profile.role,
        profilePhoto: profile.profilePhoto,
      });
      if (profile.role === 'freelancer') {
        await setDoc(doc(db, 'freelancers', uid), {
          uid,
          name:          profile.name,
          bio:           profile.bio,
          skills:        profile.skills,
          hourlyRate:    Number(profile.hourlyRate),
          portfolioLink: profile.portfolioLink,
          experience:    profile.experience,
          location:      profile.location,
          availability:  profile.availability,
          linkedin:      profile.linkedin,
          github:        profile.github,
        }, { merge: true });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="pf-loading">Loading...</div>
  );

  const initials    = getInitials(profile.name);
  const isFreelancer = profile.role === 'freelancer';

  const SECTIONS = [
    { id: 'basic',  label: 'Basic Info' },
    { id: 'skills', label: 'Skills'     },
    { id: 'links',  label: 'Links'      },
  ];

  const SidebarContent = ({ onNavClick }) => (
    <>
      <div className="pf-avatar-block">
        <div className="pf-avatar">
          {profile.profilePhoto
            ? <img src={profile.profilePhoto} alt="avatar" className="pf-avatar-img" />
            : <span className="pf-avatar-initials">{initials}</span>}
          <label className="pf-avatar-upload">
            +
            <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          </label>
        </div>
        <p className="pf-avatar-name">{profile.name || 'Your Name'}</p>
        <p className="pf-avatar-role">{profile.role}</p>
        {isFreelancer && (
          <div className="pf-availability">
            {['available', 'busy', 'away'].map((s) => (
              <button key={s}
                className={`pf-avail-btn ${profile.availability === s ? 'pf-avail-btn--active' : ''}`}
                onClick={() => set('availability', s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="pf-nav">
        {SECTIONS.map((sec) => (
          <button key={sec.id}
            className={`pf-nav-btn ${activeSection === sec.id ? 'pf-nav-btn--active' : ''}`}
            onClick={() => { setActiveSection(sec.id); if (onNavClick) onNavClick(); }}>
            {sec.label}
          </button>
        ))}
      </nav>

      <div className="pf-role-block">
        <p className="pf-role-label">ACCOUNT TYPE</p>
        <div className="pf-role-btns">
          {['freelancer', 'client'].map((r) => (
            <button key={r}
              className={`pf-role-btn ${profile.role === r ? 'pf-role-btn--active' : ''}`}
              onClick={() => set('role', r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <button className="pf-back-btn"
        onClick={() => navigate(profile.role === 'client' ? '/client/dashboard' : '/freelancer/dashboard')}>
        ← Back to Dashboard
      </button>
    </>
  );

  return (
    <div className="pf-shell">

      {/* ── Mobile top bar ── */}
      <div className="pf-mobile-topbar">
        <button className="pf-mobile-menu-btn" onClick={() => setDrawerOpen(true)}>
          ☰ Menu
        </button>
        <span className="pf-mobile-brand">Hustlance<span>AI</span></span>
        <div className="pf-mobile-av">
          {profile.profilePhoto
            ? <img src={profile.profilePhoto} alt="av" />
            : <span>{initials}</span>}
        </div>
      </div>

      {/* ── Mobile overlay ── */}
      <div
        className={`pf-mobile-overlay ${drawerOpen ? 'pf-mobile-overlay--active' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── Mobile drawer ── */}
      <div className={`pf-mobile-drawer ${drawerOpen ? 'pf-mobile-drawer--open' : ''}`}>
        <button className="pf-mobile-close" onClick={() => setDrawerOpen(false)}>✕</button>
        <SidebarContent onNavClick={() => setDrawerOpen(false)} />
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="pf-sidebar">
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <main className="pf-main">

        <div className="pf-header">
          <h1 className="pf-title">Profile Settings</h1>
          <p className="pf-sub">
            {isFreelancer
              ? 'Keep your profile updated to attract more clients.'
              : 'Manage your client account details.'}
          </p>
        </div>

        {/* Mobile section tabs */}
        <div className="pf-mobile-tabs">
          {SECTIONS.map((sec) => (
            <button key={sec.id}
              className={`pf-mobile-tab ${activeSection === sec.id ? 'pf-mobile-tab--active' : ''}`}
              onClick={() => setActiveSection(sec.id)}>
              {sec.label}
            </button>
          ))}
        </div>

        {/* ── BASIC INFO ── */}
        {activeSection === 'basic' && (
          <div className="pf-section">
            <Field label="Full Name" required>
              <input className="pf-input" value={profile.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Alex Johnson" />
            </Field>

            <Field label="Location">
              <input className="pf-input" value={profile.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. San Francisco, CA" />
            </Field>

            {isFreelancer && (
              <>
                <Field label="Professional Bio">
                  <textarea className="pf-input pf-textarea"
                    value={profile.bio}
                    onChange={(e) => set('bio', e.target.value)}
                    placeholder="Describe your expertise and what makes you stand out..."
                    rows={5} />
                </Field>

                <div className="pf-two-col">
                  <Field label="Hourly Rate ($)">
                    <input className="pf-input" type="number"
                      value={profile.hourlyRate}
                      onChange={(e) => set('hourlyRate', e.target.value)}
                      placeholder="e.g. 50" />
                  </Field>

                  <Field label="Years of Experience">
                    <select className="pf-input pf-select"
                      value={profile.experience}
                      onChange={(e) => set('experience', e.target.value)}>
                      <option value="">Select...</option>
                      {EXPERIENCE_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SKILLS ── */}
        {activeSection === 'skills' && (
          <div className="pf-section">
            {isFreelancer ? (
              <>
                <Field label="Add Skills">
                  <div className="pf-skill-input-row">
                    <input className="pf-input"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault(); addSkill(skillInput);
                        }
                      }}
                      placeholder="Type a skill and press Enter" />
                    <button className="pf-add-btn"
                      disabled={!skillInput.trim()}
                      onClick={() => addSkill(skillInput)}>
                      Add
                    </button>
                  </div>
                </Field>

                <div>
                  <p className="pf-sublabel">SUGGESTIONS</p>
                  <div className="pf-suggestions">
                    {SKILL_SUGGESTIONS
                      .filter((s) => !profile.skills.includes(s) &&
                        s.toLowerCase().includes(skillInput.toLowerCase()))
                      .slice(0, 8)
                      .map((s) => (
                        <button key={s} className="pf-suggestion-btn"
                          onClick={() => addSkill(s)}>
                          + {s}
                        </button>
                      ))}
                  </div>
                </div>

                {profile.skills.length > 0 && (
                  <div>
                    <p className="pf-sublabel">YOUR SKILLS ({profile.skills.length})</p>
                    <div className="pf-selected-skills">
                      {profile.skills.map((skill) => (
                        <span key={skill} className="pf-skill-tag">
                          {skill}
                          <button className="pf-skill-remove"
                            onClick={() => removeSkill(skill)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="pf-empty-note">Skills are only available for freelancer profiles.</p>
            )}
          </div>
        )}

        {/* ── LINKS ── */}
        {activeSection === 'links' && (
          <div className="pf-section">
            {isFreelancer && (
              <Field label="Portfolio Website">
                <input className="pf-input" value={profile.portfolioLink}
                  onChange={(e) => set('portfolioLink', e.target.value)}
                  placeholder="https://yourportfolio.com" />
              </Field>
            )}

            <Field label="LinkedIn">
              <input className="pf-input" value={profile.linkedin}
                onChange={(e) => set('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/yourname" />
            </Field>

            <Field label="GitHub">
              <input className="pf-input" value={profile.github}
                onChange={(e) => set('github', e.target.value)}
                placeholder="https://github.com/yourname" />
            </Field>
          </div>
        )}

        {/* ── Save ── */}
        <div className="pf-save-row">
          <button
            className={`pf-save-btn ${saving ? 'pf-save-btn--saving' : ''}`}
            onClick={handleSave}
            disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="pf-saved-msg">✓ Profile saved</span>}
        </div>
      </main>
    </div>
  );
}