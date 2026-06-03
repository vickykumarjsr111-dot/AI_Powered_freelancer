import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { auth, db } from '../firebase';

import { onAuthStateChanged } from 'firebase/auth';

import { doc, getDoc } from 'firebase/firestore';

import './Settings.css';

function getInitials(name = '') {

  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

}

export default function Settings() {

  const navigate = useNavigate();

  const [userData, setUserData] =
    useState(null);

  const [showPopup, setShowPopup] =
    useState(false);

  const [profileImage, setProfileImage] =
    useState(null);

  const [formData, setFormData] =
    useState({

      name: '',

      age: '26',

      skills: '',

      bio: '',

      portfolio:
        'https://yourportfolio.com',

      portfolioDesc:
        'Frontend projects focused on modern UI and responsive design.',

      emailNotifications: true,

      messageAlerts: true,

      availableForWork: true,

      publicProfile: true,

    });

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          if (!currentUser) return;

          try {

            const userRef = doc(
              db,
              'users',
              currentUser.uid
            );

            const userSnap =
              await getDoc(userRef);

            if (userSnap.exists()) {

              const data =
                userSnap.data();

              setUserData(data);

              setFormData((prev) => ({

                ...prev,

                name:
                  data.name || '',

                skills:
                  data.skills || '',

                bio:
                  data.bio || '',

              }));
            }

          } catch (error) {

            console.error(error);

          }
        }
      );

    return () => unsubscribe();

  }, []);

  const handleChange = (e) => {

    const { name, value, type, checked } =
      e.target;

    setFormData({

      ...formData,

      [name]:
        type === 'checkbox'
          ? checked
          : value,

    });
  };

  const handleSave = () => {

    localStorage.setItem(
      'settingsData',
      JSON.stringify(formData)
    );

    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
    }, 2500);
  };

  const handleImageUpload = (e) => {

    const file = e.target.files[0];

    if (file) {

      const imageUrl =
        URL.createObjectURL(file);

      setProfileImage(imageUrl);
    }
  };

  return (

    <div className="fp-shell">

      {/* SIDEBAR */}

      <aside className="fp-sidebar">

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

        <nav className="fp-nav">

          <button
            className="fp-nav-btn"
            onClick={() =>
              navigate(
                '/freelancer/dashboard'
              )
            }
          >
            Dashboard
          </button>

          <button
            className="fp-nav-btn"
            onClick={() =>
              navigate(
                '/freelancer/jobs'
              )
            }
          >
            Browse Jobs
          </button>

          <button
            className="fp-nav-btn"
            onClick={() =>
              navigate(
                '/freelancer/proposals'
              )
            }
          >
            Proposals
          </button>

          <button
            className="fp-nav-btn"
            onClick={() =>
              navigate(
                '/freelancer/messages'
              )
            }
          >
            Messages
          </button>

          <button
            className="fp-nav-btn"
            onClick={() =>
              navigate(
                '/freelancer/earnings'
              )
            }
          >
            Earnings
          </button>

          <button
            className="fp-nav-btn fp-nav-btn--active"
            onClick={() =>
              navigate('/freelancer/settings')
            }
          >
            Settings
          </button>

          <button
            className="fp-nav-btn"
            style={{
              marginTop: 'auto',
              color: '#ef4444',
            }}
          >
            Logout
          </button>

        </nav>

        <div className="fp-profile">

          <div className="fp-profile-av">

            {getInitials(
              userData?.name || 'User'
            )}

          </div>

          <div className="fp-profile-info">

            <p className="fp-profile-name">

              {userData?.name || 'User'}

            </p>

            <p className="fp-profile-role">
              Freelancer
            </p>

          </div>

          <span className="fp-online-dot" />

        </div>

      </aside>

      {/* MAIN */}

      <main className="settings-page">

        {showPopup && (

          <div className="popup">
            Changes Saved Successfully
          </div>

        )}

        <h1 className="settings-title">
          Settings
        </h1>

        <div className="settings-grid">

          {/* PROFILE */}

          <div className="settings-card">

            <h2>Profile Settings</h2>

            <div className="profile-photo-row">

              {profileImage ? (

                <img
                  src={profileImage}
                  alt="Profile"
                  className="profile-photo"
                />

              ) : (

                <div className="profile-photo initials-avatar">

                  {getInitials(
                    userData?.name || 'User'
                  )}

                </div>

              )}

              <label className="upload-btn">

                Upload Photo

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={
                    handleImageUpload
                  }
                />

              </label>

            </div>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="settings-input"
            />

            <input
              type="text"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="settings-input"
            />

            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="settings-input"
            />

            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="settings-textarea"
            />

          </div>

          {/* PREFERENCES */}

          <div className="settings-card">

            <h2>Preferences</h2>

            <div className="pref-row">

              <span>
                Email Notifications
              </span>

              <input
                type="checkbox"
                name="emailNotifications"
                checked={
                  formData.emailNotifications
                }
                onChange={handleChange}
              />

            </div>

            <div className="pref-row">

              <span>
                Message Alerts
              </span>

              <input
                type="checkbox"
                name="messageAlerts"
                checked={
                  formData.messageAlerts
                }
                onChange={handleChange}
              />

            </div>

            <div className="pref-row">

              <span>
                Available For Work
              </span>

              <input
                type="checkbox"
                name="availableForWork"
                checked={
                  formData.availableForWork
                }
                onChange={handleChange}
              />

            </div>

            <div className="pref-row">

              <span>
                Show Profile Publicly
              </span>

              <input
                type="checkbox"
                name="publicProfile"
                checked={
                  formData.publicProfile
                }
                onChange={handleChange}
              />

            </div>

          </div>

          {/* PORTFOLIO */}

          <div className="settings-card">

            <h2>Portfolio</h2>

            <input
              type="text"
              name="portfolio"
              value={formData.portfolio}
              onChange={handleChange}
              className="settings-input"
            />

            <textarea
              name="portfolioDesc"
              value={
                formData.portfolioDesc
              }
              onChange={handleChange}
              className="settings-textarea"
            />

          </div>

        </div>

        {/* SAVE */}

        <div className="save-section">

          <button
            className="save-btn"
            onClick={handleSave}
          >
            Save Changes
          </button>

        </div>

      </main>

    </div>
  );
}