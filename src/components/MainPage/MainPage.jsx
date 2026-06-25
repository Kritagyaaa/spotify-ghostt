import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './MainPage.module.css';
import placeholder from "../../assets/music-placeholder.jpg";
import { getSongs } from "../../services/api";
import { usePlayer } from "../../context/PlayerContext";


// const QUICK_PICKS = [
//   { id: 1, img: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBw0NDQ0NDQ0NDQ0NDQ0NDQ0HDQ8NDQ0NFREWFiARExYYHSggGCYxGxUVITchJSkrMDouFyAzODcsOSgtLisBCgoKDQ0NFQ8PFSsdFR0rLTcrLysrLSsrLSsrNzAtLCstNysrLisxKzcrLS0tKystLS0tLTAtKystKy0rN//AABEIAOEA4QMBIgACEQEDEQH/xAAbAAEBAAIDAQAAAAAAAAAAAAACAAEDBQYHBP/EADQQAQEAAgADBAgEBgMBAAAAAAEAAgMEESEFMVPRBhJBUVJhkpMTcYGRBxQiMrHBQ1ShQv/EABsBAAMBAQEBAQAAAAAAAAAAAAECAwAEBgUH/8QAJhEBAQACAQMDBAMBAAAAAAAAAAECAxEEUpExMlESEyFBYWKhBf/aAAwDAQACEQMRAD8A85NePw4/sSNWPw4/STCQX6jdWvtnh0cQTTj8OP0kjTh8OP0kwmEl1a+2eG/AGjD4MfpJGjD4MPpLYEgp3Xr7Z4DgDRh8GH0kjh9fh4fSWwJhJdevtngGs4fX4eH04yOG1+Hh9GNtCQSXXh2zwDWcNr8PD6MZHC6vD1/Rj5W0JhTuvDtngGo4XV4ev6MfKRwurwtf0Y+VuCQSXDDtnhmo4TV4Wv6MfKZwurwtf0Y+VuCQSXDDtnhmo4TV4Wv6MfKZwGjwNP2sPK2hMKdww7YDScHp8LV9vHymcHp8LV9vHytwTCS4YfEBoOC0+Dq+3j5TOC0+Dq+3h5W8JBJcMPiA0HA6fB1fbw8pnA6PB0/aw8reEwp3DD4B85wOjwdP2sPKZwGjwNP2sPK3hMJLjj8A+c4DR4Gn7WHlM7P4fwNP2sPK+gJhJccfgHzHZ/D+Bp+1h5Tx7O4f/AK+j7WHlfQFsxOtO44/AcvL/AMHD4MfpLM6vk8QTCYUEwv0O11IJhQSCnaCCYUEwv0O11IJhQSCnaCCYUEgt2ggmFBMKdoIJhQTCS0GAmFkJBTtBBMKCYSWsgkFBMKdoIJhQTCnaCCYUEgktBBMKCYU7QQTCgmEloIJhQTCnaCCYUEwktBBMKCYU7QQTCgmEloIJhQTCnaCCYUEwktBBMKCYU7QQTCgmFO1kE8TrQTxOsloPKKqzfOM+0JhQTC95a6UEwoJBTtBBMKCYU7QQTCgmEloIJBQTCnaCCYT4fRnsyMNeGWeeXdjqxcsn9C7HwnoP2lsPWdevVz9nE7Qy/bHnyufb1GvX78pAdcCQXY+J9CO0dRzNeG33/yuwX9suXP9LgtunPXk4Z45YZHfjsHHI/Rkw369nsylAAmE9GrLPIwwxyzye7HWKv6XP8ACehvaGw9Z14ah7v5nYD+xzT9ZNm7DD3ZcM4AJhc/xHoZ2hrOZhr2cvZw+wX9suVwu3RnrycNmGWGZ347BEp47tefty5KATCgmEbQQTCwEwp2sgmFBMJLQqCYWAmFO0qC2YlgJ4nUp2s8kqzVwnckEwoJBe5tdCCYUEwp2ggmFBIJLQQTCgmFO0EF9vZXZ+zit+vRqOeex5c3uxDq5Py5Xyheifwu4A9TiOKT+pzNGD7sQMnl+5+1x9Z1H2dVynr+gdn7A7B0cDrMNWI7EPxN2Yevsf8AR8rlQqzeTyyyztyyvNoMcri+2+weH43D1duPLM/s26wNmP6+0+VytWxyuN5xvFZxXYfYOjgcOWs9bN/v27A/Ey/X2HyuVqrZZXK85Xmsrje2ex9PGYOO3E9Y5+psxP68H5Pt/K5KrY243merPIO0OA2cNuz07D+', label: 'Liked Songs' },
//   { id: 2, img: 'https://picsum.photos/60?2', label: 'Arijit Singh' },
//   { id: 3, img: 'https://picsum.photos/60?3', label: 'Desi Boyz' },
//   { id: 4, img: 'https://picsum.photos/60?4', label: 'Cigarettes After Sex' },
//   { id: 5, img: 'https://picsum.photos/60?5', label: 'The Weeknd' },
// ];

