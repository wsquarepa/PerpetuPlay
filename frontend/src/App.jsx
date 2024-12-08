import Content from "./components/Content";
import "./App.css";

import { useEffect } from "react";

function App() {
    useEffect(() => {
        fetch("/api/")
            .then((response) => {
                if (response.status === 401) {
                    window.location.href = "/auth";
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }, []);

    return (
        <>
            <Content />
        </>
    );
}

export default App;
