import { useEffect, useState } from "react";
import { usePlayer } from "../../context/PlayerContext";
import { getContentRecommendations } from "../../services/api";

export function RecommendationCard() {

    const { currentSong } = usePlayer();

    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        console.log("Current Song:", currentSong);
        if (!currentSong) return;

        async function loadRecommendations() {

            try {

                const data =
                    await getContentRecommendations(currentSong.id);
                    console.log("Recommendations:", data);

                setRecommendations(data);

            } catch (error) {

                console.error(error);

            }

        }

        loadRecommendations();

    }, [currentSong]);

    return (

        <section>

            <h3>Recommended Songs</h3>

            {recommendations.length === 0 ? (

                <p>No recommendations</p>

            ) : (

                recommendations.map((song) => (

                    <div key={song.id}>

                        <strong>{song.title}</strong>

                        <br />

                        <small>{song.artist}</small>

                    </div>

                ))

            )}

        </section>

    );

}