// const POPULAR_CARDS = [
//   { id: 1, img: 'https://i.pinimg.com/736x/79/03/25/790325665fefa194156f1bd296b2dc08.jpg', title: 'Ramayana', artist: 'Fever Stories' },
//   { id: 2, img: 'https://i.pinimg.com/736x/56/e7/49/56e7490ed7c4f3d48d799720ab58bae2.jpg', title: 'Mahabharat', artist: 'Pooja Patil' },
//   { id: 3, img: 'https://picsum.photos/220?8', title: 'Munshi Premchand', artist: 'Aawaz.com' },
// ];

// const RECENT_CARDS = [
//   { id: 1, img: 'https://i.pinimg.com/736x/fa/62/3c/fa623c2875bd9ac93a1fe6c1482b21a7.jpg', title: 'Weeknd,Lily Rose', artist: 'One of the girls' },
//   { id: 2, img: 'https://i.pinimg.com/736x/4f/02/ec/4f02ec86a0cb37e6f64c319e9c874252.jpg', title: 'Taylor Swift', artist: 'Bejewelled' },
//   { id: 3, img: 'https://i.pinimg.com/736x/30/d0/1d/30d01d1bee3ba3657873a6d12a5878ce.jpg', title: 'Michael Jackson', artist: 'Earth Song' },
//   { id: 4, img: 'https://i.pinimg.com/736x/44/d1/2d/44d12d66b8c91296e4786dab10bf30bf.jpg', title: 'Alphaville', artist: 'Big in Japan' },
//   { id: 5, img: 'https://i.pinimg.com/736x/fa/62/3c/fa623c2875bd9ac93a1fe6c1482b21a7.jpg', title: 'Weeknd,Lily Rose', artist: 'One of the girls' },
//   { id: 6, img: 'https://i.pinimg.com/736x/4f/02/ec/4f02ec86a0cb37e6f64c319e9c874252.jpg', title: 'Taylor Swift', artist: 'Bejewelled' },
//   { id: 7, img: 'https://i.pinimg.com/736x/30/d0/1d/30d01d1bee3ba3657873a6d12a5878ce.jpg', title: 'Michael Jackson', artist: 'Earth Song' },
// ];

// const MIXES_CARDS = [
//   { id: 1, img: 'https://i.pinimg.com/736x/fa/62/3c/fa623c2875bd9ac93a1fe6c1482b21a7.jpg', title: 'Weeknd,Lily Rose', artist: 'One of the girls' },
//   { id: 2, img: 'https://i.pinimg.com/736x/4f/02/ec/4f02ec86a0cb37e6f64c319e9c874252.jpg', title: 'Taylor Swift', artist: 'Bejewelled' },
//   { id: 3, img: 'https://i.pinimg.com/736x/30/d0/1d/30d01d1bee3ba3657873a6d12a5878ce.jpg', title: 'Michael Jackson', artist: 'Earth Song' },
//   { id: 4, img: 'https://i.pinimg.com/736x/44/d1/2d/44d12d66b8c91296e4786dab10bf30bf.jpg', title: 'Alphaville', artist: 'Big in Japan' },
//   { id: 5, img: 'https://i.pinimg.com/736x/fa/62/3c/fa623c2875bd9ac93a1fe6c1482b21a7.jpg', title: 'Weeknd,Lily Rose', artist: 'One of the girls' },
//   { id: 6, img: 'https://i.pinimg.com/736x/4f/02/ec/4f02ec86a0cb37e6f64c319e9c874252.jpg', title: 'Taylor Swift', artist: 'Bejewelled' },
//   { id: 7, img: 'https://i.pinimg.com/736x/30/d0/1d/30d01d1bee3ba3657873a6d12a5878ce.jpg', title: 'Michael Jackson', artist: 'Earth Song' },
// ];

