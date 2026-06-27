import {
    Heart,
  ListMusic,
  Maximize2,
  Mic2,
  MonitorSpeaker,
  Pause,
  Play,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";

import styles from "./PlayerBar.module.css";
import { usePlayer } from "../../context/PlayerContext";
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
  } = usePlayer();

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
            <Volume2 size={18} />
          </button>
          <input
            className={styles.volumeSlider}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
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
          <button className={styles.controlButton}>
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

          <button className={styles.controlButton}>
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
        <button className={styles.controlButton}>
          <Mic2 size={18} />
        </button>

        <button className={styles.controlButton}>
          <ListMusic size={18} />
        </button>

        <button className={styles.controlButton}>
          <MonitorSpeaker size={18} />
        </button>

        <button className={styles.controlButton}>
          <Volume2 size={18} />
        </button>

        <input
          className={styles.volumeSlider}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) =>
            setVolume(Number(e.target.value))
          }
        />

        <button className={styles.controlButton}>
          <Maximize2 size={17} />
        </button>
      </div>
    </footer>
  );
}