import { useEffect, useState } from "react";
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

import sendCommand from "../../util/mediaControls";
import VolumeSlider from "./VolumeSlider";

function Controls({ isPlaying, volume, loop }) {
    const [isVolumePopupVisible, setVolumePopupVisible] = useState(false);
    const [currentVolume, setCurrentVolume] = useState(volume);

    useEffect(() => {
        setCurrentVolume(volume);
    }, [volume]);

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
        setCurrentVolume(newVolume);
    };

    const handleVolumeCommit = (newVolume) => {
        sendCommand("volume", { volume: newVolume });
    };

    const toggleVolumePopup = () => {
        setVolumePopupVisible(!isVolumePopupVisible);
    };

    return (
        <div className="controls">
            <button className={`icon-button ${loop ? "active" : ""}`} onClick={handleRepeat}>
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
            <div>
                {isVolumePopupVisible && (
                    <VolumeSlider
                        volume={currentVolume}
                        onVolumeChange={handleVolumeChange}
                        onVolumeCommit={handleVolumeCommit}
                    />
                )}
                <button className="icon-button" onClick={toggleVolumePopup}>
                    {currentVolume === 0 ? (
                        <VolumeNoneIcon className="icon" />
                    ) : currentVolume < 50 ? (
                        <VolumeLowIcon className="icon" />
                    ) : (
                        <VolumeHighIcon className="icon" />
                    )}
                </button>
            </div>
        </div>
    );
}

Controls.propTypes = {
    isPlaying: PropTypes.bool.isRequired,
    volume: PropTypes.number.isRequired,
    loop: PropTypes.bool.isRequired
};

export default Controls;
