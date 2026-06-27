import { usePlayer } from '../../context/PlayerContext';
import { AboutArtistCard } from '../cards/AboutArtistCard.jsx';
import { CreditsCard } from '../cards/CreditsCard.jsx';
import { NowPlayingCard } from '../cards/NowPlayingCard.jsx';
import { RecommendationCard } from '../cards/recommendationCard.jsx';
import { SidebarHeader } from './SidebarHeader.jsx';
import styles from './RightSidebar.module.css';
import placeholder from '../../assets/music-placeholder.jpg';

export function RightSidebar() {
  const { currentSong } = usePlayer();

  if (!currentSong) {
    return (
      <aside className={styles.sidebar} aria-label="Now playing">
        <SidebarHeader playlistName="No playlist selected" />
        <div className={styles.scrollArea}>
          <div style={{ padding: '40px 20px', color: '#b3b3b3', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '8px' }}>No song playing</p>
            <p style={{ fontSize: '12px', color: '#7a7a7a' }}>Select and play a song to see artist details here.</p>
          </div>
        </div>
      </aside>
    );
  }

  // Construct a song structure that the card components expect
  const songData = {
    title: currentSong.title,
    artist: currentSong.artist,
    albumCover: currentSong.cover_url || placeholder,
    artistInfo: {
      name: currentSong.artist,
      image: currentSong.artist_image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=90',
      monthlyListeners: currentSong.play_count ? (currentSong.play_count * 123 + 4567).toLocaleString() : '14,243',
      bio: currentSong.artist_bio || `${currentSong.artist} is a featured artist on Spotify Clone. Explore their musical creations!`,
    },
    credits: [
      {
        id: 'credit-001',
        name: currentSong.artist,
        role: 'Main Artist',
        isFollowing: false,
      },
      {
        id: 'credit-002',
        name: currentSong.album || 'Unknown Album',
        role: 'Producer',
        isFollowing: false,
      }
    ]
  };

  return (
    <aside className={styles.sidebar} aria-label="Now playing">
      <SidebarHeader playlistName={currentSong.album || "Playing Now"} />
      <div className={styles.scrollArea}>
        <NowPlayingCard song={songData} />
        <AboutArtistCard artist={songData.artistInfo} />
        <CreditsCard credits={songData.credits} />
        <RecommendationCard />
      </div>
    </aside>
  );
}
