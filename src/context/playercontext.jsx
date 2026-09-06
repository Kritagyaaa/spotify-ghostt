import {
    createContext,
    useContext,
    useRef,
    useState,
    useEffect,
} from "react";

import { getSongStream, toggleLikeSong } from "../services/api";
import { usePlaylists } from "./playlistcontext";

const playercontext = createContext();

export function PlayerProvider({ children }) {

    const { refreshSelectedPlaylist } = usePlaylists();

    const audioRef = useRef(new Audio());
    const pendingRestorationTimeRef = useRef(null);

    const [queue, setQueue] = useState([]);
    const [allSongs, setAllSongs] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [recentSongs, setRecentSongs] = useState([]);
    

    const [isPlaying, setIsPlaying] = useState(false);

    const [currentTime, setCurrentTime] = useState(0);

    const [duration, setDuration] = useState(0);

    const [volume, setVolumeState] = useState(0.20);

    const [isExpanded, setIsExpanded] = useState(false);

    const [isShuffle, setIsShuffle] = useState(() => localStorage.getItem('is_shuffle') === 'true');
    const [isRepeat, setIsRepeat] = useState(() => localStorage.getItem('is_repeat') === 'true');

    const [userQueue, setUserQueueState] = useState([]);
    const [lastContextSong, setLastContextSongState] = useState(null);

    const toggleExpand = () => {
        setIsExpanded(prev => !prev);
    };

    // Keep mutable refs of state to avoid stale closure issues in event listeners
    const queueRef = useRef([]);
    const currentSongRef = useRef(null);
    const isShuffleRef = useRef(localStorage.getItem('is_shuffle') === 'true');
    const isRepeatRef = useRef(localStorage.getItem('is_repeat') === 'true');
    const userQueueRef = useRef([]);
    const lastContextSongRef = useRef(null);

    const setUserQueue = (updatedQueue) => {
        setUserQueueState(updatedQueue);
        userQueueRef.current = updatedQueue;
        localStorage.setItem("user_queue", JSON.stringify(updatedQueue));
    };

    const setLastContextSong = (song) => {
        setLastContextSongState(song);
        lastContextSongRef.current = song;
        localStorage.setItem("last_context_song", JSON.stringify(song));
    };

    const toggleShuffle = () => {
        setIsShuffle(prev => {
            const next = !prev;
            isShuffleRef.current = next;
            localStorage.setItem('is_shuffle', next.toString());
            return next;
        });
    };

    const toggleRepeat = () => {
        setIsRepeat(prev => {
            const next = !prev;
            isRepeatRef.current = next;
            localStorage.setItem('is_repeat', next.toString());
            return next;
        });
    };

    useEffect(() => {

        const audio = audioRef.current;
        audio.volume = volume; // Start song at saved volume

        audio.ontimeupdate = () => {

            setCurrentTime(audio.currentTime);
            localStorage.setItem('playback_time', audio.currentTime.toString());

        };

        audio.onloadedmetadata = () => {

            setDuration(audio.duration);
            if (pendingRestorationTimeRef.current !== null) {
                const targetTime = Math.min(pendingRestorationTimeRef.current, audio.duration || Infinity);
                audio.currentTime = targetTime;
                pendingRestorationTimeRef.current = null;
            }

        };

        audio.onended = () => {

            if (isRepeatRef.current) {
                audio.currentTime = 0;
                audio.play().catch(err => console.error("Repeat play failed:", err));
            } else {
                nextSong();
            }

        };

        const stopPlayback = () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.src = "";
            }
            setIsPlaying(false);
            setCurrentSong(null);
            currentSongRef.current = null;
            setQueue([]);
            queueRef.current = [];
        };

        // Restore song, queue, and playback time from localStorage
        const restorePlayback = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                setIsPlaying(false);
                return;
            }

            try {
                const savedSongStr = localStorage.getItem('last_song');
                const savedQueueStr = localStorage.getItem('last_queue');
                const savedTimeStr = localStorage.getItem('playback_time');
                const savedUserQueueStr = localStorage.getItem('user_queue');
                const savedLastContextSongStr = localStorage.getItem('last_context_song');

                if (savedUserQueueStr) {
                    const savedUserQueue = JSON.parse(savedUserQueueStr);
                    setUserQueueState(savedUserQueue);
                    userQueueRef.current = savedUserQueue;
                }

                if (savedLastContextSongStr) {
                    const savedLastContextSong = JSON.parse(savedLastContextSongStr);
                    setLastContextSongState(savedLastContextSong);
                    lastContextSongRef.current = savedLastContextSong;
                }

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
                            pendingRestorationTimeRef.current = savedTime;
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
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("Playback blocked: User is not logged in.");
            stopPlayback();
            return;
        }

        try {
            pendingRestorationTimeRef.current = null;

            if (playlist.length > 0) {
                setQueue(playlist);
                queueRef.current = playlist;
                localStorage.setItem('last_queue', JSON.stringify(playlist));
                setLastContextSong(song);
            } else {
                const isInContext = queueRef.current.some(s => s.id === song.id);
                if (isInContext) {
                    setLastContextSong(song);
                }
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

       setRecentSongs((prev) => {

      const updated = [
        updatedSong.id,
        ...prev.filter((id) => id !== updatedSong.id),
         ].slice(0, 3);

           console.log("Recent Songs:", updated);

           return updated;

});
currentSongRef.current = updatedSong;
localStorage.setItem("last_song", JSON.stringify(updatedSong));

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
        const uq = userQueueRef.current;
        const q = queueRef.current;
        const curr = currentSongRef.current;

        console.log("========== NEXT ==========");
        console.log("User Queue:", uq);
        console.log("Playback Context Queue:", q);
        console.log("Current Song:", curr);

        if (uq.length > 0) {
            const nextFromUserQueue = uq[0];
            const updatedUserQueue = uq.slice(1);
            setUserQueue(updatedUserQueue);
            playSong(nextFromUserQueue);
            return;
        }

        if (!curr || q.length === 0) return;

        const refSong = q.some(s => s.id === curr.id) ? curr : lastContextSongRef.current;

        if (!refSong) {
            playSong(q[0], q);
            return;
        }

        if (isShuffleRef.current) {
            let randomIndex = Math.floor(Math.random() * q.length);
            if (q.length > 1) {
                while (q[randomIndex]?.id === refSong.id) {
                    randomIndex = Math.floor(Math.random() * q.length);
                }
            }
            playSong(q[randomIndex], q);
        } else {
            const index = q.findIndex(
                song => song.id === refSong.id
            );

            if (index === -1) {
                playSong(q[0], q);
                return;
            }

            if (index === q.length - 1) {
                if (isRepeatRef.current) {
                    playSong(q[0], q);
                } else {
                    setIsPlaying(false);
                    audioRef.current.pause();
                }
                return;
            }

            playSong(q[index + 1], q);
        }
    };

    const previousSong = () => {
        const q = queueRef.current;
        const curr = currentSongRef.current;

        if (!curr || q.length === 0) return;

        const isCurrentInContext = q.some(s => s.id === curr.id);
        if (!isCurrentInContext) {
            if (lastContextSongRef.current) {
                playSong(lastContextSongRef.current, q);
            } else {
                playSong(q[0], q);
            }
            return;
        }

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

    const toggleLike = async (songId) => {
        const id = (typeof songId === 'string' || typeof songId === 'number') ? songId : currentSong?.id;
        if (!id) return;
        try {
            const res = await toggleLikeSong(id);
            const isLikedVal = res.liked ? 1 : 0;
            
            // 1. Update currentSong state if it's the song being liked/unliked
            if (currentSongRef.current && currentSongRef.current.id === id) {
                setCurrentSong(prev => {
                    if (!prev) return null;
                    const updated = {
                        ...prev,
                        is_liked: isLikedVal,
                        like_count: res.liked ? (prev.like_count || 0) + 1 : Math.max(0, (prev.like_count || 0) - 1)
                    };
                    currentSongRef.current = updated;
                    localStorage.setItem('last_song', JSON.stringify(updated));
                    return updated;
                });
            }
            
            // 2. Update queue
            setQueue(prevQueue => {
                const updatedQueue = prevQueue.map(s => {
                    if (s.id === id) {
                        return {
                            ...s,
                            is_liked: isLikedVal,
                            like_count: res.liked ? (s.like_count || 0) + 1 : Math.max(0, (s.like_count || 0) - 1)
                        };
                    }
                    return s;
                });
                queueRef.current = updatedQueue;
                localStorage.setItem('last_queue', JSON.stringify(updatedQueue));
                return updatedQueue;
            });
            
            // 3. Dispatch a custom event to notify all other listeners
            window.dispatchEvent(new CustomEvent('song-liked-sync', { 
                detail: { songId: id, isLiked: isLikedVal } 
            }));
            
            return res.liked;
        } catch (err) {
            console.error("Failed to toggle like:", err);
            alert(err.message || "Please log in to like songs!");
        }
    };

    const selectSongWithoutPlaying = async (song) => {
        try {
            setCurrentSong(song);
            currentSongRef.current = song;
            localStorage.setItem('last_song', JSON.stringify(song));
            
            const streamUrl = await getSongStream(song.id);
            audioRef.current.src = streamUrl;
            audioRef.current.volume = volume;
            audioRef.current.load();
            setIsPlaying(false);
        } catch (err) {
            console.error("Error selecting default song:", err);
        }
    };

    const initializeQueue = (songs) => {
        setQueue(songs);
        queueRef.current = songs;
        localStorage.setItem('last_queue', JSON.stringify(songs));

        if (!currentSongRef.current && songs && songs.length > 0) {
            selectSongWithoutPlaying(songs[0]);
        }
    };

    const addToQueue = (song) => {
        if (!song) return;
        setQueue((prev) => {
            const exists = prev.some(s => s.id === song.id);
            if (exists) return prev;
            const updated = [...prev, song];
            queueRef.current = updated;
            localStorage.setItem('last_queue', JSON.stringify(updated));
            return updated;
        });
        // Silent: no alert when adding to queue
    };

    const addToUserQueue = (song) => {
        if (!song) return;
        const updated = [...userQueueRef.current, song];
        setUserQueue(updated);
    };

    const removeFromUserQueue = (indexToRemove) => {
        const updated = userQueueRef.current.filter((_, idx) => idx !== indexToRemove);
        setUserQueue(updated);
    };

    const reorderUserQueue = (startIndex, endIndex) => {
        const updated = [...userQueueRef.current];
        const [movedItem] = updated.splice(startIndex, 1);
        updated.splice(endIndex, 0, movedItem);
        setUserQueue(updated);
    };

    const clearUserQueue = () => {
        setUserQueue([]);
    };

    const stopPlayback = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setIsPlaying(false);
        setCurrentSong(null);
        currentSongRef.current = null;
        localStorage.removeItem('last_song');
        localStorage.removeItem('playback_time');
    };

    return (

        <playercontext.Provider
            value={{
                queue,
                currentSong,
                recentSongs,
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
                isShuffle,
                toggleShuffle,
                isRepeat,
                toggleRepeat,
                initializeQueue,
                addToQueue,
                userQueue,
                addToUserQueue,
                removeFromUserQueue,
                reorderUserQueue,
                clearUserQueue,
                setUserQueue,
                stopPlayback,
            }}
        >

            {children}

        </playercontext.Provider>

    );
}

export function usePlayer() {

    return useContext(playercontext);

}