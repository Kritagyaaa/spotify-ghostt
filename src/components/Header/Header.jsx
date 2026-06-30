import { SearchDropdown } from "../SearchDropdown/SearchDropdown";
import {
  Bell,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  UsersRound,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { searchSongs } from "../../services/api";
export function Header({
  onHomeClick,
  user,
  onLogout,
  onAccountClick,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
}) {

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearch(false);
        return;
      }

      try {
        const results = await searchSongs(searchQuery, {
          signal: controller.signal,
        });
        setSearchResults(results);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        setSearchResults([]);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery, setSearchResults]);
  return (
    <header className={styles.navbar} aria-label="Main navigation">
      <div className={styles.left}>
        <button 
          className={styles.iconButton} 
          type="button" 
          aria-label="Go back"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <button 
          className={styles.iconButton} 
          type="button" 
          aria-label="Go forward"
          onClick={() => navigate(1)}
        >
          <ChevronRight size={22} strokeWidth={2.4} />
        </button>
      </div>

      <div className={styles.center}>
        <button
  className={styles.homeButton}
  type="button"
  aria-label="Home"
  onClick={onHomeClick}
>
          <Home size={26} fill="currentColor" strokeWidth={2.1} />
        </button>

        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
          <Search size={22} strokeWidth={2.2} />
          <input
    type="text"
    placeholder="What do you want to play?"
    aria-label="Search music"
    value={searchQuery}
  onChange={(e) => {

    setSearchQuery(e.target.value);

    if (e.target.value.trim()) {
        setShowSearch(true);
    }

}}
    onFocus={() => {
        if (searchResults.length > 0) {
            setShowSearch(true);
        }
    }}
/>
          <button
            type="button"
            className={styles.briefcaseButton}
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              navigate("/browse");
            }}
            title="Browse Genres & Creators"
            aria-label="Browse"
          >
            <Briefcase size={22} strokeWidth={2.1} />
          </button>
          </div>

          <SearchDropdown
            results={searchResults}
            visible={showSearch}
            onClose={() => setShowSearch(false)}
          />
        </div>
      </div>

      <div className={styles.right}>
        <button className={styles.iconButton} type="button" aria-label="Notifications">
          <Bell size={21} strokeWidth={2.2} />
        </button>
        <button className={styles.iconButton} type="button" aria-label="Friends activity">
          <UsersRound size={22} strokeWidth={2.2} />
        </button>
        <div className={styles.profileWrapper}>
          <img
            src={user?.profile_picture || "https://i.pinimg.com/736x/6c/41/cb/6c41cb3ae4d97eeb68ee2279fe0e0c6f.jpg"}
            alt="Profile"
            className={styles.profile}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            role="button"
            tabIndex={0}
            aria-expanded={showProfileMenu}
            aria-label="User profile menu"
          />
          {showProfileMenu && (
            <div className={styles.profileMenu} role="menu">
              <div
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setShowProfileMenu(false);
                  onAccountClick?.();
                }}
                style={{ cursor: 'pointer' }}
              >
                <span>Account</span>
                <ExternalLink size={16} />
              </div>
              {user?.role === 'creator' && (
                <div
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/creator/dashboard");
                  }}
                  style={{ cursor: 'pointer', color: '#1db954', fontWeight: 'bold' }}
                >
                  <span>Creator Dashboard</span>
                </div>
              )}
              <div className={styles.menuItem} role="menuitem">Recents</div>
              <div className={styles.menuItem} role="menuitem">
                <span>Support</span>
                <ExternalLink size={16} />
              </div>
              <div className={styles.menuItem} role="menuitem">
                <span>Download</span>
                <ExternalLink size={16} />
              </div>
              <div className={styles.menuItem} role="menuitem">Settings</div>
              <div className={styles.menuItem} role="menuitem" onClick={onLogout} style={{ cursor: 'pointer' }}>Log out</div>
              <hr className={styles.divider} />
              <div className={styles.updatesSection}>
                <h3>Your Updates</h3>
                <div className={styles.checkIcon}>
                  <Check size={60} strokeWidth={2.5} />
                </div>
                <h4 className={styles.updateTitle}>You're all caught up</h4>
                <p className={styles.updateText}>
                  Watch this space for news on your followers,
                  playlists, events and more.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
