import { Header } from './components/Header/Header.jsx';
import { LibrarySidebar } from './components/LibrarySidebar/LibrarySidebar.jsx';
import { PlayerBar } from './components/PlayerBar/PlayerBar.jsx';
import { RightSidebar } from './components/RightSidebar/RightSidebar.jsx';
import { MainPage } from './components/MainPage';
import styles from './App.module.css';
import { useState } from "react";
import { PlaylistView } from "./components/PlaylistView/PlaylistView";

import Login from './components/Auth/Login.jsx';
import SignUp from './components/Auth/SignUp.jsx';

function App() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const path = window.location.pathname;

  // Auth Routes
  if (path.includes("/auth/signup")) {
    return <SignUp />;
  }

  if (path.includes("/auth")) {
    return <Login />;
  }

  // Home Page
  return (
    <div className={styles.appFrame}>
      <Header
        onHomeClick={() => setSelectedPlaylist(null)}
      />

      <div className={styles.appShell}>
        <LibrarySidebar
          onPlaylistSelect={setSelectedPlaylist}
          selectedPlaylist={selectedPlaylist}
        />

        <main
          className={styles.mainPlaceholder}
          aria-label="Main content"
        >
          {selectedPlaylist ? (
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