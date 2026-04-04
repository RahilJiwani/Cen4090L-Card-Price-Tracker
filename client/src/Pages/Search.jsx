import React, { useState } from "react";

function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [watchlist, setWatchlist] = useState(new Set());

    const handleSearch = (e) => {
        e.preventDefault();
        // allow searching by just filter, or require some query
        if (!searchQuery.trim() && filterType === "All") return;

        setIsSearching(true);
        setError(null);

        // mock api call for testing
        setTimeout(() => {
            if (searchQuery.toLowerCase() === "error") {
                setError("The magical leyline was disrupted. Please try again.");
                setResults([]);
                setIsSearching(false);
                return;
            }

            // mock database to test the filters
            const mockDatabase = [
                { id: 1, name: "Black Lotus", set: "Limited Edition Alpha", type: "Artifact", manaCost: "{0}", price: "$30,000.00", imageUrl: "https://via.placeholder.com/146x204/2c241b/d4af37?text=Black+Lotus" },
                { id: 2, name: "Mox Sapphire", set: "Limited Edition Beta", type: "Artifact", manaCost: "{0}", price: "$6,500.00", imageUrl: "https://via.placeholder.com/146x204/1a5b8c/d4af37?text=Mox+Sapphire" },
                { id: 3, name: "Tarmogoyf", set: "Future Sight", type: "Creature — Lhurgoyf", manaCost: "{1}{G}", price: "$15.50", imageUrl: "https://via.placeholder.com/146x204/2e6b3b/d4af37?text=Tarmogoyf" },
                { id: 4, name: "Lightning Bolt", set: "Limited Edition Alpha", type: "Instant", manaCost: "{R}", price: "$2.50", imageUrl: "https://via.placeholder.com/146x204/c23b22/d4af37?text=Lightning+Bolt" },
                { id: 5, name: "Birds of Paradise", set: "Limited Edition Alpha", type: "Creature — Bird", manaCost: "{G}", price: "$12.00", imageUrl: "https://via.placeholder.com/146x204/2e6b3b/d4af37?text=Birds" },
                { id: 6, name: "Wrath of God", set: "Limited Edition Alpha", type: "Sorcery", manaCost: "{2}{W}{W}", price: "$14.00", imageUrl: "https://via.placeholder.com/146x204/f4eedd/2c241b?text=Wrath+of+God" }
            ];

            let filteredCards = mockDatabase;
            if (searchQuery.trim()) {
                filteredCards = filteredCards.filter(card =>
                    card.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            if (filterType !== "All") {
                filteredCards = filteredCards.filter(card =>
                    card.type.includes(filterType)
                );
            }

            setResults(filteredCards);
            setIsSearching(false);
        }, 800);
    };

    const toggleWatchlist = (cardId) => {
        setWatchlist((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(cardId)) {
                newSet.delete(cardId);
            } else {
                newSet.add(cardId);
            }
            return newSet;
        });
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <h1 style={styles.title}>Grimoire Search</h1>

                <form onSubmit={handleSearch} style={styles.searchForm}>
                    <input
                        style={styles.searchInput}
                        type="text"
                        placeholder="Search the multiverse (e.g. Black Lotus)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <select
                        style={styles.filterSelect}
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="Creature">Creature</option>
                        <option value="Artifact">Artifact</option>
                        <option value="Instant">Instant</option>
                        <option value="Sorcery">Sorcery</option>
                        <option value="Planeswalker">Planeswalker</option>
                        <option value="Land">Land</option>
                    </select>

                    <button type="submit" style={styles.button} disabled={isSearching}>
                        {isSearching ? "Scrying..." : "Search"}
                    </button>
                </form>

                {error && (
                    <div style={styles.errorBanner}>
                        <strong>Disruption:</strong> {error}
                    </div>
                )}

                <div style={styles.resultsContainer}>
                    {isSearching ? (
                        <p style={styles.loadingText}>Channeling mana to fetch cards...</p>
                    ) : results.length > 0 ? (
                        results.map((card) => {
                            const isWatched = watchlist.has(card.id);
                            return (
                                <div key={card.id} style={styles.card}>
                                    <div style={styles.cardContent}>
                                        <img
                                            src={card.imageUrl}
                                            alt={card.name}
                                            style={styles.cardImage}
                                        />
                                        <div style={styles.cardDetails}>
                                            <div style={styles.cardHeader}>
                                                <h3 style={styles.cardName}>{card.name}</h3>
                                                <span style={styles.manaCost}>{card.manaCost}</span>
                                            </div>
                                            <p style={styles.cardType}>{card.type}</p>
                                            <p style={styles.cardSet}>{card.set}</p>
                                        </div>
                                    </div>
                                    <div style={styles.actionContainer}>
                                        <span style={styles.price}>{card.price}</span>
                                        <button
                                            style={{
                                                ...styles.trackButton,
                                                backgroundColor: isWatched ? "#8a2be2" : "#2e6b3b", 
                                                border: isWatched ? "1px solid #4a148c" : "1px solid #1b4d26"
                                            }}
                                            onClick={() => toggleWatchlist(card.id)}
                                        >
                                            {isWatched ? "− Unbind" : "+ Watchlist"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        (searchQuery || filterType !== "All") && !error ? (
                            <div style={styles.emptyState}>
                                <p style={styles.emptyStateTitle}>No cards found.</p>
                                <p style={styles.emptyStateText}>The spell fizzled. Try adjusting your search terms or filters.</p>
                            </div>
                        ) : (
                            <div style={styles.emptyState}>
                                <p style={styles.emptyStateText}>Enter a card name or select a type to search the database.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default SearchPage;

const styles = {
    page: {
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#1b1c20", 
        minHeight: "100vh",
        color: "#e0e0e0"
    },
    container: {
        maxWidth: "850px",
        margin: "0 auto",
    },
    title: {
        fontSize: "2.2rem",
        marginBottom: "1.5rem",
        color: "#d4af37", 
        fontFamily: "Georgia, serif", 
        letterSpacing: "1px",
        textShadow: "1px 1px 2px #000"
    },
    searchForm: {
        display: "flex",
        gap: "12px",
        marginBottom: "25px",
        flexWrap: "wrap" 
    },
    searchInput: {
        flex: 2,
        minWidth: "250px",
        padding: "14px",
        border: "1px solid #d4af37",
        borderRadius: "4px",
        fontSize: "1rem",
        backgroundColor: "#2a2d34",
        color: "#fff",
        outline: "none"
    },
    filterSelect: {
        flex: 1,
        minWidth: "150px",
        padding: "14px",
        border: "1px solid #d4af37",
        borderRadius: "4px",
        fontSize: "1rem",
        backgroundColor: "#2a2d34",
        color: "#fff",
        cursor: "pointer",
        outline: "none"
    },
    button: {
        padding: "14px 28px",
        cursor: "pointer",
        backgroundColor: "#1a5b8c", 
        color: "#fff",
        border: "1px solid #0f3959",
        borderRadius: "4px",
        fontWeight: "bold",
        fontSize: "1rem",
        fontFamily: "Georgia, serif",
        textTransform: "uppercase",
        letterSpacing: "1px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
    },
    errorBanner: {
        padding: "15px",
        backgroundColor: "#3b1a1a",
        border: "1px solid #c23b22", 
        color: "#ff8a8a",
        borderRadius: "4px",
        marginBottom: "20px",
        fontFamily: "Georgia, serif"
    },
    resultsContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    loadingText: {
        textAlign: "center",
        color: "#d4af37",
        fontStyle: "italic",
        padding: "30px",
        fontFamily: "Georgia, serif"
    },
    card: {
        padding: "15px",
        border: "2px solid #2c241b", 
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f4eedd", 
        color: "#111", 
        boxShadow: "0 4px 8px rgba(0,0,0,0.4)"
    },
    cardContent: {
        display: "flex",
        gap: "15px",
        alignItems: "center"
    },
    cardImage: {
        width: "73px",
        height: "102px",
        borderRadius: "4px",
        objectFit: "cover",
        border: "1px solid #000"
    },
    cardDetails: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
    },
    cardHeader: {
        display: "flex",
        alignItems: "baseline",
        gap: "10px",
        marginBottom: "2px"
    },
    cardName: {
        margin: 0,
        fontSize: "1.3rem",
        fontWeight: "bold",
        fontFamily: "Georgia, serif", 
        color: "#000"
    },
    manaCost: {
        fontWeight: "bold",
        color: "#333",
        fontSize: "0.95rem",
        backgroundColor: "#ddd", 
        padding: "2px 6px",
        borderRadius: "12px",
        letterSpacing: "1px"
    },
    cardType: {
        margin: "0 0 6px 0",
        fontWeight: "600",
        color: "#2c241b",
        fontSize: "0.95rem"
    },
    cardSet: {
        margin: 0,
        color: "#555",
        fontSize: "0.85rem",
        fontStyle: "italic"
    },
    actionContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "12px"
    },
    price: {
        fontWeight: "bold",
        fontSize: "1.4rem",
        color: "#000",
        fontFamily: "Georgia, serif"
    },
    trackButton: {
        padding: "10px 16px",
        cursor: "pointer",
        color: "white",
        borderRadius: "4px",
        fontWeight: "bold",
        width: "130px",
        fontFamily: "Georgia, serif",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
    },
    emptyState: {
        textAlign: "center",
        padding: "50px 20px",
        backgroundColor: "#2a2d34",
        borderRadius: "8px",
        border: "1px solid #444",
        color: "#aaa"
    },
    emptyStateTitle: {
        color: "#d4af37",
        fontSize: "1.2rem",
        fontFamily: "Georgia, serif",
        margin: "0 0 10px 0"
    },
    emptyStateText: {
        margin: 0,
        fontStyle: "italic"
    }
};