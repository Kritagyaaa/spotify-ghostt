import { Heart } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import styles from './NowPlayingCard.module.css';

export function NowPlayingCard({ song }) {
  const { currentSong, toggleLike } = usePlayer();
  const isLiked = currentSong?.is_liked;

  return (
    <section className={styles.nowPlaying} aria-label={`${song.title} by ${song.artist}`}>
      <img className={styles.albumCover} src={song.albumCover} alt={`${song.title} album cover`} />
      <div className={styles.songInfo}>
        <div className={styles.textBlock}>
          <h2 className={styles.title}>{song.title}</h2>
          <p className={styles.artist}>{song.artist}</p>
        </div>
        <button 
          className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`} 
          type="button" 
          aria-label={`Save ${song.title} to your library`}
          onClick={toggleLike}
          style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Heart 
            size={21} 
            fill={isLiked ? "#1db954" : "none"} 
            color={isLiked ? "#1db954" : "#b3b3b3"}
            strokeWidth={2.1} 
          />
        </button>
      </div>
    </section>
  );
}
