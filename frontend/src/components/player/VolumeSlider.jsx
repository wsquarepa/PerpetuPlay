import PropTypes from "prop-types";
import { useState } from "react";
import "./VolumeSlider.css";

function VolumeSlider({ volume, onVolumeChange, onVolumeCommit }) {
    const [localVolume, setLocalVolume] = useState(volume);

    const handleSliderChange = (e) => {
        const newVolume = parseInt(e.target.value, 10);
        setLocalVolume(newVolume);
        onVolumeChange(newVolume);
    };

    const handleMouseUp = () => {
        onVolumeCommit(localVolume);
    };

    return (
        <div className="volume-slider">
            <div className="volume-display">{localVolume}</div>
            <input
                type="range"
                min="0"
                max="100"
                value={localVolume}
                onChange={handleSliderChange}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                className="slider vertical"
            />
        </div>
    );
}

VolumeSlider.propTypes = {
    volume: PropTypes.number.isRequired,
    onVolumeChange: PropTypes.func.isRequired,
    onVolumeCommit: PropTypes.func.isRequired,
};

export default VolumeSlider;
