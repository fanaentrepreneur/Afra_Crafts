import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from './utils/api.js';
import { getImageUrl } from './data/imageAssets.js';
import { getProductImageUrl } from './utils/imageUpload.js';
import ProductCard from './components/ProductCard.jsx';
import ProductModal from './components/ProductModal.jsx';
import OfferModal from './components/OfferModal.jsx';

const HERO_QUOTES = [
  '"Every gift tells a story — let yours be handcrafted with love."',
  '"Made with care, remembered forever."',
  '"The finest gifts come wrapped in creativity."',
  '"A handcrafted gift holds a piece of the maker\'s soul."',
  '"Where creativity meets care — that\'s where Afra Crafts lives."',
];

const WA_LINK = 'https://wa.me/918098621334?text=Hello%20Afra%20Crafts%2C%20I%20would%20like%20to%20enquire%20about%20your%20handmade%20crafts.';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get('cat');

  const [categories,       setCategories]       = useState([]);
  const [products,         setProducts]         = useState([]);
  const [offers,           setOffers]           = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [selectedOffer,    setSelectedOffer]    = useState(null);
  const [heroQuoteIdx,     setHeroQuoteIdx]     = useState(0);
  const [heroFading,       setHeroFading]       = useState(false);

  /* ── Load data ───────────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [catRes, prodRes, offerRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products'),
          api.get('/offers'),
        ]);
        setCategories(catRes.data);
        setProducts(prodRes.data);
        setOffers(offerRes.data);
      } catch {
        setError('Unable to load collections right now. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Sync URL param → selectedCategory ───── */
  useEffect(() => {
    if (!categories.length) return;
    if (catParam) {
      const found = categories.find(c => c._id === catParam);
      setSelectedCategory(found || null);
    } else {
      setSelectedCategory(null);
    }
  }, [catParam, categories]);

  /* ── Hero quote rotation ─────────────────── */
  useEffect(() => {
    const t = setInterval(() => {
      setHeroFading(true);
      setTimeout(() => {
        setHeroQuoteIdx(i => (i + 1) % HERO_QUOTES.length);
        setHeroFading(false);
      }, 500);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat) setSearchParams({ cat: cat._id });
    else setSearchParams({});
  };

  const visibleProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory._id)
    : products;

  const getProductImage = (product) =>
    getProductImageUrl(product) ||
    getImageUrl(product.categorySlug?.replace(/-/g, '') || 'keychain', product.imageKey);

  return (
    <div className="shop-page">

      {/* ── Hero ─────────────────────────────── */}
      <div className="hero-banner">
        <div className="hero-inner">
          <div className="hero-text-col">
            <div className="hero-tag">✦ Handmade gifts</div>
            <h1 className="hero-title">Discover crafts with heart</h1>
            <p className="hero-desc">
              Browse our handcrafted collections — keychains, ring albums, frames,
              hampers and more. Every piece made with love, perfect for gifting.
            </p>
            <p className={`hero-quote-text${heroFading ? ' fading' : ''}`}>
              {HERO_QUOTES[heroQuoteIdx]}
            </p>
          </div>
          <a className="btn-whatsapp" href={WA_LINK} target="_blank" rel="noopener noreferrer">
            <span>💬</span> WhatsApp us
          </a>
        </div>
      </div>

      {/* ── Offers ───────────────────────────── */}
      <div className="offers-section">
        <div className="offers-label">✦ Current Offers</div>
        {!loading && (
          offers.length === 0 ? (
            <div className="offers-grid">
              <div className="offer-card-locked">
                <div className="offer-lock-icon">🔒</div>
                <p className="offer-locked-text">No active offers right now</p>
                <p className="offer-locked-sub">Check back soon for exciting deals!</p>
              </div>
            </div>
          ) : (
            <div className="offers-grid">
              {offers.map(offer => (
                <div
                  key={offer._id}
                  className={`offer-card${!offer.imageData ? ' offer-card-no-img' : ''}`}
                  onClick={() => setSelectedOffer(offer)}
                >
                  {offer.imageData && <img className="offer-card-img" src={offer.imageData} alt={offer.name} />}
                  {offer.imageData && <div className="offer-card-gradient" />}
                  <div className="offer-card-body">
                    {offer.discountLabel && <span className="offer-badge">{offer.discountLabel}</span>}
                    <div className="offer-card-name">{offer.name}</div>
                    {offer.description && <p className="offer-card-desc">{offer.description}</p>}
                    <p className="offer-card-tap">Tap to see products →</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Category Tabs ────────────────────── */}
      {!loading && categories.length > 0 && (
        <div className="cat-tab-section">
          <div className="cat-tab-label">Browse by collection</div>
          <div className="cat-tabs">
            <button
              className={`cat-tab${!selectedCategory ? ' active' : ''}`}
              onClick={() => selectCategory(null)}
            >
              All <span className="cat-tab-count">{categories.length}</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                className={`cat-tab${selectedCategory?._id === cat._id ? ' active' : ''}`}
                onClick={() => selectCategory(cat)}
              >
                {cat.name}
                <span className="cat-tab-count">{cat.itemCount || 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────── */}
      <div className="products-section">
        {loading ? (
          <div className="loading-state">
            <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
            <p style={{ marginTop: '1rem' }}>Loading collections…</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠</div>
            <p>{error}</p>
          </div>
        ) : !selectedCategory ? (

          /* Category overview */
          <div className="cat-overview-section">
            <div className="section-header">
              <h2 className="section-title">Our Collections</h2>
              <p className="section-sub">Choose a collection to explore</p>
            </div>
            {categories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎨</div>
                <p>No collections available yet.</p>
              </div>
            ) : (
              <div className="cat-overview-grid">
                {categories.map(cat => (
                  <div key={cat._id} className="cat-overview-card" onClick={() => selectCategory(cat)}>
                    <div className="cat-overview-img">
                      {(cat.imageData || cat.imageUrl)
                        ? <img src={cat.imageData || cat.imageUrl} alt={cat.name} loading="lazy" />
                        : <div className="cat-img-placeholder">🎁</div>
                      }
                    </div>
                    <div className="cat-overview-info">
                      <p className="cat-overview-name">{cat.name}</p>
                      <p className="cat-overview-count">{cat.itemCount || 0} products</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : (

          /* Category detail */
          <>
            <button className="cat-back-btn" onClick={() => selectCategory(null)}>
              ← Back to collections
            </button>
            <div className="cat-profile-header">
              {(selectedCategory.imageData || selectedCategory.imageUrl) && (
                <div className="cat-profile-img-wrap">
                  <img src={selectedCategory.imageData || selectedCategory.imageUrl} alt={selectedCategory.name} />
                </div>
              )}
              <div className="cat-profile-info-block">
                <h2 className="cat-profile-name">{selectedCategory.name}</h2>
                {selectedCategory.description && (
                  <p className="cat-profile-desc">{selectedCategory.description}</p>
                )}
                <span className="cat-profile-count">
                  {visibleProducts.length} product{visibleProducts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {visibleProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎨</div>
                <p>No products in this collection yet. Check back soon!</p>
              </div>
            ) : (
              <div className="products-grid">
                {visibleProducts.map(product => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    imageUrl={getProductImage(product)}
                    onCardClick={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
      {selectedOffer && (
        <OfferModal
          offer={selectedOffer}
          products={products}
          onClose={() => setSelectedOffer(null)}
          onProductClick={p => { setSelectedOffer(null); setSelectedProduct(p); }}
        />
      )}

    </div>
  );
}
