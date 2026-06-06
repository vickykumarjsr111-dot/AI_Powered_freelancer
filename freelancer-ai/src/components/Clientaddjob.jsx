import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Clientaddjob.css';

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'JavaScript',
  'AWS', 'Firebase', 'Next.js', 'Tailwind', 'React Native',
  'Redux', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Docker',
];

const EXPERIENCE_LEVELS = ['Entry Level', 'Intermediate', 'Expert'];
const DURATIONS = ['Less than 1 month', '1-3 months', '3-6 months', 'More than 6 months'];

export default function ClientAddJob() {
  const [userData, setUserData]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeNav, setActiveNav] = useState('post-job');
  const [myJobs, setMyJobs]       = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    title:       '',
    description: '',
    budget:      '',
    duration:    '',
    experience:  '',
    skills:      [],
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/login'); return; }
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserData(snap.data());

      // Load this client's posted jobs
      const q = query(collection(db, 'jobs'), where('clientId', '==', user.uid));
      const unsubSnap = onSnapshot(q, (s) => {
        setMyJobs(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      return () => unsubSnap();
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => { await signOut(auth); navigate('/'); };

  const handleNavigation = (id) => {
    setActiveNav(id);
    const routes = {
      dashboard: '/client/dashboard',
      messages:  '/client/messages',
      contracts: '/client/contracts',
      payments:  '/client/payments',
      settings:  '/freelancer/profile',
    };
    if (routes[id]) navigate(routes[id]);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.budget || !form.duration) return;
    const user = auth.currentUser;
    if (!user) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'jobs'), {
        clientId:    user.uid,
        clientName:  userData?.name || 'Client',
        title:       form.title.trim(),
        description: form.description.trim(),
        budget:      Number(form.budget),
        duration:    form.duration,
        experience:  form.experience,
        skills:      form.skills,
        createdAt:   serverTimestamp(),
        status:      'open',
      });

      setForm({ title:'', description:'', budget:'', duration:'', experience:'', skills:[] });
      setSkillInput('');
      setSuccessMsg('Job posted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', color:'#fff', fontSize:'14px' }}>
      Loading...
    </div>
  );

  const name     = userData?.name || 'Client';
  const initials = getInitials(name);
  const role     = userData?.role || 'client';
  const isValid  = form.title.trim() && form.description.trim() && form.budget && form.duration;

  return (
    <div className="caj-shell">

      {/* Sidebar */}
      <aside className="caj-sidebar">
        <div className="caj-brand">
          <div className="caj-brand-icon">
            <img src="/image.png" alt="Logo"
              style={{ width:20, height:20, objectFit:'contain' }} />
          </div>
          <span className="caj-brandname">Hustlance<span>AI</span></span>
        </div>

        <nav className="caj-nav">
          {[
            { id:'dashboard', label:'Dashboard'  },
            { id:'post-job',  label:'Post a Job' },
            { id:'messages',  label:'Messages'   },
            { id:'contracts', label:'Contracts'  },
            { id:'payments',  label:'Payments'   },
            { id:'settings',  label:'Settings'   },
          ].map((item) => (
            <button key={item.id}
              className={`caj-nav-btn ${activeNav === item.id ? 'caj-nav-btn--active' : ''}`}
              onClick={() => handleNavigation(item.id)}>
              <span className="caj-nav-label">{item.label}</span>
            </button>
          ))}
          <div style={{ flex:1 }} />
          <button className="caj-nav-btn" onClick={handleLogout}
            style={{ color:'#ef4444' }}>
            <span className="caj-nav-label">Logout</span>
          </button>
        </nav>

        <div className="caj-profile">
          <div className="caj-profile-av">{initials}</div>
          <div className="caj-profile-info">
            <p className="caj-profile-name">{name}</p>
            <p className="caj-profile-role" style={{ textTransform:'capitalize' }}>{role}</p>
          </div>
          <span className="caj-online-dot" />
        </div>
      </aside>

      {/* Main */}
      <main className="caj-main">
        <div className="caj-header">
          <h1 className="caj-title">Post a Job</h1>
          <p className="caj-sub">Describe your project and find the right freelancer</p>
        </div>

        <div className="caj-layout">

          {/* Form */}
          <div className="caj-form-card">

            {successMsg && (
              <div className="caj-success">{successMsg}</div>
            )}

            {/* Title */}
            <div className="caj-field">
              <label>Job Title <span className="caj-required">*</span></label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Senior React Developer for SaaS Dashboard"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            {/* Description */}
            <div className="caj-field">
              <label>Job Description <span className="caj-required">*</span></label>
              <textarea
                name="description"
                placeholder="Describe the project, responsibilities, and what you're looking for..."
                value={form.description}
                onChange={handleChange}
                rows={6}
              />
            </div>

            {/* Budget + Duration */}
            <div className="caj-row">
              <div className="caj-field">
                <label>Budget ($) <span className="caj-required">*</span></label>
                <input
                  type="number"
                  name="budget"
                  placeholder="e.g. 5000"
                  value={form.budget}
                  onChange={handleChange}
                />
              </div>

              <div className="caj-field">
                <label>Duration <span className="caj-required">*</span></label>
                <select name="duration" value={form.duration} onChange={handleChange}>
                  <option value="">Select duration</option>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Experience Level */}
            <div className="caj-field">
              <label>Experience Level</label>
              <div className="caj-exp-btns">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`caj-exp-btn ${form.experience === level ? 'caj-exp-btn--active' : ''}`}
                    onClick={() => setForm({ ...form, experience: level })}>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="caj-field">
              <label>Required Skills</label>
              <div className="caj-skill-input-row">
                <input
                  type="text"
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                />
                <button type="button" className="caj-add-skill-btn"
                  onClick={() => addSkill(skillInput)}
                  disabled={!skillInput.trim()}>
                  Add
                </button>
              </div>

              {/* Suggestions */}
              <div className="caj-suggestions">
                {SKILL_SUGGESTIONS.filter(
                  (s) => !form.skills.includes(s) &&
                    s.toLowerCase().includes(skillInput.toLowerCase())
                ).slice(0, 6).map((s) => (
                  <button key={s} type="button"
                    className="caj-suggestion-btn"
                    onClick={() => addSkill(s)}>
                    + {s}
                  </button>
                ))}
              </div>

              {/* Selected skills */}
              {form.skills.length > 0 && (
                <div className="caj-selected-skills">
                  {form.skills.map((skill) => (
                    <span key={skill} className="caj-skill-tag">
                      {skill}
                      <button onClick={() => removeSkill(skill)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              className="caj-submit-btn"
              onClick={handleSubmit}
              disabled={submitting || !isValid}>
              {submitting ? 'Posting...' : 'Post Job'}
            </button>
          </div>

          {/* My Posted Jobs */}
          <div className="caj-jobs-panel">
            <h2 className="caj-panel-title">
              My Posted Jobs
              <span className="caj-panel-count">{myJobs.length}</span>
            </h2>

            {myJobs.length === 0 ? (
              <div className="caj-panel-empty">No jobs posted yet.</div>
            ) : (
              <div className="caj-posted-list">
                {myJobs.map((job) => (
                  <div key={job.id} className="caj-posted-card">
                    <div className="caj-posted-top">
                      <p className="caj-posted-title">{job.title}</p>
                      <span className={`caj-posted-status ${job.status === 'open' ? 'caj-status--open' : 'caj-status--closed'}`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="caj-posted-budget">${job.budget} · {job.duration}</p>
                    <div className="caj-posted-tags">
                      {(job.skills || []).slice(0, 3).map((s) => (
                        <span key={s} className="caj-posted-tag">{s}</span>
                      ))}
                    </div>
                    <p className="caj-posted-date">
                      {job.createdAt?.toDate
                        ? job.createdAt.toDate().toLocaleDateString()
                        : 'Just now'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}