import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Heart, Plus, Edit, Trash2, LogOut, ArrowRight, X, Upload, Check } from 'lucide-react';
import './CreatorDashboard.css';

function CreatorDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  // Redirect if not logged in or not a creator
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const isCreator = storedUser?.role === 'creator' || user?.role === 'creator';
    if (!isCreator) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Local state for creator's mock songs
  const [songs, setSongs] = useState([
    {
      id: 1,
      title: 'Midnight Shadows',
      genre: 'Pop',
      duration: 184,
      play_count: 14502,
      like_count: 852,
      cover_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop',
      created_at: '2026-06-15T12:00:00Z'
    },
    {
      id: 2,
      title: 'Echoes of You',
      genre: 'Rock',
      duration: 215,
      play_count: 9284,
      like_count: 512,
      cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop',
      created_at: '2026-06-20T12:00:00Z'
    },
    {
      id: 3,
      title: 'Summer Breeze',
      genre: 'Folk',
      duration: 168,
      play_count: 2491,
      like_count: 198,
      cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop',
      created_at: '2026-06-28T12:00:00Z'
    }
  ]);

  // Modal / UI states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Calculate aggregates
  const totalSongs = songs.length;
  const totalPlays = songs.reduce((sum, song) => sum + song.play_count, 0);
  const totalLikes = songs.reduce((sum, song) => sum + song.like_count, 0);

  // Handlers for Upload Modal
  const handleOpenUpload = () => {
    setTitle('');
    setGenre('Pop');
    setAudioFile(null);
    setCoverImage(null);
    setErrorMsg('');
    setSuccessMsg('');
    setShowUploadModal(true);
  };

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a song title.');
      return;
    }
    if (!audioFile) {
      setErrorMsg('Please select an audio file.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Simulate upload delay
    setTimeout(() => {
      const newSong = {
        id: Date.now(),
        title: title,
        genre: genre,
        duration: 180, // dummy duration
        play_count: 0,
        like_count: 0,
        cover_url: coverImage 
          ? URL.createObjectURL(coverImage) 
          : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop',
        created_at: new Date().toISOString()
      };

      setSongs([newSong, ...songs]);
      setSuccessMsg('Song uploaded successfully (Simulated B2 Upload)!');
      setLoading(false);
      
      setTimeout(() => {
        setShowUploadModal(false);
        setSuccessMsg('');
      }, 1500);
    }, 1500);
  };

  // Handlers for Edit Modal
  const handleOpenEdit = (song) => {
    setCurrentSong(song);
    setTitle(song.title);
    setGenre(song.genre);
    setErrorMsg('');
    setSuccessMsg('');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a song title.');
      return;
    }

    setSongs(songs.map(s => {
      if (s.id === currentSong.id) {
        return { ...s, title, genre };
      }
      return s;
    }));

    setSuccessMsg('Song details updated successfully!');
    setTimeout(() => {
      setShowEditModal(false);
      setSuccessMsg('');
      setCurrentSong(null);
    }, 1200);
  };

  // Handler for Delete
  const handleDelete = (songId) => {
    if (confirm('Are you sure you want to delete this song?')) {
      setSongs(songs.filter(s => s.id !== songId));
    }
  };

  const handleLocalLogout = () => {
    onLogout?.();
    navigate('/login');
  };

  const creatorName = user?.name || JSON.parse(localStorage.getItem('user'))?.name || 'Creator';

  return (
    <div className="creator-db-container">
      {/* Header bar */}
      <header className="creator-db-header">
        <div className="creator-db-title">
          <FaSpotifyLogo />
          <h1>Creator Studio</h1>
        </div>
        <div className="creator-db-actions">
          <button 
            className="creator-btn creator-btn-secondary" 
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Switch to Listener View <ArrowRight size={16} />
          </button>
          <button 
            className="creator-btn creator-btn-secondary" 
            onClick={handleLocalLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4444', borderColor: '#ff4444' }}
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </header>

      {/* Stats Cards Grid */}
      <section className="creator-stats-grid">
        <div className="creator-stat-card">
          <span className="creator-stat-label">Total Songs</span>
          <span className="creator-stat-value">{totalSongs}</span>
        </div>
        <div className="creator-stat-card">
          <span className="creator-stat-label">Total Plays</span>
          <span className="creator-stat-value">{totalPlays.toLocaleString()}</span>
        </div>
        <div className="creator-stat-card">
          <span className="creator-stat-label">Total Likes</span>
          <span className="creator-stat-value">{totalLikes.toLocaleString()}</span>
        </div>
      </section>

      {/* Songs Management Table */}
      <section className="creator-section">
        <div className="creator-section-header">
          <h2>My Uploaded Songs</h2>
          <button className="creator-btn creator-btn-primary" onClick={handleOpenUpload} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Upload New Song
          </button>
        </div>

        {songs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#b3b3b3' }}>
            <Music size={48} style={{ marginBottom: '15px', color: '#404040' }} />
            <p>No songs uploaded yet. Click the button above to upload your first track!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="creator-table">
              <thead>
                <tr>
                  <th>Song</th>
                  <th>Artist</th>
                  <th>Plays</th>
                  <th>Likes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {songs.map(song => (
                  <tr key={song.id}>
                    <td>
                      <div className="creator-song-info">
                        <img src={song.cover_url} alt={song.title} className="creator-song-cover" />
                        <div>
                          <div className="creator-song-title">{song.title}</div>
                          <div className="creator-song-genre">{song.genre}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: '600', color: '#b3b3b3' }}>{creatorName}</td>
                    <td>{song.play_count.toLocaleString()}</td>
                    <td>{song.like_count.toLocaleString()}</td>
                    <td>
                      <div className="creator-action-cell">
                        <button 
                          className="creator-icon-btn" 
                          onClick={() => handleOpenEdit(song)}
                          title="Edit Song"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="creator-icon-btn creator-icon-btn-danger" 
                          onClick={() => handleDelete(song.id)}
                          title="Delete Song"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upload Song Modal */}
      {showUploadModal && (
        <div className="creator-modal-overlay">
          <div className="creator-modal">
            <div className="creator-modal-header">
              <h3>Upload Song</h3>
              <button className="creator-modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit}>
              <div className="creator-form">
                {errorMsg && <div style={{ color: '#ff4444', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold' }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: '#1db954', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><Check size={16} /> {successMsg}</div>}

                <div className="creator-form-group">
                  <label>Song Title *</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Enter track title"
                    required
                    disabled={loading || !!successMsg}
                  />
                </div>

                <div className="creator-form-group">
                  <label>Genre *</label>
                  <select 
                    value={genre} 
                    onChange={(e) => setGenre(e.target.value)}
                    disabled={loading || !!successMsg}
                  >
                    <option value="Pop">Pop</option>
                    <option value="Rock">Rock</option>
                    <option value="Folk">Folk</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="Country">Country</option>
                    <option value="Jazz">Jazz</option>
                  </select>
                </div>

                <div className="creator-form-group">
                  <label>Audio File (.mp3, .wav) *</label>
                  <label className="creator-file-input-wrapper">
                    <Upload size={24} style={{ color: '#b3b3b3', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Choose Audio File</div>
                    <input 
                      type="file" 
                      accept="audio/mp3, audio/mpeg, audio/wav" 
                      onChange={handleAudioChange}
                      disabled={loading || !!successMsg}
                    />
                    {audioFile && <div className="creator-file-name">{audioFile.name}</div>}
                  </label>
                </div>

                <div className="creator-form-group">
                  <label>Cover Art Image (Optional)</label>
                  <label className="creator-file-input-wrapper">
                    <Upload size={24} style={{ color: '#b3b3b3', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Choose Image file</div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      disabled={loading || !!successMsg}
                    />
                    {coverImage && <div className="creator-file-name">{coverImage.name}</div>}
                  </label>
                </div>
              </div>

              <div className="creator-modal-footer">
                <button 
                  type="button" 
                  className="creator-btn creator-btn-secondary" 
                  onClick={() => setShowUploadModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="creator-btn creator-btn-primary"
                  disabled={loading || !!successMsg}
                >
                  {loading ? 'Uploading...' : 'Upload Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Song Details Modal */}
      {showEditModal && (
        <div className="creator-modal-overlay">
          <div className="creator-modal">
            <div className="creator-modal-header">
              <h3>Edit Song Details</h3>
              <button className="creator-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="creator-form">
                {errorMsg && <div style={{ color: '#ff4444', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold' }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: '#1db954', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><Check size={16} /> {successMsg}</div>}

                <div className="creator-form-group">
                  <label>Song Title *</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Enter track title"
                    required
                    disabled={loading || !!successMsg}
                  />
                </div>

                <div className="creator-form-group">
                  <label>Genre *</label>
                  <select 
                    value={genre} 
                    onChange={(e) => setGenre(e.target.value)}
                    disabled={loading || !!successMsg}
                  >
                    <option value="Pop">Pop</option>
                    <option value="Rock">Rock</option>
                    <option value="Folk">Folk</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="Country">Country</option>
                    <option value="Jazz">Jazz</option>
                  </select>
                </div>
              </div>

              <div className="creator-modal-footer">
                <button 
                  type="button" 
                  className="creator-btn creator-btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="creator-btn creator-btn-primary"
                  disabled={!!successMsg}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple local representation of Spotify Logo
function FaSpotifyLogo() {
  return (
    <svg 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ fill: '#1ED760', width: '36px', height: '36px' }}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.076-.67-.135-.746-.472-.076-.336.135-.67.472-.746 3.847-.878 7.14-.505 9.822 1.135.295.18.387.565.207.86zm1.226-2.723c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.183-.412.125-.845-.107-.97-.52-.125-.413.107-.847.52-.972 3.666-1.112 8.232-.57 11.34 1.342.367.227.487.707.26 1.074zm.106-2.833C14.382 8.87 8.528 8.676 5.136 9.705c-.52.158-1.074-.138-1.232-.658-.158-.52.138-1.074.658-1.232 3.896-1.182 10.372-.958 14.445 1.46.468.278.62.883.342 1.352-.277.47-.883.62-1.35.342z"/>
    </svg>
  );
}

export default CreatorDashboard;
