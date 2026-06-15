export default function ProductCard({ product, imageUrl, isAdmin, onEdit, onDelete, onCardClick }) {
  const displayImage = imageUrl || product.imageUrl || product.imageData || '';

  return (
    <article
      className="product-card"
      onClick={!isAdmin && onCardClick ? onCardClick : undefined}
      style={{ cursor: !isAdmin && onCardClick ? 'pointer' : 'default' }}
    >
      <div className="product-card-img">
        {displayImage
          ? <img src={displayImage} alt={product.name} loading="lazy" />
          : <div className="product-card-img-empty">🎁</div>
        }
      </div>

      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-price">₹{Number(product.price).toFixed(0)}</p>
        <p className="product-card-desc">
          {product.description || 'Handcrafted premium gift item.'}
        </p>

        {isAdmin && (
          <div className="product-card-actions">
            <button className="btn-secondary btn-sm" onClick={e => { e.stopPropagation(); onEdit?.(); }}>Edit</button>
            <button className="btn-danger btn-sm" onClick={e => { e.stopPropagation(); onDelete?.(); }}>Delete</button>
          </div>
        )}
      </div>
    </article>
  );
}
