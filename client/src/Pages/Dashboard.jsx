import React from "react";
import useAuth from "../Hooks/useAuth.js";

function DashboardPage() {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = React.useState([]);

    React.useEffect(() => {
        fetch("/api/dashboard/watchlist", { credentials: "include" })
            .then(res => res.json())
            .then(data => setWatchlist(data.watchlist || []));
    }, []);

    return (
        <div style={styles.page}>
            <div style={styles.nav}>
                <h1 style={styles.title}>Welcome to the Tavern, {user.username}!</h1>
            </div>
            <div style={styles.content}>
                <div style={styles.card}>
                    <h2>Your Watchlist</h2>
                    {watchlist.length === 0 ? (
                        <p style={{ color: "#aaa", marginTop: "10px" }}>
                            It's quiet here. Search for some cards to add to your collection tracking.
                        </p>
                    ) : (
                        <ul style={{ marginTop: "15px", listStyle: "none", padding: 0 }}>
                            {watchlist.map(card => (
                                <li key={card.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee", color: "#333" }}>
                                    <strong>{card.name}</strong> - {card.set.toUpperCase()} ({card.price})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;

const styles = {
    page: {
        padding: "20px",
        fontFamily: "sans-serif",
    },
    nav: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        borderBottom: "1px solid #ccc",
        paddingBottom: "10px",
    },
    title: {
        fontSize: "1.5rem",
        margin: 0,
    },
    loading: {
        fontFamily: "sans-serif",
    },
    content: {
        marginTop: "20px",
    },
    card: {
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        maxWidth: "600px",
    },
};