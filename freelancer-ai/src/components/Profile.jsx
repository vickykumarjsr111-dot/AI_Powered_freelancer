import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    portfolioLink: '',
    experience: '',
    location: '',
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
        const freelancerSnap = await getDoc(doc(db, 'freelancers', user.uid));

        if (userSnap.exists()) {
          const userData = userSnap.data();

          setProfileData(prev => ({
            ...prev,
            name: userData.name || '',
          }));
        }

        if (freelancerSnap.exists()) {
          const freelancerData = freelancerSnap.data();

          setProfileData(prev => ({
            ...prev,
            bio: freelancerData.bio || '',
            skills: freelancerData.skills?.join(', ') || '',
            hourlyRate: freelancerData.hourlyRate || '',
            portfolioLink: freelancerData.portfolioLink || '',
            experience: freelancerData.experience || '',
            location: freelancerData.location || '',
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
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

  const handleSave = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileData.name,
      });

      await setDoc(
        doc(db, 'freelancers', user.uid),
        {
          uid: user.uid,
          name: profileData.name,
          bio: profileData.bio,
          skills: profileData.skills
            .split(',')
            .map(skill => skill.trim())
            .filter(Boolean),
          hourlyRate: Number(profileData.hourlyRate),
          portfolioLink: profileData.portfolioLink,
          experience: profileData.experience,
          location: profileData.location,
        },
        { merge: true }
      );

      alert('Profile updated successfully!');
      navigate('/freelancer/dashboard');
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return <div className="loading-profile">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">

        {/* Avatar */}
        <div className="profile-avatar">
          {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>

        <h1>Update Profile</h1>

        <form className="profile-form" onSubmit={handleSave}>

          {/* Full Name */}
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

          {/* Hourly Rate */}
          <div className="form-group">
            <label>Hourly Rate ($)</label>
            <input
              type="number"
              name="hourlyRate"
              placeholder="e.g. 25"
              value={profileData.hourlyRate}
              onChange={handleChange}
            />
          </div>

          {/* Skills */}
          <div className="form-group full-width">
            <label>Skills</label>
            <input
              type="text"
              name="skills"
              placeholder="React, Firebase, Node.js, JavaScript"
              value={profileData.skills}
              onChange={handleChange}
            />
          </div>

          {/* Bio */}
          <div className="form-group full-width">
            <label>Bio</label>
            <textarea
              name="bio"
              placeholder="Tell clients about yourself..."
              value={profileData.bio}
              onChange={handleChange}
            />
          </div>

          {/* Portfolio */}
          <div className="form-group">
            <label>Portfolio Link</label>
            <input
              type="text"
              name="portfolioLink"
              placeholder="https://yourportfolio.com"
              value={profileData.portfolioLink}
              onChange={handleChange}
            />
          </div>

          {/* Experience */}
          <div className="form-group">
            <label>Experience</label>
            <input
              type="text"
              name="experience"
              placeholder="e.g. 2 years"
              value={profileData.experience}
              onChange={handleChange}
            />
          </div>

          {/* Location */}
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

          {/* Buttons */}
          <div className="profile-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/freelancer/dashboard')}
            >
              Cancel
            </button>

            <button type="submit" className="save-btn">
              Save Profile
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}