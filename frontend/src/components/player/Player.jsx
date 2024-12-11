import { useEffect, useState, useRef } from "react";
import { useConnection } from "../../context/connectionHandler";

import "./Player.css";
import Controls from "./Controls";

import NoImage from "../../assets/NoImage.png";

function Player() {
    const { setConnected } = useConnection();
    const [stats, setStats] = useState(null);
    const [cover, setCover] = useState(null);
    const [progress, setProgress] = useState(0);

    const lastReportedTime = useRef(Date.now());

    useEffect(() => {
        const eventSource = new EventSource("/api/status");

        eventSource.onopen = () => {
            setConnected(true);
        };

        eventSource.onerror = () => {
            setConnected(false);
        };

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

        eventSource.addEventListener("volume", (event) => {
            setStats((prev) => ({ ...prev, volume: JSON.parse(event.data).value }));
        });

        eventSource.addEventListener("paused", (event) => {
            setStats((prev) => ({ ...prev, paused: JSON.parse(event.data).value }));
        });

        eventSource.addEventListener("initialize", (event) => {
            const data = JSON.parse(event.data);

            setStats({
                title: data.title,
                author: data.author,
                length: data.length,
                position: data.position,
                volume: data.volume,
                paused: data.paused,
            });

            setCover(`/api/cover?f=${encodeURIComponent(data.identifier)}`);

            lastReportedTime.current = Date.now();
            setProgress(data.position);
        });

        return () => {
            eventSource.close();
        };
    }, [setConnected]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (stats) {
                if (stats.paused) {
                    setProgress(stats.position);
                    return;
                }

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
                        <img src={`${cover || NoImage}`} alt="Cover" width={400} height={400} />
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
            <Controls isPlaying={!stats?.paused} volume={stats?.volume || 100} />
        </>
    );
}

export default Player;
