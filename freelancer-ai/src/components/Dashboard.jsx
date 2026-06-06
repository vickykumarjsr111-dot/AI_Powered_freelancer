import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, updateDoc, collection, onSnapshot,
  orderBy, query, where, increment,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const CIRC = 2 * Math.PI * 14;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function serializeJob(job) {
  const { createdAt, ...rest } = job;
  return rest;
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

// ── Profile strength ──────────────────────────────────────────────────────────
// userData   = users/{uid}      → name, profilePhoto
// freelancer = freelancers/{uid}→ bio, skills, hourlyRate, portfolioLink, location
const PROFILE_CHECKS = [
  { key: "name",          label: "Full name",      weight: 15, src: "user"       },
  { key: "bio",           label: "Bio",             weight: 20, src: "freelancer" },
  { key: "skills",        label: "Skills",          weight: 20, src: "freelancer", isArray: true },
  { key: "portfolioLink", label: "Portfolio link",  weight: 20, src: "freelancer" },
  { key: "hourlyRate",    label: "Hourly rate",     weight: 10, src: "freelancer" },
  { key: "location",      label: "Location",        weight: 10, src: "freelancer" },
  { key: "profilePhoto",  label: "Profile photo",   weight: 5,  src: "user"       },
];

function calcProfileStrength(userData, freelancerData) {
  if (!userData) return { score: 0, missing: [] };
  let score = 0;
  const missing = [];
  for (const check of PROFILE_CHECKS) {
    const source = check.src === "freelancer" ? freelancerData : userData;
    const val    = source?.[check.key];
    const filled = check.isArray
      ? Array.isArray(val) && val.length > 0
      : !!val && String(val).trim() !== "";
    if (filled) {
      score += check.weight;
    } else {
      missing.push(check.label);
    }
  }
  return { score, missing };
}

// ── Earned this month ─────────────────────────────────────────────────────────
// Source of truth: payments collection, status === "released"
function calcEarnedThisMonth(payments) {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();

  let total = 0;
  for (const p of payments) {
    if (p.status !== "released") continue;
    const ts = p.createdAt?.toDate ? p.createdAt.toDate() : p.createdAt ? new Date(p.createdAt) : null;
    if (!ts) continue;
    if (ts.getFullYear() !== year || ts.getMonth() !== month) continue;
    const amt = parseFloat(p.amount || 0);
    if (!isNaN(amt)) total += amt;
  }

  if (total >= 1000) return `$${(total / 1000).toFixed(1)}k`;
  return total > 0 ? `$${total.toLocaleString()}` : "$0";
}

export default function Dashboard() {
  const [userData, setUserData]         = useState(null);
  const [uid, setUid]                   = useState(null);
  const [freelancerData, setFreelancerData] = useState(null);
  const [payments, setPayments]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeNav, setActiveNav]       = useState("dashboard");
  const [saved, setSaved]               = useState(new Set());
  const [jobs, setJobs]                 = useState([]);
  const [proposals, setProposals]       = useState([]);
  const [contracts, setContracts]       = useState([]);
  const [messages, setMessages]         = useState([]);
  const [activity, setActivity]         = useState([]);
  const [aiInsight, setAiInsight]       = useState("Analyzing market trends...");
  const [insightLoading, setInsightLoading] = useState(true);
  const [selectedJob, setSelectedJob]   = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
  const profileRef = useRef(null);
  const navigate   = useNavigate();

  // ── Auth: sets uid ONCE → all other listeners depend on uid, not userData ───
  useEffect(() => {
    let unsubUser     = null;
    let unsubPayments = null;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate("/login"); return; }
      try {
        // Live listener on users doc — keeps profileViews and name in sync
        // without causing proposals/contracts/messages to re-subscribe
        unsubUser = onSnapshot(doc(db, "users", user.uid), (liveSnap) => {
          if (liveSnap.exists()) {
            setUserData({ uid: user.uid, ...liveSnap.data() });
          } else {
            navigate("/login");
          }
        });

        // uid is set ONCE — this is what proposals/contracts/messages depend on
        setUid(user.uid);

        // Freelancer profile for profile strength (one-time read is fine)
        const fSnap = await getDoc(doc(db, "freelancers", user.uid));
        if (fSnap.exists()) setFreelancerData(fSnap.data());

        // Live payments listener for "Earned This Month"
        const paymentsQ = query(
          collection(db, "payments"),
          where("freelancerId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        unsubPayments = onSnapshot(paymentsQ, (snap) => {
          setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsub();
      if (unsubUser)     unsubUser();
      if (unsubPayments) unsubPayments();
    };
  }, [navigate]);

  // ── Jobs ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "jobs"), where("open", "==", true), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, []);

  // ── Proposals ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "proposals"),
      where("freelancerId", "==", uid),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setProposals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  // ── Contracts ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "contracts"),
      where("freelancerId", "==", uid),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setContracts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  // ── Messages ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "chats"),
      where("freelancerId", "==", uid),
      orderBy("lastAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  // ── Activity feed ───────────────────────────────────────────────────────────
  useEffect(() => {
    const items = [];

    proposals.forEach((p) => {
      items.push({
        id:        `proposal-${p.id}`,
        type:      p.status === "accepted" ? "success" : "pending",
        text:      `Proposal sent to ${p.clientName || "Client"} for "${p.jobTitle || "a job"}"`,
        timestamp: p.createdAt,
      });
    });

    contracts.forEach((c) => {
      items.push({
        id:        `contract-${c.id}`,
        type:      "success",
        text:      `Contract started with ${c.clientName || "Client"}`,
        timestamp: c.createdAt,
      });
    });

    messages.forEach((m) => {
      if (m.lastMessage) {
        items.push({
          id:        `msg-${m.id}`,
          type:      "new",
          text:      `Message from ${m.clientName || "Client"}: "${m.lastMessage.slice(0, 40)}${m.lastMessage.length > 40 ? "..." : ""}"`,
          timestamp: m.lastAt,
        });
      }
    });

    items.sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : a.timestamp || 0;
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : b.timestamp || 0;
      return bTime - aTime;
    });

    setActivity(items.slice(0, 8));
  }, [proposals, contracts, messages]);

  // ── Groq AI market insight ──────────────────────────────────────────────────
  useEffect(() => {
    if (jobs.length === 0) return;
    const fetchInsight = async () => {
      setInsightLoading(true);
      try {
        const skillList = jobs.flatMap((j) => j.skills || []);
        const skillCounts = skillList.reduce((acc, s) => {
          acc[s] = (acc[s] || 0) + 1; return acc;
        }, {});
        const topSkills = Object.entries(skillCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([s]) => s)
          .join(", ");

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_GROQ_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            max_tokens: 60,
            messages: [
              {
                role: "system",
                content: "You are a freelancing market analyst. Give ONE short actionable insight (max 2 sentences) for a freelancer based on current job data. Be specific and encouraging.",
              },
              {
                role: "user",
                content: `There are ${jobs.length} open jobs. Top skills in demand: ${topSkills}. Give a quick market insight.`,
              },
            ],
          }),
        });

        const data = await response.json();
        const insight = data.choices?.[0]?.message?.content;
        if (insight) setAiInsight(insight);
      } catch (err) {
        console.error("Groq insight error:", err);
        setAiInsight("Market is active! Focus on your top skills to stand out.");
      } finally {
        setInsightLoading(false);
      }
    };

    fetchInsight();
  }, [jobs]);

  // ── Click-outside for profile menu ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => { await signOut(auth); navigate("/"); };

  const toggleSave = (id) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleNavigation = (itemId) => {
    setActiveNav(itemId);
    setMobileMenuOpen(false);
    switch (itemId) {
      case "dashboard": navigate("/freelancer/dashboard"); break;
      case "jobs":      navigate("/freelancer/jobs");      break;
      case "proposals": navigate("/freelancer/proposals"); break;
      case "settings":  navigate("/freelancer/profile");   break;
      case "messages":  navigate("/freelancer/messages");  break;
      case "earnings":  navigate("/freelancer/earnings");  break;
      default: break;
    }
  };

  const handleApply = (job) => {
    navigate("/freelancer/proposals", { state: { applyJob: serializeJob(job) } });
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", color:"#fff", fontSize:"14px" }}>
      Loading...
    </div>
  );

  const name      = userData?.name || "User";
  const role      = userData?.role || "Freelancer";
  const initials  = getInitials(name);
  const firstName = name.split(" ")[0];

  // ── Computed values ─────────────────────────────────────────────────────────
  const { score: profileScore, missing: profileMissing } = calcProfileStrength(userData, freelancerData);
  const earnedThisMonth = calcEarnedThisMonth(payments);

  // Next missing field hint (pick the highest-weight one not yet filled)
  // Strength bar colour tier
  const strengthTier =
    profileScore === 100 ? "full" :
    profileScore >= 70   ? "high" :
    profileScore >= 40   ? "mid"  : "";

  const nextHint = profileMissing.length > 0
    ? `Add your ${profileMissing[0].toLowerCase()} to boost visibility.`
    : "Your profile is complete! 🎉";

  const STATS = [
    { label: "Profile Views",     value: String(userData?.profileViews || 0), delta: userData?.profileViews > 0 ? "↑ all time" : null },
    { label: "Proposals Sent",    value: String(proposals.length),    delta: proposals.length > 0 ? `↑ +${proposals.length}` : null },
    { label: "Active Contracts",  value: String(contracts.length),    delta: null },
    { label: "Earned This Month", value: earnedThisMonth,             delta: earnedThisMonth !== "$0" ? "↑ this month" : null },
  ];

  return (
    <div className="dash-shell">
      {/* ── Sidebar ── */}
      <aside className={`dash-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="dash-brand">
          <div className="brand-icon">
            <img src="/image.png" alt="Logo" style={{ width:20, height:20, objectFit:"contain" }} />
          </div>
          <span className="dash-brandname">Hustlance<span>AI</span></span>
        </div>

        <nav className="dash-nav">
          {[
            { id:"dashboard", label:"Dashboard"  },
            { id:"jobs",      label:"Browse Jobs" },
            { id:"proposals", label:"Proposals"  },
            { id:"messages",  label:"Messages"   },
            { id:"earnings",  label:"Earnings"   },
            { id:"settings",  label:"Settings"   },
          ].map((item) => (
            <button key={item.id}
              className={`nav-btn ${activeNav === item.id ? "nav-btn--active" : ""}`}
              onClick={() => handleNavigation(item.id)}>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
          <button className="nav-btn" onClick={handleLogout}
            style={{ marginTop:"auto", color:"#ef4444" }}>
            <span className="nav-label">Logout</span>
          </button>
        </nav>

        {/* ── Profile row ── */}
        <div className="dash-profile" ref={profileRef}
          onClick={() => setProfileMenuOpen((prev) => !prev)}>
          <div className="profile-av">{initials}</div>
          <div className="profile-info">
            <p className="profile-name">{name}</p>
            <p className="profile-role" style={{ textTransform:"capitalize" }}>{role}</p>
          </div>
          <span className="online-dot" />

          {profileMenuOpen && (
            <div className="profile-popup" onClick={(e) => e.stopPropagation()}>
              <div className="profile-popup-header">
                <div className="profile-popup-av">{initials}</div>
                <div>
                  <p className="profile-popup-name">{name}</p>
                  <p className="profile-popup-role" style={{ textTransform:"capitalize" }}>{role}</p>
                </div>
              </div>
              <div className="profile-popup-divider" />
              <button className="profile-popup-item"
                onClick={() => { setProfileMenuOpen(false); navigate("/freelancer/profile"); }}>
                ✏️ &nbsp;Update Profile
              </button>
              <button className="profile-popup-item"
                onClick={() => { setProfileMenuOpen(false); handleNavigation("settings"); }}>
                ⚙️ &nbsp;Settings
              </button>
              <div className="profile-popup-divider" />
              <button className="profile-popup-item profile-popup-item--danger"
                onClick={() => { setProfileMenuOpen(false); handleLogout(); }}>
                🚪 &nbsp;Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile hamburger ── */}
      {createPortal(
        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? "mobile-menu-btn--open" : ""}`}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>,
        document.body,
      )}

      <div className={`dash-overlay ${mobileMenuOpen ? "dash-overlay--active" : ""}`}
        onClick={() => setMobileMenuOpen(false)} />

      {/* ── Main ── */}
      <main className="dash-main">
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">{getGreeting()}, {firstName} 👋</h1>
            <p className="dash-sub">
              Your AI found <strong>{jobs.length} open jobs</strong> right now
            </p>
          </div>
        </div>

        <div className="stats-row">
          {STATS.map((s) => (
            <div key={s.label} className={`stat-card${s.label === "Earned This Month" && earnedThisMonth !== "$0" ? " stat-card--earned" : ""}`}>
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
              {s.delta && <span className="stat-delta">{s.delta}</span>}
            </div>
          ))}
        </div>

        <div className="content-grid">
          <section className="jobs-col">
            <div className="section-hdr">
              <h2 className="section-title">AI-matched jobs</h2>
              <span className="live-chip">Live</span>
            </div>

            <div className="job-list">
              {jobs.length === 0 ? (
                <p style={{ color:"#888", fontSize:"14px", padding:"16px 0" }}>
                  No jobs posted yet. Check back soon!
                </p>
              ) : (
                jobs.map((job) => {
                  const match = 85;
                  const arc   = (match / 100) * CIRC;
                  return (
                    <div key={job.id} className="job-card">
                      <div className="job-top">
                        <div className="match-ring">
                          <svg viewBox="0 0 36 36" width="36" height="36">
                            <circle className="ring-bg"   cx="18" cy="18" r="14" />
                            <circle className="ring-fill" cx="18" cy="18" r="14"
                              strokeDasharray={`${arc.toFixed(1)} ${CIRC}`}
                              transform="rotate(-90 18 18)" />
                          </svg>
                          <span className="match-pct">{match}%</span>
                        </div>
                        <div className="job-info">
                          <p className="job-title">{job.title}</p>
                          <p className="job-company">{job.clientName || "Client"}</p>
                        </div>
                        <button
                          className={`save-btn ${saved.has(job.id) ? "save-btn--saved" : ""}`}
                          onClick={() => toggleSave(job.id)}>
                          {saved.has(job.id) ? "♥" : "♡"}
                        </button>
                      </div>

                      <div className="job-meta">
                        <span className="job-budget">${job.budget}</span>
                        <span className="sep">·</span>
                        <span>{job.duration}</span>
                        <span className="sep">·</span>
                        <span>{job.experience || "Any level"}</span>
                        <span className="job-posted">
                          {job.createdAt?.toDate
                            ? job.createdAt.toDate().toLocaleDateString() : "Just now"}
                        </span>
                      </div>

                      <div className="job-tags">
                        {(job.skills || []).map((skill) => (
                          <span key={skill} className="skill-tag">{skill}</span>
                        ))}
                      </div>

                      <div className="job-actions">
                        <button className="btn-apply" onClick={() => handleApply(job)}>Apply Now</button>
                        <button className="btn-details"
                          onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}>
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <aside className="right-col">
            {/* ── Real-time Activity ── */}
            <div className="panel-card">
              <h2 className="section-title">Activity</h2>
              {activity.length === 0 ? (
                <p style={{ color:"#666", fontSize:"13px" }}>
                  No activity yet. Apply to jobs or start chatting!
                </p>
              ) : (
                <ul className="activity-list">
                  {activity.map((a) => (
                    <li key={a.id} className="activity-item">
                      <span className={`activity-dot activity-dot--${a.type}`} />
                      <div>
                        <p className="activity-text">{a.text}</p>
                        <p className="activity-time">{formatTimeAgo(a.timestamp)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Profile strength (auto-calculated) ── */}
            <div className="panel-card">
              <h2 className="section-title">Profile strength</h2>
              <div className="strength-row">
                <div className="strength-bar">
                  <div className={`strength-fill${strengthTier ? ` strength-fill--${strengthTier}` : ""}`} style={{ width: `${profileScore}%` }} />
                </div>
                <span className={`strength-pct${strengthTier ? ` strength-pct--${strengthTier}` : ""}`}>{profileScore}%</span>
              </div>
              <p className="strength-hint">{nextHint}</p>
              {profileScore < 100 && (
                <button
                  className="btn-full-outline"
                  onClick={() => navigate("/freelancer/profile")}>
                  Complete Profile
                </button>
              )}
            </div>

            {/* ── Live Groq AI Insight ── */}
            <div className="panel-card panel-card--ai">
              <span className="ai-badge">AI Insight</span>
              {insightLoading ? (
                <p className="ai-text" style={{ color:"#666" }}>Analyzing market trends...</p>
              ) : (
                <p className="ai-text">{aiInsight}</p>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* ── Details Modal ── */}
      {selectedJob && (
        <div className="job-modal-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedJob(null); }}>
          <div className="job-modal">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <h2>{selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)}
                style={{ background:"none", border:"none", color:"#888",
                  fontSize:"22px", cursor:"pointer", lineHeight:1 }}>×</button>
            </div>
            <p className="modal-company">{selectedJob.clientName || "Client"}</p>
            <div style={{ display:"flex", gap:"12px", fontSize:"13px", color:"#aaa", margin:"8px 0" }}>
              <span>${selectedJob.budget}</span>
              <span>·</span><span>{selectedJob.duration}</span>
              <span>·</span><span>{selectedJob.experience || "Any level"}</span>
            </div>
            <p style={{ fontSize:"14px", color:"#ccc", lineHeight:1.6 }}>
              {selectedJob.description || "No description provided."}
            </p>
            <div className="modal-tags" style={{ margin:"12px 0" }}>
              {(selectedJob.skills || []).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <div style={{ display:"flex", gap:"8px", marginTop:"16px" }}>
              <button className="close-modal" style={{ flex:1 }}
                onClick={() => setSelectedJob(null)}>Close</button>
              <button className="close-modal" style={{ flex:1, background:"#fff", color:"#000" }}
                onClick={() => { const j = selectedJob; setSelectedJob(null); handleApply(j); }}>
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}