import {
  CheckCircle2,
  ListMusic,
  Maximize2,
  Mic2,
  MonitorSpeaker,
  PauseCircle,
  PlayCircle,
  Repeat2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";

import styles from "./PlayerBar.module.css";
import { usePlayer } from "../../context/PlayerContext";

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
    setVolume,
  } = usePlayer();

  // Nothing selected yet
  if (!currentSong) {
    return (
      <footer className={styles.playerBar}>
        <div className={styles.track}>
          <div className={styles.songInfo}>
            <h2>No song selected</h2>
            <p>Select a song to play</p>
          </div>
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
            "https://placehold.co/64x64?text=♪"
          }
          alt={currentSong.title}
        />

        <div className={styles.songInfo}>
          <h2>{currentSong.title}</h2>
          <p>{currentSong.artist}</p>
        </div>

        <button
          className={styles.savedButton}
          type="button"
        >
          <CheckCircle2
            size={19}
            fill="#1db954"
            strokeWidth={2.2}
          />
        </button>
      </div>

      {/* CENTER */}
      <div className={styles.playerCenter}>
        <div className={styles.controls}>
          <button
            className={styles.controlButton}
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
              <PauseCircle
                size={40}
                fill="currentColor"
              />
            ) : (
              <PlayCircle
                size={40}
                fill="currentColor"
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
            className={styles.controlButton}
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
        <button
          className={styles.controlButton}
        >
          <Mic2 size={18} />
        </button>

        <button
          className={styles.controlButton}
        >
          <ListMusic size={18} />
        </button>

        <button
          className={styles.controlButton}
        >
          <MonitorSpeaker size={18} />
        </button>

        <button
          className={styles.controlButton}
        >
          <Volume2 size={18} />
        </button>

        <input
          className={styles.volumeSlider}
          type="range"
          min={0}
          max={1}
          step={0.01}
          defaultValue={1}
          onChange={(e) =>
            setVolume(Number(e.target.value))
          }
        />

        <button
          className={styles.controlButton}
        >
          <Maximize2 size={17} />
        </button>
      </div>
    </footer>
  );
}