import { useState } from 'react';
import PropTypes from 'prop-types';

import './Progress.css';

import sendCommand from "../../util/mediaControls";

function calculateMousePosition(event, progressBar) {
    const rect = progressBar.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const positionPercentage = (offsetX / rect.width) * 100;

    return positionPercentage;
}

function Progress({ current, total }) {
    const [tooltip, setTooltip] = useState({ visible: false, time: '' });

    const handleClick = (event) => {
        const clickedValue = (calculateMousePosition(event, event.currentTarget) / 100) * total;
        
        sendCommand("seek", { position: parseInt(clickedValue) });
    };

    const handleMouseMove = (event) => {
        const hoverValue = (calculateMousePosition(event, event.currentTarget) / 100) * total;

        const minutes = Math.floor(hoverValue / 60000);
        const seconds = Math.floor((hoverValue % 60000) / 1000);

        const time = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        const rect = event.currentTarget.getBoundingClientRect();
        setTooltip({ visible: true, time, x: event.clientX, y: rect.top - 20 });
    };

    const handleMouseLeave = () => {
        setTooltip({ visible: false, time: '' });
    };

    return (
        <>
            <div className="progress" onClick={handleClick} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <div className="progress-bar" style={{ width: `${(current / total) * 100}%` }} />
            </div>
            {tooltip.visible && (
                <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
                    {tooltip.time}
                </div>
            )}
        </>
    );
}

Progress.propTypes = {
    current: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
};

export default Progress;