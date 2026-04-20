import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getCardDetail } from '../API/CardAPI';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../API/UserAPI';
import WatchlistModal from '../Components/WatchlistModal';
import '../styles/pages/card-detail.css';
import PriceHistoryGraph from '../Components/PriceHistoryGraph';

function formatPrice(value) {
  if (value == null) {
    return 'N/A';
  }

  const numericValue = Number(value ?? 0);
  return `$${numericValue.toFixed(2)}`;
}

const CardDetail = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [printings, setPrintings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBackImage, setShowBackImage] = useState(false);
  const [watchlist, setWatchlist] = useState(new Set());
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);

  // Load watchlist on mount
  useEffect(() => {
    getWatchlist()
      .then(data => {
        if (data?.watchlist) {
          setWatchlist(new Set(data.watchlist.map(c => c.id)));
        }
      })
      .catch(err => console.error('Failed to load watchlist:', err));
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadCard() {
      setIsLoading(true);
      setError('');
      setShowBackImage(false);

      try {
        const data = await getCardDetail(cardId);
        if (!isActive) {
          return;
        }

        setCard(data.card);
        setPriceHistory(
          (data.priceHistory || []).map((entry) => ({
            ...entry,
            date: new Date(entry.date),
          }))
        );
        setPrintings(data.printings || []);
      } catch (err) {
        if (!isActive) {
          return;
        }

        setError(err.message || 'Failed to load this card.');
        setCard(null);
        setPriceHistory([]);
        setPrintings([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadCard();

    return () => {
      isActive = false;
    };
  }, [cardId]);

  const hasPriceHistory = priceHistory.length > 0;
  const hasCurrentPrice = card?.currentPrice != null;
  const isWatched = card ? watchlist.has(card.id) : false;

  const toggleWatchlist = async () => {
    if (!card) return;
    const cardId = card.id;

    if (!isWatched) {
      setShowWatchlistModal(true);
      return;
    }

    // Unbind immediately
    setWatchlist(prev => { const s = new Set(prev); s.delete(cardId); return s; });
    try {
      await removeFromWatchlist(cardId);
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
      setWatchlist(prev => { const s = new Set(prev); s.add(cardId); return s; });
    }
  };

  const handleModalAdded = () => {
    if (card) setWatchlist(prev => { const s = new Set(prev); s.add(card.id); return s; });
    setShowWatchlistModal(false);
  };

  const priceChangeClass = useMemo(() => {
    if (!card) {
      return 'positive';
    }

    return card.priceChange >= 0 ? 'positive' : 'negative';
  }, [card]);

  if (isLoading) {
    return (
      <div className="card-detail">
        <div className="card-detail-status">Loading card details...</div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="card-detail">
        <div className="card-detail-status card-detail-status-error">
          {error || 'Card details are unavailable.'}
        </div>
      </div>
    );
  }

  return (
    <div className="card-detail">
      {showWatchlistModal && card && (
        <WatchlistModal
          cardId={card.id}
          cardName={card.name}
          onClose={() => setShowWatchlistModal(false)}
          onAdded={handleModalAdded}
        />
      )}
      <div className="card-detail-container">
        {/* Left Section - Card Images */}
        <div className="card-images-section">
          <div className="card-image-wrapper">
            <img
              src={showBackImage && card.backImageUrl ? card.backImageUrl : card.imageUrl}
              alt={showBackImage && card.backImageUrl ? `${card.name} Back` : card.name}
              className="card-image"
            />
            {card.backImageUrl && (
              <button
                className="flip-button"
                onClick={() => setShowBackImage(!showBackImage)}
                title="Flip card"
              >
                {showBackImage ? '◄ Front' : 'Back ►'}
              </button>
            )}
          </div>
          {/* Watchlist button below the card art */}
          <button
            className={`card-watchlist-button ${
              isWatched ? 'card-watchlist-button--active' : 'card-watchlist-button--default'
            }`}
            onClick={toggleWatchlist}
          >
            {isWatched ? '− Unbind from Grimoire' : '+ Add to Grimoire'}
          </button>
        </div>

        {/* Right Section - Card Details */}
        <div className="card-details-section">
          {/* Header Info */}
          <div className="card-header">
            <h1 className="card-name">{card.name}</h1>
            <div className="card-set-info">
              <span className="set-code">{card.setCode}</span>
              <span className="collector-number">#{card.collectorNumber}</span>
              {card.setName && <span className="card-set-name">{card.setName}</span>}
              {printings.length > 1 && (
                 <select 
                    className="printing-selector" 
                    value={card.id} 
                    onChange={(e) => navigate(`/card/${e.target.value}`)}
                    style={{marginLeft: "15px", padding: "4px 8px", background: "#222", color: "#eaddc5", border: "1px solid #d4af37", borderRadius: "4px", outline: "none", cursor: "pointer"}}
                    title="Select an alternative printing"
                 >
                    {printings.map(p => (
                        <option key={p.id} value={p.id}>{p.setCode}</option>
                    ))}
                 </select>
              )}
            </div>
          </div>

          {/* Card Attributes */}
          <div className="card-attributes">
            <div className="attribute">
              <label>Rarity</label>
              <p className={`rarity rarity-${card.rarity.toLowerCase()}`}>
                {card.rarity}
              </p>
            </div>

            <div className="attribute">
              <label>Colors</label>
              <div className="colors">
                {card.colors.length > 0 ? (
                  <p className="color-list">
                    {card.colors.join(', ')}
                  </p>
                ) : (
                  <p className="color-list">Colorless</p>
                )}
              </div>
            </div>

            <div className="attribute">
              <label>Artist</label>
              <p className="artist">{card.artist}</p>
            </div>

            <div className="attribute">
              <label>Type</label>
              <p>{card.type || 'Unknown'}</p>
            </div>
          </div>

          {/* Card Description */}
          {card.description && (
            <div className="card-description">
              <label>Ability</label>
              <p>{card.description}</p>
            </div>
          )}

          {/* Pricing Section */}
          <div className="pricing-section">
            <div className="current-price">
              <span className="label">Current Price</span>
              <span className="price">{formatPrice(card.currentPrice)}</span>
            </div>

            {hasCurrentPrice && (
              <div className={`price-change-indicator ${priceChangeClass}`}>
                <span className="arrow">
                  {card.priceChange >= 0 ? '▲' : '▼'}
                </span>
                <span className="percent">
                  {card.priceChangePercent >= 0 ? '+' : ''}
                  {card.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          <div className="card-price-baseline">
            Previous tracked price: {formatPrice(card.previousPrice)}
          </div>
        </div>
      </div>

      {/* Price History Graph */}
      <div className="price-history-section">
        <h2>Price History</h2>
        {hasPriceHistory ? (
          <PriceHistoryGraph priceData={priceHistory} cardName={card.name} />
        ) : (
          <p className="card-detail-history-empty">No tracked price history is available for this card yet.</p>
        )}
      </div>
    </div>
  );
};

export default CardDetail;