// const FEATURED_CARDS = [
//   { id: 1, img: 'https://i.pinimg.com/736x/fa/62/3c/fa623c2875bd9ac93a1fe6c1482b21a7.jpg', title: 'Featured 1', artist: 'Artist Name' },
//   { id: 2, img: 'https://i.pinimg.com/736x/4f/02/ec/4f02ec86a0cb37e6f64c319e9c874252.jpg', title: 'Featured 2', artist: 'Artist Name' },
//   { id: 3, img: 'https://i.pinimg.com/736x/30/d0/1d/30d01d1bee3ba3657873a6d12a5878ce.jpg', title: 'Featured 3', artist: 'Artist Name' },
//   { id: 4, img: 'https://i.pinimg.com/736x/44/d1/2d/44d12d66b8c91296e4786dab10bf30bf.jpg', title: 'Featured 4', artist: 'Artist Name' },
//   { id: 5, img: 'https://i.pinimg.com/736x/fa/62/3c/fa623c2875bd9ac93a1fe6c1482b21a7.jpg', title: 'Featured 5', artist: 'Artist Name' },
//   { id: 6, img: 'https://i.pinimg.com/736x/4f/02/ec/4f02ec86a0cb37e6f64c319e9c874252.jpg', title: 'Featured 6', artist: 'Artist Name' },
// ];

export function MainPage() {
  const [showRecentLeftArrow, setShowRecentLeftArrow] = useState(false);
  const [showMixesLeftArrow, setShowMixesLeftArrow] = useState(false);
  const [showFeaturedLeftArrow, setShowFeaturedLeftArrow] = useState(false);
  const recentRef = useRef(null);
  const mixesRef = useRef(null);
  const featuredRef = useRef(null);
  const [songs, setSongs] = useState([]);

const { playSong } = usePlayer();

useEffect(() => {
    async function loadSongs() {
        try {
            const data = await getSongs();
            setSongs(data);
        } catch (err) {
            console.error(err);
        }
    }

    loadSongs();
}, []);

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollLeft += 400;
    }
  };

  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollLeft -= 400;
    }
  };

  const MusicCard = ({ song }) => (
  <div
    className={styles.musicCard}
    onClick={() => playSong(song, songs)}
  >
    <img
      src={song.cover_url || placeholder}
      alt={song.title}
    />

    <h3>{song.title}</h3>

    <p>{song.artist}</p>
  </div>
);

  return (
    <div className={styles.mainContent}>
      <div className={styles.categoryButtons}>
        <button>All</button>
        <button>Music</button>
        <button>Podcasts</button>
      </div>

      <div className={styles.quickPicks}>
        {QUICK_PICKS.map(pick => (
          <div key={pick.id} className={styles.pickCard}>
            <img src={pick.img} alt={pick.label} />
            <span>{pick.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.sectionHeader}>
        <h2>Popular with listeners of Mahabharat</h2>
        <span>Show all</span>
      </div>
      <div className={styles.cardsRow}>
        {songs.slice(0, 3).map(song => (
    <MusicCard
        key={song.id}
        song={song}
    />
))}
      </div>

      <div className={styles.sectionHeader}>
        <h2>Recents</h2>
        <span>Show all</span>
      </div>
      <div className={styles.cardsContainer}>
        {showRecentLeftArrow && (
          <button className={styles.spotifyArrowLeft} onClick={() => { scrollLeft(recentRef); setShowRecentLeftArrow(false); }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <button className={styles.spotifyArrow} onClick={() => { scrollRight(recentRef); setShowRecentLeftArrow(true); }}>
          <ChevronRight size={20} />
        </button>
        <div className={styles.cardsRow} ref={recentRef}>
          {songs.slice(0, 7).map(song => (
    <MusicCard
        key={song.id}
        song={song}
    />
))}
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2>Your top mixes</h2>
        <span>Show all</span>
      </div>
      <div className={styles.cardsContainer}>
        {showMixesLeftArrow && (
          <button className={`${styles.spotifyArrowLeft} ${styles.mixesArrowLeft}`} onClick={() => { scrollLeft(mixesRef); setShowMixesLeftArrow(false); }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <button className={`${styles.spotifyArrow} ${styles.mixesArrow}`} onClick={() => { scrollRight(mixesRef); setShowMixesLeftArrow(true); }}>
          <ChevronRight size={20} />
        </button>
        <div className={styles.cardsRow} ref={mixesRef}>
          {songs.slice(2, 9).map(song => (
    <MusicCard
        key={song.id}
        song={song}
    />
))}
          </div>
          </div>

      <div className={styles.sectionHeader}>
        <h2>Featured now</h2>
        <span>Show all</span>
      </div>
      <div className={styles.cardsContainer}>
        {showFeaturedLeftArrow && (
          <button className={`${styles.spotifyArrowLeft} ${styles.featuredArrowLeft}`} onClick={() => { scrollLeft(featuredRef); setShowFeaturedLeftArrow(false); }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <button className={`${styles.spotifyArrow} ${styles.featuredArrow}`} onClick={() => { scrollRight(featuredRef); setShowFeaturedLeftArrow(true); }}>
          <ChevronRight size={20} />
        </button>
        <div className={styles.cardsRow} ref={featuredRef}>
         {songs.slice(1, 7).map(song => (
    <MusicCard
        key={song.id}
        song={song}
    />
))}
        </div>
      </div>
    </div>
  );
}
