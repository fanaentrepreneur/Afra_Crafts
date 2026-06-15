import { useEffect } from 'react';
import ProductCard from './ProductCard.jsx';

export default function OfferModal({ offer, products, onClose, onProductClick }) {
  const offerProducts = products.filter(p =>
    offer?.productIds?.map(String).includes(String(p._id))
  );

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!offer) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box offer-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        {/* Offer header */}
        <div className="offer-modal-head">
          {offer.imageData && (
            <div className="offer-modal-banner">
              <img src={offer.imageData} alt={offer.name} />
              <div className="offer-modal-banner-overlay">
                {offer.discountLabel && (
                  <span className="offer-badge-lg">{offer.discountLabel}</span>
                )}
                <h2 className="offer-modal-title">{offer.name}</h2>
                {offer.description && (
                  <p className="offer-modal-desc">{offer.description}</p>
                )}
              </div>
            </div>
          )}
          {!offer.imageData && (
            <div className="offer-modal-text-head">
              {offer.discountLabel && (
                <span className="offer-badge-lg">{offer.discountLabel}</span>
              )}
              <h2 className="offer-modal-title-plain">{offer.name}</h2>
              {offer.description && <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>{offer.description}</p>}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="offer-modal-body">
          <p className="offer-modal-label">Products in this offer</p>
          {offerProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎁</div>
              <p>No products linked to this offer yet.</p>
            </div>
          ) : (
            <div className="products-grid offer-products-grid">
              {offerProducts.map(p => (
                <ProductCard
                  key={p._id}
                  product={p}
                  imageUrl={p.imageData || p.imageUrl || ''}
                  onCardClick={() => onProductClick && onProductClick(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
