import Content from "./components/Content";
import Start from "./components/loader/Start";
import { useEffect } from "react";
import { useConnection } from "./context/connectionHandler";

import "./App.css";

function App() {
    const { connected } = useConnection();

    useEffect(() => {
        fetch("/api/")
            .then((response) => {
                if (response.status === 401) {
                    location.assign("/auth/");
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }, []);

    return (
        <>
            {!connected && <Start />}
            <Content />
        </>
    );
}

export default App;