import React, { useState, useEffect } from 'react';
import { addToWatchlist } from '../API/UserAPI';
import '../styles/components/watchlist-modal.css';

/**
 * WatchlistModal
 * Opens when a user wants to add a card to their watchlist.
 * Lets them optionally set alert thresholds before confirming.
 *
 * Props:
 *  cardId   — internal card ID to add
 *  cardName — display name shown in the modal header
 *  onClose  — called to dismiss the modal (cancel or after confirm)
 *  onAdded  — called after the card is successfully added
 */
function WatchlistModal({ cardId, cardName, onClose, onAdded, initialConfig = {} }) {
    const [targetPrice,    setTargetPrice]    = useState(initialConfig.target_price || '');
    const [percentageDrop, setPercentageDrop] = useState(initialConfig.percentage_drop || '');
    const [lookbackDays,   setLookbackDays]   = useState(initialConfig.lookback_days || '');
    const [isSubmitting,   setIsSubmitting]   = useState(false);
    const [error,          setError]          = useState(null);

    // Close on Escape key
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const config = {};
            if (targetPrice    !== '') config.target_price    = parseFloat(targetPrice);
            if (percentageDrop !== '') config.percentage_drop = parseFloat(percentageDrop);
            if (lookbackDays   !== '') config.lookback_days   = parseInt(lookbackDays, 10);

            await addToWatchlist(cardId, config);
            onAdded();
        } catch (err) {
            setError(err.message || 'Failed to add card to watchlist.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="wl-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="wl-modal">
                <div className="wl-modal-header">
                    <h2 className="wl-modal-title">Bind to Grimoire</h2>
                    <button className="wl-modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <p className="wl-modal-subtitle">
                    {Object.keys(initialConfig).length > 0 
                        ? `Editing configuration for ` 
                        : `Adding `}
                    <strong>{cardName}</strong>
                    {Object.keys(initialConfig).length === 0 && ' to your watchlist.'}
                    <br />Set optional alert thresholds below, or leave blank to track without alerts.
                </p>

                <div className="wl-modal-fields">
                    <div className="wl-field">
                        <label className="wl-label" htmlFor="wl-target-price">
                            Target Price ($)
                            <span className="wl-hint">Alert when price drops to or below this value</span>
                        </label>
                        <input
                            id="wl-target-price"
                            className="wl-input"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 25.00"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                        />
                    </div>

                    <div className="wl-field">
                        <label className="wl-label" htmlFor="wl-pct-drop">
                            Percentage Drop (%)
                            <span className="wl-hint">Alert when price drops by this % from its peak</span>
                        </label>
                        <input
                            id="wl-pct-drop"
                            className="wl-input"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="e.g. 10"
                            value={percentageDrop}
                            onChange={(e) => setPercentageDrop(e.target.value)}
                        />
                    </div>

                    <div className="wl-field">
                        <label className="wl-label" htmlFor="wl-lookback">
                            Lookback Period (days)
                            <span className="wl-hint">Window for finding the peak price baseline (default 30)</span>
                        </label>
                        <input
                            id="wl-lookback"
                            className="wl-input"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="e.g. 30"
                            value={lookbackDays}
                            onChange={(e) => setLookbackDays(e.target.value)}
                        />
                    </div>
                </div>

                {error && <p className="wl-error">{error}</p>}

                <div className="wl-modal-actions">
                    <button className="wl-btn wl-btn-cancel" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button className="wl-btn wl-btn-confirm" onClick={handleConfirm} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : (Object.keys(initialConfig).length > 0 ? 'Save Configuration' : '⚔ Bind to Grimoire')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WatchlistModal;
