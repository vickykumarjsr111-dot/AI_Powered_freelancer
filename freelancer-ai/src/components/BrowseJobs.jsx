import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './BrowseJobs.css';

const JOBS = [
  {
    id: 1,
    title: 'Senior React Developer',
    company: 'TechFlow Inc.',
    budget: '$4,500',
    duration: '3 months',
    match: 97,
    skills: ['React', 'Node.js', 'TypeScript'],
    proposals: 4,
    posted: '2h ago',
    description:
      'Build and maintain a modern SaaS dashboard with React, reusable UI architecture, and scalable frontend systems.',
  },
  {
    id: 2,
    title: 'Full Stack Engineer',
    company: 'PayBridge',
    budget: '$6,000',
    duration: '4 months',
    match: 91,
    skills: ['React', 'Python', 'AWS'],
    proposals: 7,
    posted: '5h ago',
    description:
      'Work on fintech APIs, frontend dashboards, and cloud deployment infrastructure.',
  },
  {
    id: 3,
    title: 'Frontend Architect',
    company: 'ShopNest',
    budget: '$3,200',
    duration: '2 months',
    match: 85,
    skills: ['Next.js', 'Tailwind'],
    proposals: 11,
    posted: '1d ago',
    description:
      'Lead UI architecture for a scalable e-commerce platform and optimize frontend performance.',
  },
  {
    id: 4,
    title: 'React Native Developer',
    company: 'Wanderly',
    budget: '$5,800',
    duration: '6 months',
    match: 79,
    skills: ['React Native', 'Redux'],
    proposals: 9,
    posted: '2d ago',
    description:
      'Revamp an existing travel mobile app with better UX, navigation, and performance.',
  },
];

function getInitials(name = '') {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function BrowseJobs() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));

        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const toggleSave = (id) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredJobs = JOBS.filter((job) => {
    const searchMatch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());

    const skillMatch =
      selectedSkill === 'All' || job.skills.includes(selectedSkill);

    return searchMatch && skillMatch;
  });

  if (loading) {
    return <div className="browse-loading">Loading...</div>;
  }

  const name = userData?.name || 'User';
  const initials = getInitials(name);

  return (
    <div className="browse-shell">
      {/* Sidebar */}
      <aside className="browse-sidebar">
        <div className="browse-brand">
          <div className="brand-icon">
            <img src="/image.png" alt="Logo" />
          </div>
          <span className="brand-name">
            Hustlance<span>AI</span>
          </span>
        </div>

        <nav className="browse-nav">
          <button className="nav-btn" onClick={() => navigate('/freelancer/dashboard')}>
            Dashboard
          </button>

          <button className="nav-btn nav-btn--active">
            Browse Jobs
          </button>

          <button className="nav-btn">
            Proposals
          </button>

          <button className="nav-btn">
            Messages
          </button>

          <button className="nav-btn">
            Earnings
          </button>

          <button
            className="nav-btn logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>

        <div className="browse-profile">
          <div className="profile-avatar">{initials}</div>
          <div>
            <p className="profile-name">{name}</p>
            <p className="profile-role">Freelancer</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="browse-main">
        <div className="browse-header">
        <div>
          <h1>Browse Jobs</h1>
          <p>AI-matched opportunities tailored for your skills</p>
        </div>
      </div>

        {/* Search */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search jobs, companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="skill-filters">
            {['All', 'React', 'Node.js', 'Python', 'AWS'].map((skill) => (
              <button
                key={skill}
                className={selectedSkill === skill ? 'skill-active' : ''}
                onClick={() => setSelectedSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs */}
        <div className="browse-content">
          <section className="jobs-list">
            {filteredJobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-top">
                  <div>
                    <h3>{job.title}</h3>
                    <p>{job.company}</p>
                  </div>

                  <div className="job-match">
                    {job.match}% Match
                  </div>
                </div>

                <div className="job-meta">
                  <span>{job.budget}</span>
                  <span>{job.duration}</span>
                  <span>{job.proposals} proposals</span>
                  <span>{job.posted}</span>
                </div>

                <div className="job-tags">
                  {job.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>

                <div className="job-actions">
                  <button onClick={() => toggleSave(job.id)}>
                    {savedJobs.has(job.id) ? '♥ Saved' : '♡ Save'}
                  </button>

                  <button onClick={() => setSelectedJob(job)}>
                    Details
                  </button>

                  <button className="apply-btn">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* Right Panel */}
          <aside className="browse-right">
            <div className="insight-card">
              <span>AI Insight</span>
              <p>
                Jobs requiring <strong>React + TypeScript</strong> have
                38% less competition this week.
              </p>
            </div>

            <div className="insight-card">
              <h3>Recommended Skills</h3>
              <div className="recommended-skills">
                <span>Next.js</span>
                <span>Firebase</span>
                <span>GraphQL</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Modal */}
      {selectedJob && (
        <div
          className="job-modal-overlay"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="job-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedJob.title}</h2>
            <p className="modal-company">{selectedJob.company}</p>

            <p>{selectedJob.description}</p>

            <div className="modal-tags">
              {selectedJob.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>

            <button
              className="close-modal"
              onClick={() => setSelectedJob(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}