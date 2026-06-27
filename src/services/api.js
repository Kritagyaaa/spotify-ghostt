const API_URL = import.meta.env.VITE_API_URL;

export async function getSongs() {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/songs`, { headers });

    if (!response.ok) {
        throw new Error("Failed to fetch songs");
    }

    const data = await response.json();

    return data.songs;
}

export async function searchSongs(query, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_URL}/songs/search?q=${encodeURIComponent(query)}`,
        {
            ...options,
            headers
        }
    );

    if (!response.ok) {
        throw new Error("Search failed");
    }

    const data = await response.json();

    return Array.isArray(data.songs) ? data.songs : [];
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

export async function getContentRecommendations(songId) {

    const response = await fetch(`${API_URL}/recommend/content/${songId}`);

    if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
    }

    const data = await response.json();

    return data.recommendations;
}

export async function toggleLikeSong(songId) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Unauthorized: Please log in first.");

    const response = await fetch(`${API_URL}/songs/${songId}/like`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to toggle like");
    }

    return await response.json();
}
