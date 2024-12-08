import PropTypes from 'prop-types';

import PlayIcon from '../../assets/Play.svg';
import PauseIcon from '../../assets/Pause.svg';
import ForwardIcon from '../../assets/Forward.svg';
import RewindIcon from '../../assets/Rewind.svg';
import RepeatIcon from '../../assets/Repeat.svg';
import VolumeNoneIcon from '../../assets/VolumeNone.svg';
import VolumeLowIcon from '../../assets/VolumeLow.svg';
import VolumeHighIcon from '../../assets/VolumeHigh.svg';

import './Controls.css';

function Controls({ isPlaying, volume }) {
    return (
        <div className="controls">
            <RepeatIcon className="icon" />
            <RewindIcon className="icon" />
            {isPlaying ? <PauseIcon className="icon" /> : <PlayIcon className="icon" />}
            <ForwardIcon className="icon" />
            {volume === 0 ? <VolumeNoneIcon className="icon" /> : volume < 50 ? <VolumeLowIcon className="icon" /> : <VolumeHighIcon className="icon" />}
        </div>
    );
}

Controls.propTypes = {
    isPlaying: PropTypes.bool.isRequired,
    volume: PropTypes.number.isRequired
};

export default Controls;