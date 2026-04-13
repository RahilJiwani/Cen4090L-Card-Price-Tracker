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
                        <div className="dashboard-legacy-card-grid">
                            {watchlist.map(card => (
                                <article key={card.id} className="dashboard-legacy-mtg-card">
                                    <div className="dashboard-legacy-card-header">
                                        <span className="dashboard-legacy-card-name">{card.name}</span>
                                    </div>

                                    <div className="dashboard-legacy-type-line">
                                        <span>{card.set.toUpperCase()}</span>
                                        <span className="dashboard-legacy-set-symbol">*</span>
                                    </div>

                                    <div className="dashboard-legacy-card-text-box">
                                        <div>
                                            <span className="dashboard-legacy-price-tag">Current Price</span>
                                            <strong className="dashboard-legacy-price-value">{card.price}</strong>
                                        </div>
                                    </div>

                                    <div className="dashboard-legacy-card-footer">
                                        <button
                                            type="button"
                                            className="dashboard-legacy-remove-button"
                                            onClick={() => handleRemoveCard(card.id)}
                                        >
                                            Remove Card
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;