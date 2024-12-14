
import { useContext } from "react";

import { ConnectionContext } from "../context/ConnectionContext";

export function useConnection() {
    return useContext(ConnectionContext);
}