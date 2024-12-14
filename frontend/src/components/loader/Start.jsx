import "./Start.css";

import Logo from "../../assets/Logo.png";
import LoaderIcon from "../../assets/IconLoader.svg";

function Start() {
    return (
        <>
            <div className="loader">
                <img src={Logo} alt="Logo" className="logo" />
                <p>Connecting to server...</p>
                <LoaderIcon className="loader-icon" />
            </div>
        </>
    );
}

export default Start;
