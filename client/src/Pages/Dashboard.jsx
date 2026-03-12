import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function DashboardPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function fetchUser() {
            try {
                const res = await fetch("/api/auth/me", { credentials: "include" });
                if (!res.ok) {
                    if (res.status === 401) {
                        navigate("/login", { replace: true });
                    }
                    return;
                }
                const data = await res.json();
                if (mounted) {
                    setUser(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to authenticate session", err);
                if (mounted) navigate("/login", { replace: true });
            }
        }

        fetchUser();

        return () => {
            mounted = false;
        };
    }, [navigate]);

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
            navigate("/login");
        } catch (err) {
            console.error("Failed to logout", err);
        }
    }

    if (loading) {
        return (
            <div style={styles.page}>
                <h2 style={styles.loading}>Loading Scryfall data...</h2>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.nav}>
                <h1 style={styles.title}>Welcome to the Tavern, {user.username}!</h1>
                <button style={styles.logoutBtn} onClick={handleLogout}>
                    Log Out
                </button>
            </div>
            <div style={styles.content}>
                <div style={styles.card}>
                    <h2>Your Watchlist</h2>
                    <p style={{ color: "#aaa", marginTop: "10px" }}>
                        It's quiet here. Search for some cards to add to your collection tracking.
                    </p>
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
    logoutBtn: {
        padding: "6px 12px",
        cursor: "pointer",
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