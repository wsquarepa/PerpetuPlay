export default async function (command, data = {}) {
    try {
        const response = await fetch("/api/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command, ...data }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("API Error:", error.error);
        } else {
            console.log("Command sent successfully");
        }
    } catch (error) {
        console.error("Network error:", error);
    }
};