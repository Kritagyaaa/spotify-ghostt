import {
  Heart,
  ListMusic,
  Maximize2,
  Minimize2,
  Mic2,
  MonitorSpeaker,
  Pause,
  Play,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Plus,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import styles from "./PlayerBar.module.css";
import { usePlayer } from "../../context/PlayerContext";
import { usePlaylists } from "../../context/playlistcontext";
import { CreatePlaylistModel } from "../CreatePlaylistModel/CreatePlaylistModel";
import { addSongToPlaylist } from "../../services/api";
import placeholder from "../../assets/music-placeholder.jpg";

export function PlayerBar() {
    const {
        currentSong,
        isPlaying,
        togglePlay,
        nextSong,
        previousSong,
        currentTime,
        duration,
        seek,
        volume,
        setVolume,
        toggleLike,
        isExpanded,
        toggleExpand,
        isShuffle,
        toggleShuffle,
        isRepeat,
        toggleRepeat,
        addToUserQueue,
    } = usePlayer();

  const location = useLocation();
  const navigate = useNavigate();
  const isQueueActive = location.pathname === "/queue";

  const { playlists, loadPlaylists, refreshSelectedPlaylist } = usePlaylists();
  const [showAddToPlaylistDropdown, setShowAddToPlaylistDropdown] = useState(false);
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      // Unmute: restore previous volume
      const restored = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.2;
      setVolume(restored);
      setIsMuted(false);
    } else {
      // Mute: save current volume and set to 0
      prevVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume, setVolume]);

  const addToPlaylistDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        addToPlaylistDropdownRef.current &&
        !addToPlaylistDropdownRef.current.contains(e.target)
      ) {
        setShowAddToPlaylistDropdown(false);
      }
    };
    if (showAddToPlaylistDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showAddToPlaylistDropdown]);

  const handleAddSongToPl = async (playlistId) => {
    if (!currentSong) return;
    try {
      await addSongToPlaylist(playlistId, currentSong.id);
      alert("Song added to playlist successfully!");
      setShowAddToPlaylistDropdown(false);
      await loadPlaylists(); // update count in library sidebar
      await refreshSelectedPlaylist(); // update counts in playlist details
    } catch (err) {
      alert(err.message || "Failed to add song.");
    }
  };

  // Nothing selected yet
  if (!currentSong) {
    return (
      <footer className={styles.playerBar}>
        {/* LEFT – empty state */}
        <div className={styles.track}>
          <div className={styles.songInfo}>
            <h2>No song selected</h2>
            <p>Select a song to play</p>
          </div>
        </div>

        {/* CENTER – controls (disabled look) */}
        <div className={styles.playerCenter}>
          <div className={styles.controls}>
            <button className={`${styles.controlButton} ${styles.disabled}`} disabled>
              <Shuffle size={18} />
            </button>
            <button className={`${styles.controlButton} ${styles.disabled}`} disabled>
              <SkipBack size={22} fill="currentColor" />
            </button>
            <button className={`${styles.playButton} ${styles.disabled}`} disabled>
              <Play size={18} fill="black" color="black" strokeWidth={2.5} className={styles.playIcon} />
            </button>
            <button className={`${styles.controlButton} ${styles.disabled}`} disabled>
              <SkipForward size={22} fill="currentColor" />
            </button>
            <button className={`${styles.controlButton} ${styles.disabled}`} disabled>
              <Repeat2 size={18} />
            </button>
          </div>
          <div className={styles.progressSection}>
            <span>0:00</span>
            <input type="range" min={0} max={0} value={0} disabled />
            <span>0:00</span>
          </div>
        </div>

        {/* RIGHT – extras (disabled look) */}
        <div className={styles.extras}>
          <button className={`${styles.controlButton} ${styles.disabled}`} disabled>
            <Mic2 size={18} />
          </button>
          <button className={`${styles.controlButton} ${styles.disabled}`} disabled>
            <ListMusic size={18} />
          </button>
          <button className={`${styles.controlButton} ${styles.disabled}`} disabled>
            <MonitorSpeaker size={18} />
          </button>
          <button className={`${styles.controlButton} ${styles.disabled}`} disabled>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            className={styles.volumeSlider}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (isMuted && val > 0) setIsMuted(false);
              prevVolumeRef.current = val;
              setVolume(val);
            }}
          />
          <button className={`${styles.controlButton} ${styles.disabled}`} disabled>
            <Maximize2 size={17} />
          </button>
        </div>
      </footer>
    );
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <footer className={styles.playerBar}>
      {/* LEFT */}
      <div className={styles.track}>
        <img
          className={styles.albumCover}
          src={
            currentSong.cover_url ||
            placeholder
          }
          alt={currentSong.title}
        />

        <div className={styles.songInfo}>
          <h2>{currentSong.title}</h2>
          <p>{currentSong.artist}</p>
        </div>

        <button
          className={`${styles.savedButton} ${currentSong.is_liked ? styles.liked : ''}`}
          type="button"
          onClick={toggleLike}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Heart
            size={19}
            fill={currentSong.is_liked ? "#1db954" : "none"}
            color={currentSong.is_liked ? "#1db954" : "#b3b3b3"}
            strokeWidth={2.2}
          />
        </button>
      </div>

      {/* CENTER */}
      <div className={styles.playerCenter}>
        <div className={styles.controls}>
          <button 
            className={`${styles.controlButton} ${isShuffle ? styles.activeControl : ""}`}
            onClick={toggleShuffle}
            aria-label="Toggle Shuffle"
          >
            <Shuffle size={18} />
          </button>

          <button
            className={styles.controlButton}
            onClick={previousSong}
          >
            <SkipBack
              size={22}
              fill="currentColor"
            />
          </button>

          <button
            className={styles.playButton}
            onClick={togglePlay}
          >
            {isPlaying ? (
    <div className={styles.pauseIcon}>
        <span></span>
        <span></span>
    </div>
) : (
    <Play
        size={18}
        fill="black"
        color="black"
        strokeWidth={2.5}
        className={styles.playIcon}
    />
)}
          </button>

          <button
            className={styles.controlButton}
            onClick={nextSong}
          >
            <SkipForward
              size={22}
              fill="currentColor"
            />
          </button>

          <button 
            className={`${styles.controlButton} ${isRepeat ? styles.activeControl : ""}`}
            onClick={toggleRepeat}
            aria-label="Toggle Repeat"
          >
            <Repeat2 size={18} />
          </button>
        </div>

        <div className={styles.progressSection}>
          <span>{formatTime(currentTime)}</span>

          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) =>
              seek(Number(e.target.value))
            }
          />

          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className={styles.extras}>
        <div className={styles.dropdownWrapper} ref={addToPlaylistDropdownRef}>
          <button 
            className={styles.controlButton}
            onClick={() => setShowAddToPlaylistDropdown(!showAddToPlaylistDropdown)}
            title="Add to playlist"
          >
            <Plus size={18} />
          </button>
          
          {showAddToPlaylistDropdown && (
            <div className={styles.playlistDropdown}>
              <button 
                className={styles.dropdownItem}
                onClick={() => {
                  setShowCreateModel(true);
                  setShowAddToPlaylistDropdown(false);
                }}
              >
                <Plus size={14} /> Create Playlist
              </button>
              
              {playlists.length > 0 && (
                <>
                  <div className={styles.dropdownDivider} />
                  <div className={styles.dropdownHeader}>Add to Playlist</div>
                  {playlists.map(pl => (
                    <button
                      key={pl.id}
                      className={styles.dropdownItem}
                      onClick={() => handleAddSongToPl(pl.id)}
                    >
                      {pl.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <button
          className={styles.controlButton}
          onClick={() => navigate(isQueueActive ? "/" : "/queue")}
          title="Queue"
          style={isQueueActive ? { color: "#1db954" } : {}}
        >
          <ListMusic size={18} />
        </button>

        <button className={styles.controlButton}>
          <MonitorSpeaker size={18} />
        </button>

        <button
          className={`${styles.controlButton} ${isMuted ? styles.activeControl : ""}`}
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <input
          className={styles.volumeSlider}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (isMuted && val > 0) setIsMuted(false);
            prevVolumeRef.current = val;
            setVolume(val);
          }}
        />

        <button className={styles.controlButton} onClick={toggleExpand} aria-label={isExpanded ? "Collapse now playing view" : "Expand now playing view"}>
          {isExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>

      <CreatePlaylistModel 
        isOpen={showCreateModel} 
        onClose={() => setShowCreateModel(false)} 
      />
    </footer>
  );
}