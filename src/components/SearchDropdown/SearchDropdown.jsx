import { Search } from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";
import styles from "./SearchDropdown.module.css";

export function SearchDropdown({ results = [], visible, onClose }) {
    const { playSong } = usePlayer();

    if (!visible) return null;

    return (
        <div className={styles.dropdown}>
            {results.length === 0 ? (
                <div className={styles.empty}>No results found.</div>
            ) : (
                results.map((song) => (
                    <div
                        key={song.id}
                        className={styles.result}
                        onClick={() => {
                            playSong(song, results);
                            onClose();
                        }}
                    >
                        <img
                            src={song.cover_url || "https://placehold.co/55x55?text=Music"}
                            alt={song.title}
                            className={styles.cover}
                        />

                        <div className={styles.info}>
                            <div className={styles.title}>{song.title}</div>
                            <div className={styles.subtitle}>Song - {song.artist}</div>
                        </div>

                        <Search size={18} className={styles.icon} />
                    </div>
                ))
            )}
        </div>
    );
}
