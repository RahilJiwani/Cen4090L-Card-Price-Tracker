import React from "react";
import useAuth from "../Hooks/useAuth.js";
import { getWatchlist, removeFromWatchlist } from "../API/UserAPI.js";
import WatchlistModal from "../Components/WatchlistModal.jsx";

function DashboardPage() {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = React.useState([]);
    const [editingCard, setEditingCard] = React.useState(null);

    const refreshWatchlist = () => {
        getWatchlist()
            .then(data => setWatchlist(data.watchlist || []))
            .catch(err => console.error("Failed to load watchlist:", err));
    };

    React.useEffect(() => {
        refreshWatchlist();
    }, []);

    const handleRemoveCard = async (cardId) => {
        try {
            await removeFromWatchlist(cardId);
            setWatchlist(prevWatchlist => prevWatchlist.filter(card => card.id !== cardId));
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
                                                <p className="search-legacy-card-set">{card.set}</p>
                                            </div>
                                        </div>
                                    </a>
                                    <div className="search-legacy-action-container">
                                        <span className="search-legacy-price">{card.price}</span>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button
                                                type="button"
                                                className="search-legacy-track-button search-legacy-track-button--default"
                                                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setEditingCard(card);
                                                }}
                                            >
                                                <span>⚙</span><span>Configure</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="search-legacy-track-button search-legacy-track-button--active"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRemoveCard(card.id);
                                                }}
                                            >
                                                − Unbind
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {editingCard && (
                <WatchlistModal
                    cardId={editingCard.id}
                    cardName={editingCard.name}
                    initialConfig={editingCard.config}
                    onClose={() => setEditingCard(null)}
                    onAdded={() => {
                        setEditingCard(null);
                        refreshWatchlist();
                    }}
                />
            )}
        </div>
    );
}

export default DashboardPage;