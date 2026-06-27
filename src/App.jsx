import styles from './App.module.css';
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { searchSongs } from "./services/api";
import { Header } from './components/Header/Header.jsx';
import { LibrarySidebar } from './components/LibrarySidebar/LibrarySidebar.jsx';
import { PlayerBar } from './components/PlayerBar/PlayerBar.jsx';
import { RightSidebar } from './components/RightSidebar/RightSidebar.jsx';
import { MainPage } from './components/MainPage';
import { PlaylistView } from "./components/PlaylistView/PlaylistView";
import Login from './components/Auth/Login.jsx';
import SignUp from './components/Auth/SignUp.jsx';
import AccountPage from './components/Auth/AccountPage.jsx';
import { HistoryView } from './components/HistoryView/HistoryView.jsx';
import { usePlayer } from './context/PlayerContext.jsx';
import { ExpandedPlayer } from './components/ExpandedPlayer/ExpandedPlayer.jsx';

function ProtectedLayout({
  isAuthenticated,
  selectedPlaylist,
  setSelectedPlaylist,
  user,
  handleLogout,
  navigate,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
}) {
  const { isExpanded } = usePlayer();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.appFrame}>
      <Header
        onHomeClick={() => {
          setSelectedPlaylist(null);
          setSearchQuery("");
          navigate("/");
        }}
        user={user}
        onLogout={handleLogout}
        onAccountClick={() => navigate("/profile")}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
      />

      {isExpanded ? (
        <div className={styles.appShellExpanded}>
          <ExpandedPlayer />
        </div>
      ) : (
        <div className={styles.appShell}>
          <LibrarySidebar
            onPlaylistSelect={(playlist) => {
              setSelectedPlaylist(playlist);
              setSearchQuery("");
              navigate('/');
            }}
            selectedPlaylist={selectedPlaylist}
          />
          <main
            className={styles.mainPlaceholder}
            aria-label="Main content"
          >
            <Outlet />
          </main>

          <RightSidebar />
        </div>
      )}

      <PlayerBar />
    </div>
  );
}

function App() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);


  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  useEffect(() => {

    const timer = setTimeout(async () => {

      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {

        const results = await searchSongs(searchQuery);

        setSearchResults(results);

      } catch (err) {

        console.error(err);

      }

    }, 300);

    return () => clearTimeout(timer);

  }, [searchQuery]);
  const handleLoginSuccess = (token, loggedInUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_song');
    localStorage.removeItem('last_queue');
    localStorage.removeItem('playback_time');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  // Protected Layout component that renders the full Spotify layout
  const AppLayout = () => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return (
      <div className={styles.appFrame}>
        <Header
          onHomeClick={() => {
            setSelectedPlaylist(null);
            setSearchQuery("");
            navigate("/");
          }}
          user={user}
          onLogout={handleLogout}
          onAccountClick={() => navigate("/profile")}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className={styles.appShell}>
          <LibrarySidebar
            onPlaylistSelect={(playlist) => {
              setSelectedPlaylist(playlist);
              navigate('/');
            }}
            selectedPlaylist={selectedPlaylist}
          />
          <main
            className={styles.mainPlaceholder}
            aria-label="Main content"
          >
            <Outlet />
          </main>

          <RightSidebar />
        </div>

        <PlayerBar />
      </div>
    );
  };

  return (
    <Routes>
      {/* Public/Guest Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login
              onShowSignUp={() => navigate('/signup')}
              onLoginSuccess={handleLoginSuccess}
            />
          )
        }
      />
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <SignUp
              onShowLogin={() => navigate('/login')}
              onSignUpSuccess={() => navigate('/login')}
              onLoginSuccess={handleLoginSuccess}
            />
          )
        }
      />

      {/* Legacy auth route compatibility */}
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/auth/signup" element={<Navigate to="/signup" replace />} />

      {/* Protected Routes inside the App Layout */}
      <Route
        element={
          <ProtectedLayout
            isAuthenticated={isAuthenticated}
            selectedPlaylist={selectedPlaylist}
            setSelectedPlaylist={setSelectedPlaylist}
            user={user}
            handleLogout={handleLogout}
            navigate={navigate}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            setSearchResults={setSearchResults}
          />
        }
      >
        <Route
          path="/"
          element={
            selectedPlaylist ? (
              <PlaylistView playlist={selectedPlaylist} />
            ) : (
              <MainPage
                searchQuery={searchQuery}
                searchResults={searchResults}
              />
            )
          }
        />
        <Route
          path="/profile"
          element={
            <AccountPage
              user={user}
              onProfileUpdate={(updated) => setUser(updated)}
              onBackToMain={() => {
                setSelectedPlaylist(null);
                navigate('/');
              }}
            />
          }
        />
        <Route
          path="/history"
          element={
            <HistoryView
              onBackToMain={() => {
                setSelectedPlaylist(null);
                navigate('/');
              }}
            />
          }
        />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
