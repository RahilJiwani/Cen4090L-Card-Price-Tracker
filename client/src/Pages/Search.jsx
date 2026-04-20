import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';

import { searchCards } from '../API/CardAPI';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../API/UserAPI';

const SearchResultRow = ({ card, watchlist, toggleWatchlist }) => {
    const [selectedPrintingId, setSelectedPrintingId] = useState(card.id);
    const activePrinting = (card.printings || []).find(p => p.id === selectedPrintingId);

    const displayId = activePrinting ? activePrinting.id : card.id;
    const displayImageUrl = activePrinting ? activePrinting.imageUrl : card.imageUrl;
    const displaySet = activePrinting ? activePrinting.setCode : card.set;
    const displayPrice = activePrinting ? activePrinting.price : card.price;
    const isWatched = watchlist.has(displayId);

    return (
        <div className="search-legacy-card">
            <Link to={`/card/${displayId}`} className="search-legacy-card-link">
                <div className="search-legacy-card-content">
                    <img
                        src={displayImageUrl}
                        alt={card.name}
                        className="search-legacy-card-image"
                    />
                    <div className="search-legacy-card-details">
                        <div className="search-legacy-card-header">
                            <h3 className="search-legacy-card-name">{card.name}</h3>
                            <span className="search-legacy-mana-cost">{card.manaCost}</span>
                        </div>
                        <p className="search-legacy-card-type">{card.type}</p>
                        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                            <p className="search-legacy-card-set" style={{margin: 0}}>{displaySet}</p>
                            {card.printings && card.printings.length > 1 && (
                                <select 
                                    className="printing-selector" 
                                    value={displayId} 
                                    onChange={(e) => {
                                        e.preventDefault();
                                        setSelectedPrintingId(parseInt(e.target.value));
                                    }}
                                    onClick={(e) => e.preventDefault()}
                                    style={{padding: "2px 5px", background: "#222", color: "#eaddc5", border: "1px solid #d4af37", borderRadius: "4px", outline: "none", cursor: "pointer"}}
                                >
                                    {card.printings.map(p => (
                                        <option key={p.id} value={p.id}>{p.setCode}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
            <div className="search-legacy-action-container">
                <span className="search-legacy-price">{displayPrice}</span>
                <button
                    className={`search-legacy-track-button ${isWatched ? "search-legacy-track-button--active" : "search-legacy-track-button--default"}`}
                    onClick={(e) => {
                        e.preventDefault();
                        toggleWatchlist(displayId);
                    }}
                >
                    {isWatched ? "− Unbind" : "+ Watchlist"}
                </button>
            </div>
        </div>
    );
};

function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [watchlist, setWatchlist] = useState(new Set());

    useEffect(() => {
        const loadWatchlist = async () => {
            try {
                const data = await getWatchlist();
                if (data && data.watchlist) {
                    setWatchlist(new Set(data.watchlist.map(c => c.id)));
                }
            } catch (err) {
                console.error("Failed to load watchlist:", err);
            }
        };
        loadWatchlist();
    }, []);

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

    const toggleWatchlist = async (cardId) => {
        const isWatched = watchlist.has(cardId);

        setWatchlist((prev) => {
            const newSet = new Set(prev);
            if (isWatched) {
                newSet.delete(cardId);
            } else {
                newSet.add(cardId);
            }
            return newSet;
        });

        try {
            if (isWatched) {
                await removeFromWatchlist(cardId);
            } else {
                await addToWatchlist(cardId);
            }
        } catch (err) {
            console.error("Failed to update watchlist:", err);
            setWatchlist((prev) => {
                const newSet = new Set(prev);
                if (isWatched) {
                    newSet.add(cardId);
                } else {
                    newSet.delete(cardId);
                }
                return newSet;
            });
        }
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
                            return (
                                <SearchResultRow 
                                    key={`${card.id}-${card.scryfallId}`}
                                    card={card}
                                    watchlist={watchlist}
                                    toggleWatchlist={toggleWatchlist}
                                />
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
