import { useEffect, useState } from "react";
import { Music } from "lucide-react";
import styles from "./SongsList.module.css";

import { getSongs } from "../../services/api";
import { usePlayer } from "../../context/PlayerContext";

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

              <button
                className={styles.playButton}
                onClick={() => playSong(song, songs)}
              >
                {playing ? "⏸" : <Music size={20} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}