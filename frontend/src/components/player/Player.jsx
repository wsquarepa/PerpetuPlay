import { useEffect, useState } from "react";

import "./Player.css";

function Player() {
    const [stats, setStats] = useState(null);
    const [cover, setCover] = useState(null);
    const [progress, setProgress] = useState(stats?.track.position);

    useEffect(() => {
        let oldIdentifier = null;
        let lastReportedPosition = 0;

        const eventSource = new EventSource("/api/status");
        eventSource.onmessage = async (event) => {
            const newStats = JSON.parse(event.data);

            if (newStats.track.identifier != oldIdentifier) {
                setCover(`/api/cover?f=${encodeURIComponent(newStats.track.identifier)}`);

                oldIdentifier = newStats.track.identifier;
            }

            setStats(newStats);

            if (newStats.track.position != lastReportedPosition) {            
                setProgress(newStats.track.position);

                lastReportedPosition = newStats.track.position;
            }
        };

        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 100, stats?.track.length));
        }, 100);

        return () => {
            clearInterval(interval);
        }
    });

    return (
        <>
            <div className="player">
                <div className="display">
                    <div className="cover">
                        <img src={`${cover}`} alt="Cover" width={600} height={600} />
                    </div>
                    <div className="info">
                        <div className="title">{stats?.track.title}</div>
                        <div className="artist">{stats?.track.author}</div>
                    </div>
                </div>
            </div>
            <div className="bar">
                <div className="bar-fill" style={{ width: `${(progress / stats?.track.length) * 100}%` }} />
            </div>
        </>
    );
}

export default Player;