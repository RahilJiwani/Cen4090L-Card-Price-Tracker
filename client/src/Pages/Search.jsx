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
        <div className="search-legacy-page">
            <div className="search-legacy-container">
                <h1 className="search-legacy-title">Grimoire Search</h1>

                <form onSubmit={handleSearch} className="search-legacy-search-form">
                    <input
                        className="search-legacy-search-input"
                        type="text"
                        placeholder="Search the multiverse (e.g. Black Lotus)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <select
                        className="search-legacy-filter-select"
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

                    <button type="submit" className="search-legacy-button" disabled={isSearching}>
                        {isSearching ? "Scrying..." : "Search"}
                    </button>
                </form>

                {error && (
                    <div className="search-legacy-error-banner">
                        <strong>Disruption:</strong> {error}
                    </div>
                )}

                <div className="search-legacy-results-container">
                    {isSearching ? (
                        <p className="search-legacy-loading-text">Channeling mana to fetch cards...</p>
                    ) : results.length > 0 ? (
                        results.map((card) => {
                            const isWatched = watchlist.has(card.id);
                            return (
                                <div key={card.id} className="search-legacy-card">
                                    <div className="search-legacy-card-content">
                                        <img
                                            src={card.imageUrl}
                                            alt={card.name}
                                            className="search-legacy-card-image"
                                        />
                                        <div className="search-legacy-card-details">
                                            <div className="search-legacy-card-header">
                                                <h3 className="search-legacy-card-name">{card.name}</h3>
                                                <span className="search-legacy-mana-cost">{card.manaCost}</span>
                                            </div>
                                            <p className="search-legacy-card-type">{card.type}</p>
                                            <p className="search-legacy-card-set">{card.set}</p>
                                        </div>
                                    </div>
                                    <div className="search-legacy-action-container">
                                        <span className="search-legacy-price">{card.price}</span>
                                        <button
                                            className={`search-legacy-track-button ${isWatched ? "search-legacy-track-button--active" : "search-legacy-track-button--default"}`}
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
                            <div className="search-legacy-empty-state">
                                <p className="search-legacy-empty-state-title">No cards found.</p>
                                <p className="search-legacy-empty-state-text">The spell fizzled. Try adjusting your search terms or filters.</p>
                            </div>
                        ) : (
                            <div className="search-legacy-empty-state">
                                <p className="search-legacy-empty-state-text">Enter a card name or select a type to search the database.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default SearchPage;
