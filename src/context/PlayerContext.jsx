import {
    createContext,
    useContext,
    useRef,
    useState,
    useEffect,
} from "react";

import { getSongStream, toggleLikeSong } from "../services/api";

const playercontext = createContext();

export function PlayerProvider({ children }) {

    const audioRef = useRef(new Audio());

    const [queue, setQueue] = useState([]);

    const [currentSong, setCurrentSong] = useState(null);

    const [isPlaying, setIsPlaying] = useState(false);

    const [currentTime, setCurrentTime] = useState(0);

    const [duration, setDuration] = useState(0);

    const [volume, setVolumeState] = useState(0.20);

    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(prev => !prev);
    };

    // Keep mutable refs of state to avoid stale closure issues in event listeners
    const queueRef = useRef([]);
    const currentSongRef = useRef(null);

    useEffect(() => {

        const audio = audioRef.current;
        audio.volume = volume; // Start song at saved volume

        audio.ontimeupdate = () => {

            setCurrentTime(audio.currentTime);
            localStorage.setItem('playback_time', audio.currentTime.toString());

        };

        audio.onloadedmetadata = () => {

            setDuration(audio.duration);

        };

        audio.onended = () => {

            nextSong();

        };

        // Restore song, queue, and playback time from localStorage
        const restorePlayback = async () => {
            try {
                const savedSongStr = localStorage.getItem('last_song');
                const savedQueueStr = localStorage.getItem('last_queue');
                const savedTimeStr = localStorage.getItem('playback_time');

                if (savedSongStr) {
                    const savedSong = JSON.parse(savedSongStr);
                    setCurrentSong(savedSong);
                    currentSongRef.current = savedSong;

                    if (savedQueueStr) {
                        const savedQueue = JSON.parse(savedQueueStr);
                        setQueue(savedQueue);
                        queueRef.current = savedQueue;
                    }

                    // Get stream URL and load it
                    const streamUrl = await getSongStream(savedSong.id);
                    audio.src = streamUrl;
                    audio.volume = volume;

                    if (savedTimeStr) {
                        const savedTime = parseFloat(savedTimeStr);
                        if (!isNaN(savedTime)) {
                            audio.currentTime = savedTime;
                            setCurrentTime(savedTime);
                        }
                    }

                    // Attempt autoplay on restore
                    try {
                        await audio.play();
                        setIsPlaying(true);
                    } catch (playError) {
                        console.warn("Autoplay blocked by browser. Song loaded in paused state.", playError);
                        setIsPlaying(false);
                    }
                }
            } catch (err) {
                console.error("Error restoring playback:", err);
            }
        };

        restorePlayback();

    }, []);

    const playSong = async (song, playlist = []) => {

        try {

            if (playlist.length > 0) {
                setQueue(playlist);
                queueRef.current = playlist;
                localStorage.setItem('last_queue', JSON.stringify(playlist));
            }

            const streamUrl = await getSongStream(song.id);

            console.log("STREAM URL:", streamUrl);
            audioRef.current.src = streamUrl;
            audioRef.current.volume = volume;

            await audioRef.current.play();

            const updatedSong = {
                ...song,
                play_count: (song.play_count || 0) + 1
            };

            // Locally increment play count for immediate feedback
            setCurrentSong(updatedSong);
            currentSongRef.current = updatedSong;
            localStorage.setItem('last_song', JSON.stringify(updatedSong));

            setIsPlaying(true);

        } catch (err) {

            console.error(err);

        }

    };

    const togglePlay = () => {

        if (!currentSong) return;

        if (audioRef.current.paused) {

            audioRef.current.play();

            setIsPlaying(true);

        } else {

            audioRef.current.pause();

            setIsPlaying(false);

        }

    };

    const nextSong = () => {

        const q = queueRef.current;
        const curr = currentSongRef.current;

        console.log("========== NEXT ==========");
        console.log("Queue:", q);
        console.log("Current Song:", curr);

        if (!curr) return;

        const index = q.findIndex(
            song => song.id === curr.id
        );

        console.log("Index:", index);

        if (index === -1) return;

        if (index === q.length - 1) return;

        playSong(q[index + 1], q);
    };

    const previousSong = () => {

        const q = queueRef.current;
        const curr = currentSongRef.current;

        if (!curr || q.length === 0) return;

        const index = q.findIndex(
            song => song.id === curr.id
        );

        if (index <= 0) return;

        playSong(q[index - 1], q);

    };

    const seek = (value) => {

        audioRef.current.currentTime = value;

        setCurrentTime(value);

    };

    const setVolume = (value) => {

        audioRef.current.volume = value;
        setVolumeState(value);

    };

    const toggleLike = async () => {
        if (!currentSong) return;
        try {
            const res = await toggleLikeSong(currentSong.id);
            setCurrentSong(prev => {
                if (!prev) return null;
                const updated = {
                    ...prev,
                    is_liked: res.liked ? 1 : 0,
                    like_count: res.liked ? (prev.like_count || 0) + 1 : Math.max(0, (prev.like_count || 0) - 1)
                };
                currentSongRef.current = updated;
                localStorage.setItem('last_song', JSON.stringify(updated));
                return updated;
            });
            // Update in queue
            setQueue(prevQueue => {
                const updatedQueue = prevQueue.map(s => {
                    if (s.id === currentSongRef.current?.id) {
                        return {
                            ...s,
                            is_liked: res.liked ? 1 : 0,
                            like_count: res.liked ? (s.like_count || 0) + 1 : Math.max(0, (s.like_count || 0) - 1)
                        };
                    }
                    return s;
                });
                queueRef.current = updatedQueue;
                localStorage.setItem('last_queue', JSON.stringify(updatedQueue));
                return updatedQueue;
            });
        } catch (err) {
            console.error("Failed to toggle like:", err);
            alert(err.message || "Please log in to like songs!");
        }
    };

    return (

        <playercontext.Provider
            value={{
                queue,
                currentSong,
                isPlaying,
                currentTime,
                duration,
                playSong,
                togglePlay,
                nextSong,
                previousSong,
                seek,
                volume,
                setVolume,
                toggleLike,
                isExpanded,
                toggleExpand,
            }}
        >

            {children}

        </playercontext.Provider>

    );
}

export function usePlayer() {

    return useContext(playercontext);

}