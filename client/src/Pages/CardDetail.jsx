import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { getCardDetail } from '../API/CardAPI';
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
  const [card, setCard] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBackImage, setShowBackImage] = useState(false);

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
      } catch (err) {
        if (!isActive) {
          return;
        }

        setError(err.message || 'Failed to load this card.');
        setCard(null);
        setPriceHistory([]);
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
        </div>

        {/* Right Section - Card Details */}
        <div className="card-details-section">
          {/* Header Info */}
          <div className="card-header">
            <h1 className="card-name">{card.name}</h1>
            <p className="card-set-info">
              <span className="set-code">{card.setCode}</span>
              <span className="collector-number">#{card.collectorNumber}</span>
              {card.setName && <span className="card-set-name">{card.setName}</span>}
            </p>
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
