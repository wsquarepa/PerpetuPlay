import { useState, useEffect } from 'react';

import Song from './Song';

import './Queue.css';

function Queue() {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchQueue() {
            try {
                const response = await fetch('/api/queue');
                const data = await response.json();
                setSongs(data);
            } catch (error) {
                console.error('Error fetching queue:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchQueue();
    }, []);

    return (
        <div className="queue">
            <h2>Queue</h2>
            {loading ? (
                <p>Loading...</p>
            ) : songs.length > 0 ? (
                songs.map((song, index) => (
                    <Song
                        key={index}
                        title={song.title}
                        artist={song.artists.join(', ')}
                        duration={formatDuration(song.duration)}
                    />
                ))
            ) : (
                <p>No songs in the queue.</p>
            )}
        </div>
    );
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
}

export default Queue;
