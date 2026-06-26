import {
    createContext,
    useContext,
    useRef,
    useState,
    useEffect,
} from "react";

import { getSongStream } from "../services/api";

const PlayerContext = createContext();

export function PlayerProvider({ children }) {

    const audioRef = useRef(new Audio());

    const [queue, setQueue] = useState([]);

    const [currentSong, setCurrentSong] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(-1);

    const [isPlaying, setIsPlaying] = useState(false);

    const [currentTime, setCurrentTime] = useState(0);

    const [duration, setDuration] = useState(0);

    useEffect(() => {

        const audio = audioRef.current;

        audio.ontimeupdate = () => {

            setCurrentTime(audio.currentTime);

        };

        audio.onloadedmetadata = () => {

            setDuration(audio.duration);

        };

        audio.onended = () => {

            nextSong();

        };

    }, []);

    const playSong = async (song, playlist = []) => {

        try {

            if (playlist.length > 0) {

                setQueue(playlist);

                setCurrentIndex(
                    playlist.findIndex((s) => s.id === song.id)
                );

            }

            const streamUrl = await getSongStream(song.id);

console.log("STREAM URL:", streamUrl);
            audioRef.current.src = streamUrl;

            await audioRef.current.play();

            setCurrentSong(song);

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

        if (currentIndex + 1 >= queue.length) return;

        playSong(queue[currentIndex + 1], queue);

    };

    const previousSong = () => {

        if (currentIndex <= 0) return;

        playSong(queue[currentIndex - 1], queue);

    };

    const seek = (value) => {

        audioRef.current.currentTime = value;

        setCurrentTime(value);

    };

    const setVolume = (value) => {

        audioRef.current.volume = value;

    };

    return (

        <PlayerContext.Provider
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
                setVolume,
            }}
        >

            {children}

        </PlayerContext.Provider>

    );
}

export function usePlayer() {

    return useContext(PlayerContext);

}