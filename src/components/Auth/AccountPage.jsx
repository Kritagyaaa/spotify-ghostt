import { useState, useEffect } from 'react';
import './AccountPage.css';
import { User, Shield, Bell, Key, Monitor, ArrowLeft } from 'lucide-react';

function AccountPage({ user, onProfileUpdate, onBackToMain }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'edit', 'password', 'notifications', 'sessions'
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [picture, setPicture] = useState(user?.profile_picture || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem(`notifications_${user?.id}`);
    return saved ? JSON.parse(saved) : {
      news: true,
      concerts: false,
      playlists: true,
      security: true
    };
  });

  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/user/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch sessions');
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and Email are required.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone_number: phone, profile_picture: picture }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile update failed.');
      onProfileUpdate?.(data.user);
      setMessage('Profile updated successfully!');
      setActiveTab('overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password.');
      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('overview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = (key) => {
    const updated = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(updated);
    localStorage.setItem(`notifications_${user?.id}`, JSON.stringify(updated));
    setMessage('Notification settings saved.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke session');
      setMessage('Session terminated successfully.');
      fetchSessions();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="account-container">
      {/* Sidebar Navigation */}
      <div className="account-sidebar">
        <button className="back-btn" onClick={onBackToMain}>
          <ArrowLeft size={18} />
          Back to Music
        </button>

        <div className="sidebar-profile">
          <img 
            src={user?.profile_picture || "https://i.pinimg.com/736x/6c/41/cb/6c41cb3ae4d97eeb68ee2279fe0e0c6f.jpg"} 
            alt="User Avatar"
            className="sidebar-avatar" 
          />
          <h3>{user?.name}</h3>
          <p>{user?.role?.toUpperCase()}</p>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setError(''); setMessage(''); }}
          >
            <User size={18} />
            Account Overview
          </button>
          <button 
            className={`nav-item ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => { setActiveTab('edit'); setError(''); setMessage(''); }}
          >
            <Shield size={18} />
            Edit Profile
          </button>
          <button 
            className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => { setActiveTab('password'); setError(''); setMessage(''); }}
          >
            <Key size={18} />
            Change Password
          </button>
          <button 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('notifications'); setError(''); setMessage(''); }}
          >
            <Bell size={18} />
            Notifications
          </button>
          <button 
            className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('sessions'); setError(''); setMessage(''); }}
          >
            <Monitor size={18} />
            Active Sessions
          </button>
        </nav>
      </div>

      {/* Main Content Pane */}
      <div className="account-main-content">
        {error && <div className="feedback-message error-msg">{error}</div>}
        {message && <div className="feedback-message success-msg">{message}</div>}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="account-pane">
            <h2>Account Overview</h2>

            {/* Plan Card */}
            <div className="plan-card">
              <div className="plan-badge">Your Plan</div>
              <h3>Premium Family</h3>
              <p>You're a member of a Family subscription plan. Ad-free, offline music, and on-demand streaming.</p>
              <div className="family-members">
                <span className="member-avatar">👩</span>
                <span className="member-avatar">🧑</span>
                <span className="member-avatar">👧</span>
                <span className="member-avatar">🧒</span>
              </div>
            </div>

            {/* Details Profile */}
            <div className="info-section">
              <h3>Profile Details</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Username / Name</span>
                  <span className="info-value">{user?.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone Number</span>
                  <span className="info-value">{user?.phone_number || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Role Account Type</span>
                  <span className="info-value" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
                </div>
              </div>
              <button className="edit-profile-btn" onClick={() => setActiveTab('edit')}>
                Edit Profile Info
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Edit Profile */}
        {activeTab === 'edit' && (
          <div className="account-pane">
            <h2>Edit Personal Details</h2>
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+1234567890"
                />
              </div>

              <div className="form-group">
                <label>Profile Picture URL</label>
                <input 
                  type="url" 
                  value={picture} 
                  onChange={(e) => setPicture(e.target.value)} 
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setActiveTab('overview')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Change Password */}
        {activeTab === 'password' && (
          <div className="account-pane">
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => setActiveTab('overview')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notifications' && (
          <div className="account-pane">
            <h2>Notification Settings</h2>
            <p className="section-description">Choose how you want to stay updated on Meowsick announcements and alerts.</p>
            
            <div className="notification-list">
              <div className="notification-item">
                <div className="notification-info">
                  <h4>Product and Feature Updates</h4>
                  <p>Get tips and stay informed on new features added to the streaming web app.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={notificationSettings.news}
                  onChange={() => handleToggleNotification('news')}
                />
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Recommended Concerts & Tours</h4>
                  <p>Get notified about upcoming events for artists you listen to regularly.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={notificationSettings.concerts}
                  onChange={() => handleToggleNotification('concerts')}
                />
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Playlists & Releases</h4>
                  <p>Receive updates when your playlists receive new songs or artists drop new songs.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={notificationSettings.playlists}
                  onChange={() => handleToggleNotification('playlists')}
                />
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h4>Security Warnings</h4>
                  <p>Get important alerts regarding account sign-ins, resets, and login attempts.</p>
                </div>
                <input 
                  type="checkbox" 
                  className="switch-checkbox"
                  checked={notificationSettings.security}
                  onChange={() => handleToggleNotification('security')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Active Sessions */}
        {activeTab === 'sessions' && (
          <div className="account-pane">
            <h2>Active Sessions</h2>
            <p className="section-description">Manage all device connections linked to your account. You can log out of any remote session.</p>
            
            <div className="sessions-list">
              {sessions.length === 0 ? (
                <p style={{ color: '#b3b3b3' }}>No other active sessions found.</p>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="session-item">
                    <div className="session-icon">
                      <Monitor size={22} color="#1db954" />
                    </div>
                    <div className="session-details">
                      <h4>{s.device_info}</h4>
                      <p>IP Address: {s.ip_address}</p>
                      <span className="session-meta">Created at: {new Date(s.created_at).toLocaleString()}</span>
                    </div>
                    <button className="revoke-btn" onClick={() => handleRevokeSession(s.id)}>
                      End Session
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountPage;
