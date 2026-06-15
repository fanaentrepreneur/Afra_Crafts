import { useEffect, useRef, useState } from 'react';

export default function ProductModal({ product, onClose }) {
  const images = product?.subImages?.length > 0
    ? product.subImages.filter(Boolean)
    : [product?.imageData || product?.imageUrl].filter(Boolean);

  const [idx, setIdx] = useState(0);
  const touchX = useRef(null);

  useEffect(() => { setIdx(0); }, [product]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!product) return null;

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd  = (e) => {
    if (touchX.current === null) return;
    const diff = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) diff > 0 ? next() : prev();
    touchX.current = null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box product-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        {/* Carousel */}
        {images.length > 0 ? (
          <div
            className="modal-carousel"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="modal-carousel-track">
              <img
                key={idx}
                src={images[idx]}
                alt={`${product.name} — image ${idx + 1}`}
                className="modal-carousel-img"
              />
            </div>

            {images.length > 1 && (
              <>
                <button className="carousel-arrow carousel-prev" onClick={prev}>‹</button>
                <button className="carousel-arrow carousel-next" onClick={next}>›</button>
                <div className="carousel-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`carousel-dot${i === idx ? ' active' : ''}`}
                      onClick={() => setIdx(i)}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="modal-no-img">🎁</div>
        )}

        {/* Details */}
        <div className="modal-details">
          <h2 className="modal-product-name">{product.name}</h2>
          <p className="modal-product-price">₹{Number(product.price).toFixed(0)}</p>
          {product.description && (
            <p className="modal-product-desc">{product.description}</p>
          )}
          <p className="modal-product-cat">{product.categoryName}</p>
        </div>
      </div>
    </div>
  );
}
