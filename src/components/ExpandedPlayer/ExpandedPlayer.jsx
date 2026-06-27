import { usePlayer } from "../../context/PlayerContext";
import { Minimize2, Settings, ListMusic, Layers, Radio, Heart } from "lucide-react";
import styles from "./ExpandedPlayer.module.css";
import placeholder from "../../assets/music-placeholder.jpg";

export function ExpandedPlayer() {
  const { currentSong, toggleExpand, toggleLike } = usePlayer();

  if (!currentSong) return null;

  // Setup related mock music videos using existing seeded artists
  const RELATED_VIDEOS = [
    {
      id: "vid-1",
      title: `${currentSong.title} (Official Music Video)`,
      thumbnail: currentSong.cover_url || placeholder,
      duration: "4:12",
      views: "1.2M views"
    },
    {
      id: "vid-2",
      title: `${currentSong.artist} - Live Performance`,
      thumbnail: currentSong.artist_image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&q=80",
      duration: "5:45",
      views: "450K views"
    },
    {
      id: "vid-3",
      title: `${currentSong.title} (Behind The Scenes)`,
      thumbnail: currentSong.cover_url || placeholder,
      duration: "3:30",
      views: "220K views"
    },
    {
      id: "vid-4",
      title: `${currentSong.artist} - Top Hits Compilation`,
      thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80",
      duration: "12:15",
      views: "3.4M views"
    }
  ];

  return (
    <div className={styles.container}>
      {/* Top Header Actions */}
      <div className={styles.topActionsBar}>
        <div className={styles.playingFrom}>
          <span className={styles.playingFromLabel}>PLAYING FROM PLAYLIST</span>
          <span className={styles.playingFromTitle}>{currentSong.album || "Library"}</span>
        </div>
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} aria-label="Radio">
            <Radio size={19} />
          </button>
          <button className={styles.actionBtn} aria-label="Queue">
            <ListMusic size={19} />
          </button>
          <button className={styles.actionBtn} aria-label="Lyrics">
            <Layers size={18} />
          </button>
          <button className={styles.actionBtn} aria-label="Settings">
            <Settings size={19} />
          </button>
          <button 
            className={styles.minimizeBtn} 
            onClick={toggleExpand}
            aria-label="Collapse full screen view"
          >
            <Minimize2 size={19} />
          </button>
        </div>
      </div>

      {/* Main Focus Area (Centered Album Art & Title) */}
      <div className={styles.focusContent}>
        <div className={styles.artWrapper}>
          <img 
            className={styles.largeCoverArt} 
            src={currentSong.cover_url || placeholder} 
            alt={currentSong.title} 
          />
          {/* Subtle colored glow behind the image for rich modern aesthetics */}
          <div 
            className={styles.glowBg}
            style={{ backgroundImage: `url(${currentSong.cover_url || placeholder})` }}
          />
        </div>

        <div className={styles.metaSection}>
          <div className={styles.songMetadata}>
            <h1 className={styles.songTitle}>{currentSong.title}</h1>
            <p className={styles.songArtist}>{currentSong.artist}</p>
          </div>
          <button 
            className={`${styles.likeBtn} ${currentSong.is_liked ? styles.liked : ""}`}
            onClick={toggleLike}
            aria-label="Like song"
          >
            <Heart 
              size={28} 
              fill={currentSong.is_liked ? "#1db954" : "none"} 
              color={currentSong.is_liked ? "#1db954" : "#b3b3b3"}
            />
          </button>
        </div>
      </div>

      {/* Related Content Row */}
      <div className={styles.relatedSection}>
        <h2 className={styles.relatedHeader}>Related music videos</h2>
        <div className={styles.videoRow}>
          {RELATED_VIDEOS.map(video => (
            <div key={video.id} className={styles.videoCard}>
              <div className={styles.thumbnailWrapper}>
                <img src={video.thumbnail} alt={video.title} />
                <span className={styles.videoDuration}>{video.duration}</span>
              </div>
              <div className={styles.videoInfo}>
                <h3 className={styles.videoTitle}>{video.title}</h3>
                <span className={styles.videoViews}>{video.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
