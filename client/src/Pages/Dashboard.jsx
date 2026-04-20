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
        <div className="dashboard-legacy-page">
            <div className="dashboard-legacy-nav">
                <h1 className="dashboard-legacy-title">Welcome to the Tavern, {user?.username}!</h1>
                <p className="dashboard-legacy-subtitle">Your tracked artifacts and spells.</p>
            </div>

            <div className="dashboard-legacy-content">
                <div className="dashboard-legacy-main-container">
                    <div className="dashboard-legacy-header-row">
                        <h2 className="dashboard-legacy-section-title">Your Grimoire (Watchlist)</h2>
                        <span className="dashboard-legacy-card-count">{watchlist.length} Cards</span>
                    </div>

                    {watchlist.length === 0 ? (
                        <div className="dashboard-legacy-empty-state">
                            <p className="dashboard-legacy-empty-text">Your grimoire is empty.</p>
                            <p className="dashboard-legacy-empty-subtext">
                                Journey to the Search page to gather spells for your collection.
                            </p>
                        </div>
                    ) : (
                        <div className="search-legacy-results-container">
                            {watchlist.map(card => (
                                <div key={card.id} className="search-legacy-card">
                                    <a href={`/card/${card.id}`} className="search-legacy-card-link">
                                        <div className="search-legacy-card-content">
                                            {card.imageUrl ? (
                                                <img
                                                    src={card.imageUrl}
                                                    alt={card.name}
                                                    className="search-legacy-card-image"
                                                />
                                            ) : (
                                                <div className="search-legacy-card-image" style={{backgroundColor: '#2a2a2a'}} />
                                            )}
                                            <div className="search-legacy-card-details">
                                                <div className="search-legacy-card-header">
                                                    <h3 className="search-legacy-card-name">{card.name}</h3>
                                                </div>
                                                <p className="search-legacy-card-type">{card.type || "Card"}</p>
                                                <p className="search-legacy-card-set">{card.set.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </a>
                                    <div className="search-legacy-action-container">
                                        <span className="search-legacy-price">{card.price}</span>
                                        <button
                                            type="button"
                                            className="dashboard-legacy-remove-button"
                                            onClick={() => handleRemoveCard(card.id)}
                                            style={{marginTop: "8px"}}
                                        >
                                            - Unbind
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