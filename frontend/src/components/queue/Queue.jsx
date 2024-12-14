import { useState, useEffect } from 'react';

import Song from './Song';

import './Queue.css';

function Queue() {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

    async function fetchQueue(page = 1) {
        try {
            setIsFetchingNextPage(true);
            const response = await fetch('/api/queue?page=' + page);
            const data = await response.json();
            if (data.length > 0) {
                setSongs(prevSongs => [...prevSongs, ...data]);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error fetching queue:', error);
        } finally {
            setLoading(false);
            setIsFetchingNextPage(false);
        }
    }

    useEffect(() => {
        fetchQueue();
    }, []);

    function handleScroll(e) {
        const { scrollHeight, scrollTop, clientHeight } = e.target;
        if (scrollHeight - scrollTop === clientHeight && !isFetchingNextPage) {
            fetchQueue(currentPage + 1);
        }
    }

    return (
        <div className="queue">
            <h2>Queue</h2>
            <div className="queue-content" onScroll={handleScroll}>
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
        </div>
    );
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
}

export default Queue;
