import { useEffect, useState } from "react";
import { Music, Heart } from "lucide-react";
import styles from "./SongsList.module.css";

import { getSongs, toggleLikeSong } from "../../services/api";
import { usePlayer } from "../../context/playercontext";

export function SongsList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { playSong, currentSong, isPlaying } = usePlayer();

  useEffect(() => {
    async function fetchSongs() {
      try {
        const data = await getSongs();
        setSongs(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load songs.");
      } finally {
        setLoading(false);
      }
    }

    fetchSongs();
  }, []);

  const handleLikeToggle = async (e, songId) => {
    e.stopPropagation(); // Avoid triggering playSong on card click
    try {
      const res = await toggleLikeSong(songId);
      setSongs(prevSongs => prevSongs.map(s => {
        if (s.id === songId) {
          return {
            ...s,
            is_liked: res.liked ? 1 : 0,
            like_count: res.liked ? (s.like_count || 0) + 1 : Math.max(0, (s.like_count || 0) - 1)
          };
        }
        return s;
      }));
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to toggle like.");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h2>Loading songs...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2>{error}</h2>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className={styles.container}>
        <h2>No songs available.</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Available Songs</h2>

      <div className={styles.songsList}>
        {songs.map((song) => {
          const playing =
            currentSong?.id === song.id && isPlaying;

          return (
            <div
              key={song.id}
              className={styles.songCard}
              onClick={() => playSong(song, songs)}
            >
              <img
                src={
                  song.cover_url ||
                  "https://placehold.co/80x80?text=♪"
                }
                alt={song.title}
                className={styles.coverImage}
              />

              <div className={styles.songInfo}>
                <h3 className={styles.songTitle}>
                  {song.title}
                </h3>

                <p className={styles.songArtist}>
                  {song.artist}
                </p>

                <p className={styles.songAlbum}>
                  {song.album}
                </p>

                <div className={styles.songMeta}>
                  <span className={styles.duration}>
                    {song.duration}
                  </span>

                  <span className={styles.genre}>
                    {song.genre}
                  </span>
                </div>
              </div>

              <div className={styles.songControls}>
                <button
                  className={`${styles.likeButton} ${song.is_liked ? styles.liked : ''}`}
                  onClick={(e) => handleLikeToggle(e, song.id)}
                >
                  <Heart size={18} fill={song.is_liked ? "#1db954" : "none"} color={song.is_liked ? "#1db954" : "#b3b3b3"} />
                </button>

                <button
                  className={styles.playButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    playSong(song, songs);
                  }}
                >
                  {playing ? "⏸" : <Music size={20} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}