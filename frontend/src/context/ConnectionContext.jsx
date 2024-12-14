import { createContext, useState } from "react";
import PropTypes from 'prop-types';

const ConnectionContext = createContext();

export function ConnectionProvider({ children }) {
    const [connected, setConnected] = useState(false);

    return (
        <ConnectionContext.Provider value={{ connected, setConnected }}>
            {children}
        </ConnectionContext.Provider>
    );
}

ConnectionProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export { ConnectionContext };