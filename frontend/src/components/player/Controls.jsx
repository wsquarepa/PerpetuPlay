import PropTypes from "prop-types";

import PlayIcon from "../../assets/IconPlay.svg";
import PauseIcon from "../../assets/IconPause.svg";
import ForwardIcon from "../../assets/IconForward.svg";
import RewindIcon from "../../assets/IconRewind.svg";
import RepeatIcon from "../../assets/IconRepeat.svg";
import VolumeNoneIcon from "../../assets/IconVolumeNone.svg";
import VolumeLowIcon from "../../assets/IconVolumeLow.svg";
import VolumeHighIcon from "../../assets/IconVolumeHigh.svg";

import "./Controls.css";

function Controls({ isPlaying, volume }) {
    const sendCommand = async (command, data = {}) => {
        try {
            const response = await fetch("/api/media", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command, ...data }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("API Error:", error.error);
            } else {
                console.log("Command sent successfully");
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const handlePlayPause = () => {
        sendCommand("play", { state: isPlaying });
    };

    const handleRewind = () => {
        sendCommand("rewind");
    };

    const handleForward = () => {
        sendCommand("skip");
    };

    const handleRepeat = () => {
        sendCommand("repeat");
    };

    const handleVolumeChange = (newVolume) => {
        sendCommand("volume", { volume: newVolume });
    };

    return (
        <div className="controls">
            <button className="icon-button" onClick={handleRepeat}>
                <RepeatIcon className="icon" />
            </button>
            <button className="icon-button" onClick={handleRewind}>
                <RewindIcon className="icon" />
            </button>
            <button className="icon-button" onClick={handlePlayPause}>
                {isPlaying ? (
                    <PauseIcon className="icon" />
                ) : (
                    <PlayIcon className="icon" />
                )}
            </button>
            <button className="icon-button" onClick={handleForward}>
                <ForwardIcon className="icon" />
            </button>
            <button
                className="icon-button"
                onClick={() => handleVolumeChange(volume === 0 ? 50 : 0)}
            >
                {volume === 0 ? (
                    <VolumeNoneIcon className="icon" />
                ) : volume < 50 ? (
                    <VolumeLowIcon className="icon" />
                ) : (
                    <VolumeHighIcon className="icon" />
                )}
            </button>
        </div>
    );
}

Controls.propTypes = {
    isPlaying: PropTypes.bool.isRequired,
    volume: PropTypes.number.isRequired,
};

export default Controls;
