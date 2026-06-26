import styles from './App.module.css';
import { useState } from "react";
import { Header } from './components/Header/Header.jsx';
import { LibrarySidebar } from './components/LibrarySidebar/LibrarySidebar.jsx';
import { PlayerBar } from './components/PlayerBar/PlayerBar.jsx';
import { RightSidebar } from './components/RightSidebar/RightSidebar.jsx';
import { MainPage } from './components/MainPage';
import { PlaylistView } from "./components/PlaylistView/PlaylistView";
import Login from './components/Auth/Login.jsx';
import SignUp from './components/Auth/SignUp.jsx';
import AccountPage from './components/Auth/AccountPage.jsx';

function App() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [showAuthScreen, setShowAuthScreen] = useState('login'); // 'login' or 'signup'
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'account'

  const handleLoginSuccess = (token, loggedInUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);
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
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('main');
  };

  const path = window.location.pathname;

  // If not authenticated and we are on an auth URL path, or if we are not authenticated at all:
  if (!isAuthenticated) {
    if (path.includes("/auth/signup") || showAuthScreen === 'signup') {
      return (
        <SignUp
          onShowLogin={() => {
            setShowAuthScreen('login');
            window.history.pushState({}, '', '/auth');
          }}
          onSignUpSuccess={() => {
            setShowAuthScreen('login');
            window.history.pushState({}, '', '/auth');
          }}
        />
      );
    }
    return (
      <Login
        onShowSignUp={() => {
          setShowAuthScreen('signup');
          window.history.pushState({}, '', '/auth/signup');
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Home Page
  return (
    <div className={styles.appFrame}>
      <Header
        onHomeClick={() => { setSelectedPlaylist(null); setCurrentView('main'); }}
        user={user}
        onLogout={handleLogout}
        onAccountClick={() => setCurrentView('account')}
      />

      <div className={styles.appShell}>
        <LibrarySidebar
          onPlaylistSelect={(playlist) => {
            setSelectedPlaylist(playlist);
            setCurrentView('main');
          }}
          selectedPlaylist={selectedPlaylist}
        />
        <main
          className={styles.mainPlaceholder}
          aria-label="Main content"
        >
          {currentView === 'account' ? (
            <AccountPage
              user={user}
              onProfileUpdate={(updated) => setUser(updated)}
              onBackToMain={() => setCurrentView('main')}
            />
          ) : selectedPlaylist ? (
            <PlaylistView playlist={selectedPlaylist} />
          ) : (
            <MainPage />
          )}
        </main>

        <RightSidebar />
      </div>

      <PlayerBar />
    </div>
  );
}

export default App;