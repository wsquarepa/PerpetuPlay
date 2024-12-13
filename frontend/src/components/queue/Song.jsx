import PropTypes from 'prop-types';

import './Song.css';

function Song({ title, artist, duration }) {
    return (
        <div className="song">
            <div className="song-info">
                <span className="title">{title}</span>
                <span className="artist">{artist}</span>
            </div>
            <span className="duration">{duration}</span>
        </div>
    );
}

Song.propTypes = {
    title: PropTypes.string.isRequired,
    artist: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired
};

export default Song;