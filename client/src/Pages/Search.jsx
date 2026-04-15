import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';

import { searchCards } from '../API/CardAPI';

function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [watchlist, setWatchlist] = useState(new Set());

    useEffect(() => {
        const timer = setTimeout(() => {
            const fetchCards = async () => {
                if (!searchQuery.trim() && filterType === "All") {
                    setResults([]);
                    return;
                }

                setIsSearching(true);
                setError(null);

                try {
                    const data = await searchCards({ searchQuery, filterType });
                    setResults(data.cards || []);
                } catch (err) {
                    console.error("Error fetching cards:", err);
                    setError("The magical leyline was disrupted. Please try again.");
                    setResults([]);
                } finally {
                    setIsSearching(false);
                }
            };

            fetchCards();
        }, 250); // 250ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, filterType]);

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

                <div className="search-legacy-search-form">
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
                </div>

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
                                <div key={`${card.id}-${card.scryfallId}`} className="search-legacy-card">
                                    <Link to={`/card/${card.id}`} className="search-legacy-card-link">
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
                                    </Link>
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
