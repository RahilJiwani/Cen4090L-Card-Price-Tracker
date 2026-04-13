import React, { useState, useRef, useEffect } from 'react';
import '../styles/pages/card-detail.css';
import PriceHistoryGraph from '../Components/PriceHistoryGraph';

const CardDetail = () => {
  // Placeholder card data - replace with actual data from API query
  const [card] = useState({
    id: 'mtg_placeholder_001',
    name: 'Black Lotus',
    rarity: 'Rare',
    setCode: 'LEA',
    collectorNumber: '232',
    artist: 'Christopher Rush',
    colors: ['Black'],
    imageUrl: 'https://cards.scryfall.io/large/front/b/d/bd8b60b6-0a43-4e6b-bfd7-5b7c4b214306.jpg?1562933555',
    backImageUrl: null, // null if not a double-faced card
    currentPrice: 2500.00,
    previousPrice: 2350.00,
    priceChange: 150.00,
    priceChangePercent: 6.38,
    description: 'Add three mana of any combination of colors to your mana pool, then draw a card and put Black Lotus into your graveyard.',
  });

  // Placeholder price history data
  const [priceHistory] = useState([
    { date: new Date('2026-04-01'), price: 2300 },
    { date: new Date('2026-04-02'), price: 2320 },
    { date: new Date('2026-04-03'), price: 2310 },
    { date: new Date('2026-04-04'), price: 2350 },
    { date: new Date('2026-04-05'), price: 2400 },
    { date: new Date('2026-04-06'), price: 2380 },
    { date: new Date('2026-04-07'), price: 2450 },
    { date: new Date('2026-04-08'), price: 2420 },
    { date: new Date('2026-04-09'), price: 2480 },
    { date: new Date('2026-04-10'), price: 2500 },
  ]);

  const [showBackImage, setShowBackImage] = useState(false);

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
              <span className="price">${card.currentPrice.toFixed(2)}</span>
            </div>

            <div className={`price-change-indicator ${card.priceChange >= 0 ? 'positive' : 'negative'}`}>
              <span className="arrow">
                {card.priceChange >= 0 ? '▲' : '▼'}
              </span>
              <span className="percent">
                {card.priceChangePercent >= 0 ? '+' : ''}
                {card.priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Price History Graph */}
      <div className="price-history-section">
        <h2>Price History</h2>
        <PriceHistoryGraph priceData={priceHistory} cardName={card.name} />
      </div>
    </div>
  );
};

export default CardDetail;
