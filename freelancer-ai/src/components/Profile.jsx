import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [photoPreview, setPhotoPreview] = useState('');

  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    portfolioLink: '',
    experience: '',
    location: '',
    role: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;

      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));

        const freelancerSnap = await getDoc(
          doc(db, 'freelancers', user.uid)
        );

        if (userSnap.exists()) {
          const userData = userSnap.data();

          setProfileData((prev) => ({
            ...prev,
            name: userData.name || '',
            role: userData.role || '',
          }));
        }

        if (freelancerSnap.exists()) {
          const freelancerData = freelancerSnap.data();

          setProfileData((prev) => ({
            ...prev,
            bio: freelancerData.bio || '',
            skills:
              freelancerData.skills?.join(', ') || '',
            hourlyRate:
              freelancerData.hourlyRate || '',
            portfolioLink:
              freelancerData.portfolioLink || '',
            experience:
              freelancerData.experience || '',
            location:
              freelancerData.location || '',
          }));
        }
      } catch (error) {
        console.error(
          'Error loading profile:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setPhotoPreview(
        URL.createObjectURL(file)
      );
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await updateDoc(
        doc(db, 'users', user.uid),
        {
          name: profileData.name,
          role: profileData.role,
        }
      );

      if (profileData.role === 'freelancer') {
        await setDoc(
          doc(db, 'freelancers', user.uid),
          {
            uid: user.uid,
            name: profileData.name,
            bio: profileData.bio,

            skills: profileData.skills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),

            hourlyRate: Number(
              profileData.hourlyRate
            ),

            portfolioLink:
              profileData.portfolioLink,

            experience:
              profileData.experience,

            location:
              profileData.location,
          },
          { merge: true }
        );
      }

      alert('Profile updated successfully!');

      if (
        profileData.role === 'freelancer'
      ) {
        navigate('/freelancer/dashboard');
      } else if (
        profileData.role === 'client'
      ) {
        navigate('/client/dashboard');
      } else {
        navigate('/freelancer/dashboard');
      }
    } catch (error) {
      console.error(
        'Profile update failed:',
        error
      );

      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="loading-profile">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">

        {/* PROFILE AVATAR */}
        <div className="profile-avatar-wrapper">

          <div className="profile-avatar">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile"
              />
            ) : (
              profileData.name
                ?.charAt(0)
                ?.toUpperCase() || 'U'
            )}
          </div>

          <label className="profile-upload-btn">
            +
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              hidden
            />
          </label>

        </div>

        <h1>Update Profile</h1>

        {/* ROLE SELECTOR */}
        <div className="role-selector">
          {[
            {
              value: 'freelancer',
              emoji: '💼',
              label: 'Freelancer',
            },
            {
              value: 'client',
              emoji: '🏢',
              label: 'Client',
            },
          ].map((r) => (
            <button
              key={r.value}
              type="button"
              className={`role-btn ${
                profileData.role === r.value
                  ? 'role-btn--active'
                  : ''
              }`}
              onClick={() =>
                setProfileData({
                  ...profileData,
                  role: r.value,
                })
              }
            >
              <span className="role-emoji">
                {r.emoji}
              </span>

              <span className="role-label">
                {r.label}
              </span>
            </button>
          ))}
        </div>

        <form
          className="profile-form"
          onSubmit={handleSave}
        >

          {/* FULL NAME */}
          <div className="form-group">
            <label>Full Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={profileData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* FREELANCER FIELDS */}
          {profileData.role ===
            'freelancer' && (
            <>
              <div className="form-group">
                <label>
                  Hourly Rate ($)
                </label>

                <input
                  type="number"
                  name="hourlyRate"
                  placeholder="e.g. 25"
                  value={
                    profileData.hourlyRate
                  }
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Skills</label>

                <input
                  type="text"
                  name="skills"
                  placeholder="React, Firebase, Node.js"
                  value={profileData.skills}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Bio</label>

                <textarea
                  name="bio"
                  placeholder="Tell clients about yourself..."
                  value={profileData.bio}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>
                  Portfolio Link
                </label>

                <input
                  type="text"
                  name="portfolioLink"
                  placeholder="https://yourportfolio.com"
                  value={
                    profileData.portfolioLink
                  }
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Experience</label>

                <input
                  type="text"
                  name="experience"
                  placeholder="e.g. 2 years"
                  value={
                    profileData.experience
                  }
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* LOCATION */}
          <div className="form-group full-width">
            <label>Location</label>

            <input
              type="text"
              name="location"
              placeholder="India"
              value={profileData.location}
              onChange={handleChange}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="profile-actions">

            <button
              type="button"
              className="cancel-btn"
              onClick={() =>
                navigate(
                  profileData.role ===
                    'client'
                    ? '/client/dashboard'
                    : '/freelancer/dashboard'
                )
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
            >
              Save Profile
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}