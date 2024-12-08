import { useEffect, useState, useRef } from "react";

import "./Player.css";

function Player() {
    const [stats, setStats] = useState(null);
    const [cover, setCover] = useState(null);
    const [progress, setProgress] = useState(0);

    const lastReportedTime = useRef(Date.now()); 

    useEffect(() => {
        const eventSource = new EventSource("/api/status");

        eventSource.addEventListener("identifier", (event) => {
            setCover(`/api/cover?f=${encodeURIComponent(JSON.parse(event.data).value)}`);
        });

        eventSource.addEventListener("title", (event) => {
            setStats((prev) => ({ ...prev, title: JSON.parse(event.data).value }));
        });

        eventSource.addEventListener("author", (event) => {
            setStats((prev) => ({ ...prev, author: JSON.parse(event.data).value }));
        });

        eventSource.addEventListener("length", (event) => {
            setStats((prev) => ({ ...prev, length: JSON.parse(event.data).value }));
        });

        eventSource.addEventListener("position", (event) => {
            setProgress(JSON.parse(event.data).value);
            setStats((prev) => ({ ...prev, position: JSON.parse(event.data).value }));

            lastReportedTime.current = Date.now();
        });

        eventSource.addEventListener("initialize", (event) => {
            const data = JSON.parse(event.data);

            setStats({
                title: data.title,
                author: data.author,
                length: data.length
            });

            setCover(`/api/cover?f=${encodeURIComponent(data.identifier)}`);

            lastReportedTime.current = Date.now();
            
            setProgress(data.position);
        });

        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (stats) {
                const elapsed = Date.now() - lastReportedTime.current; 
                const actualProgress = stats.position + elapsed;

                setProgress(Math.min(actualProgress, stats.length)); 
            }
        }, 100); 

        return () => {
            clearInterval(interval);
        };
    }, [stats]);

    return (
        <>
            <div className="player">
                <div className="display">
                    <div className="cover">
                        <img src={`${cover}`} alt="Cover" width={600} height={600} />
                    </div>
                    <div className="info">
                        <div className="title">{stats?.title}</div>
                        <div className="artist">{stats?.author}</div>
                    </div>
                </div>
            </div>
            <div className="bar">
                <div className="bar-fill" style={{ width: `${(progress / stats?.length) * 100}%` }} />
            </div>
        </>
    );
}

export default Player;
