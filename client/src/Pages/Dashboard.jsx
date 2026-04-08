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

    const handleRemoveCard = async (cardId) => {
        try {
            const response = await fetch(`/api/dashboard/watchlist/${cardId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (response.ok) {
                setWatchlist(prevWatchlist => prevWatchlist.filter(card => card.id !== cardId));
            } else {
                console.error("Failed to remove card from backend");
            }
        } catch (error) {
            console.error("Error occurred while removing the card:", error);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.nav}>
                <h1 style={styles.title}>Welcome to the Tavern, {user?.username || "Planeswalker"}!</h1>
                <p style={styles.subtitle}>Your tracked artifacts and spells</p>
            </div>

            <div style={styles.content}>
                <div style={styles.mainContainer}>
                    <div style={styles.headerRow}>
                        <h2 style={styles.sectionTitle}>Your Grimoire (Watchlist)</h2>
                        <span style={styles.cardCount}>{watchlist.length} Cards</span>
                    </div>

                    {watchlist.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p style={styles.emptyText}>Your grimoire is empty.</p>
                            <p style={styles.emptySubtext}>Journey to the Search page to gather spells for your collection.</p>
                        </div>
                    ) : (
                        <div style={styles.cardGrid}>
                            {watchlist.map(card => (
                                <div key={card.id} style={styles.mtgCard}>
                                    <div style={styles.cardHeader}>
                                        <strong style={styles.cardName}>{card.name}</strong>
                                    </div>

                                    <div style={styles.artPlaceholder}>
                                        {card.imageUrl ? (
                                            <img
                                                src={card.imageUrl}
                                                alt={card.name}
                                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "2px" }}
                                            />
                                        ) : (
                                            <span style={styles.manaSymbol}>✧</span>
                                        )}
                                    </div>

                                    <div style={styles.typeLine}>
                                        <span>{card.type || "Artifact / Spell"}</span>
                                        <span style={styles.setSymbol}>{card.set.toUpperCase()}</span>
                                    </div>

                                    <div style={styles.cardTextBox}>
                                        <div style={styles.priceTag}>
                                            Market Value: <br />
                                            <span style={styles.priceValue}>{card.price}</span>
                                        </div>
                                    </div>

                                    <div style={styles.cardFooter}>
                                        <button
                                            style={styles.removeButton}
                                            onClick={() => handleRemoveCard(card.id)}
                                            onMouseOver={(e) => {
                                                e.target.style.backgroundColor = "#7a2222";
                                                e.target.style.boxShadow = "0 0 8px #ff4444";
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.backgroundColor = "#5c1b1b";
                                                e.target.style.boxShadow = "none";
                                            }}
                                        >
                                            Exile Card
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;

// MTG Dark Fantasy Theme Styles
const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#161514", // Deep slate/black
        backgroundImage: "radial-gradient(circle at center, #2e2a26 0%, #100f0e 100%)",
        color: "#eaddc5", // Parchment tone
        fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif", // Beleren-esque fallback
        padding: "40px 20px",
    },
    nav: {
        maxWidth: "1000px",
        margin: "0 auto 30px auto",
        paddingBottom: "20px",
        borderBottom: "2px solid #d4af37", // Gold accent
        textAlign: "center",
    },
    title: {
        fontSize: "2.8rem",
        margin: "0 0 10px 0",
        fontWeight: "normal",
        color: "#f5e6c3",
        textShadow: "2px 2px 4px #000000",
        letterSpacing: "1px",
    },
    subtitle: {
        color: "#a39784",
        fontSize: "1.2rem",
        margin: 0,
        fontStyle: "italic",
    },
    content: {
        maxWidth: "1000px",
        margin: "0 auto",
    },
    mainContainer: {
        backgroundColor: "rgba(30, 28, 26, 0.85)", // Translucent dark brown
        border: "2px solid #5a4e3a",
        borderRadius: "8px",
        padding: "30px",
        boxShadow: "inset 0 0 20px #000000, 0 8px 16px rgba(0,0,0,0.6)",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        borderBottom: "1px solid #3d3528",
        paddingBottom: "10px",
    },
    sectionTitle: {
        fontSize: "1.8rem",
        margin: 0,
        fontWeight: "normal",
        color: "#d4af37",
    },
    cardCount: {
        backgroundColor: "#2c2824",
        border: "1px solid #8e7a54",
        padding: "5px 12px",
        borderRadius: "4px",
        fontSize: "1rem",
        color: "#eaddc5",
    },
    emptyState: {
        textAlign: "center",
        padding: "50px 20px",
    },
    emptyText: {
        fontSize: "1.4rem",
        color: "#a39784",
        marginBottom: "10px",
    },
    emptySubtext: {
        fontSize: "1.1rem",
        color: "#6e6556",
    },
    // The Grid Layout
    cardGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "25px",
    },
    // Individual "MTG" Card Styling
    mtgCard: {
        backgroundColor: "#1c1b1a", // Inner dark border
        border: "8px solid #000000", // Outer black border of an MTG card
        borderRadius: "12px",
        padding: "4px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 6px 12px rgba(0,0,0,0.8)",
        transition: "transform 0.2s ease",
    },
    cardHeader: {
        backgroundColor: "#c2b8a3", // Light parchment frame
        border: "1px solid #8a8273",
        borderRadius: "4px",
        padding: "6px 8px",
        marginBottom: "4px",
        boxShadow: "inset 0 0 6px rgba(0,0,0,0.3)",
    },
    cardName: {
        color: "#1a1a1a", // Dark ink
        fontSize: "1rem",
        fontWeight: "bold",
        letterSpacing: "0.5px",
    },
    artPlaceholder: {
        height: "120px",
        backgroundColor: "#2a2a2a",
        border: "2px solid #555",
        borderRadius: "2px",
        marginBottom: "4px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "inset 0 0 15px #000",
    },
    manaSymbol: {
        fontSize: "2rem",
        color: "#555",
    },
    typeLine: {
        backgroundColor: "#c2b8a3",
        border: "1px solid #8a8273",
        borderRadius: "4px",
        padding: "4px 8px",
        marginBottom: "4px",
        fontSize: "0.8rem",
        fontWeight: "bold",
        color: "#1a1a1a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "inset 0 0 6px rgba(0,0,0,0.3)",
    },
    setSymbol: {
        fontSize: "0.9rem",
    },
    cardTextBox: {
        backgroundColor: "#dfd6c5", // Text box parchment
        border: "1px solid #8a8273",
        borderRadius: "4px",
        padding: "15px 10px",
        flexGrow: 1,
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
    },
    priceTag: {
        color: "#1a1a1a",
        fontSize: "0.9rem",
    },
    priceValue: {
        fontSize: "1.4rem",
        fontWeight: "bold",
        color: "#2b8a3e", // Slightly green to denote money/value
        marginTop: "5px",
        display: "block",
    },
    cardFooter: {
        marginTop: "8px",
        textAlign: "center",
    },
    removeButton: {
        width: "100%",
        backgroundColor: "#5c1b1b", // Rakdos/Red removal spell vibes
        color: "#f5e6c3",
        border: "1px solid #8e7a54",
        borderRadius: "4px",
        padding: "8px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: "bold",
        fontSize: "0.9rem",
        textTransform: "uppercase",
        letterSpacing: "1px",
        transition: "all 0.2s ease",
    }
};