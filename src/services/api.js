const API_URL = import.meta.env.VITE_API_URL;

export async function getSongs() {
    const response = await fetch(`${API_URL}/songs`);

    if (!response.ok) {
        throw new Error("Failed to fetch songs");
    }

    const data = await response.json();

    return data.songs;
}

export async function searchSongs(query) {

    const response = await fetch(
        `${API_URL}/songs/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
        throw new Error("Search failed");
    }

    const data = await response.json();

    return data.songs;
}

export async function getSongStream(songId) {
    const response = await fetch(
        `${API_URL}/songs/${songId}/stream`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch stream");
    }

    const data = await response.json();

    return data.streamUrl;
}