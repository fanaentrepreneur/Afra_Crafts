import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from './utils/api.js';
import { getImageUrl } from './data/imageAssets.js';
import { getProductImageUrl } from './utils/imageUpload.js';
import ProductCard from './components/ProductCard.jsx';
import ProductModal from './components/ProductModal.jsx';
import OfferModal from './components/OfferModal.jsx';
import logoImg from '../assests/Logo/WhatsApp Image 2026-06-13 at 21.45.14.jpeg';

const HERO_QUOTES = [
  '"Every gift tells a story - let yours be handcrafted with love."',
  '"Made with care, remembered forever."',
  '"The finest gifts come wrapped in creativity."',
  '"A handcrafted gift holds a piece of the maker\'s soul."',
  '"Where creativity meets care - that\'s where Afra Crafts lives."',
];

const WA_LINK = 'https://wa.me/918098621334?text=Hello%20Afra%20Crafts%2C%20I%20would%20like%20to%20enquire%20about%20your%20handmade%20crafts.';

const WaIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });
}

function useScrollDots(count) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [el, setEl] = useState(null);
  const setRef = useCallback(node => setEl(node), []);

  useEffect(() => {
    if (!el) return;
    const update = () => {
      const children = Array.from(el.children);
      if (!children.length) return;
      const containerCenter = el.getBoundingClientRect().left + el.clientWidth / 2;
      let closest = 0, minDist = Infinity;
      children.forEach((child, i) => {
        const rect = child.getBoundingClientRect();
        const dist = Math.abs(rect.left + rect.width / 2 - containerCenter);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveIdx(closest);
    };
    let timer;
    const onScroll = () => { clearTimeout(timer); timer = setTimeout(update, 120); };
    el.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(timer); };
  }, [el, count]);

  const scrollTo = (idx) => {
    if (!el) return;
    const child = el.children[idx];
    if (child) child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  return [activeIdx, scrollTo, setRef];
}

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


  const visibleProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory._id)
    : products;

  const [prodDotIdx,  scrollToProd,  prodRef]  = useScrollDots(visibleProducts.length);
  const [catDotIdx,   scrollToCat,   catRef]   = useScrollDots(categories.length);

  useScrollReveal();

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

  const getProductImage = (product) =>
    getProductImageUrl(product) ||
    getImageUrl(product.categorySlug?.replace(/-/g, '') || 'keychain', product.imageKey);

  return (
    <div className="shop-page">

      {/* ── Hero ─────────────────────────────── */}
      <div className="hero-banner">
        <img src={logoImg} alt="" className="hero-logo-watermark" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-text-col">
            <div className="hero-tag-row">
              <div className="hero-tag"><span className="sparkle-star">✦</span> Handmade gifts</div>
              <a className="btn-whatsapp btn-whatsapp-icon" href={WA_LINK} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp us">
                <WaIcon />
              </a>
            </div>
            <h1 className="hero-title" data-reveal data-delay="1">Discover crafts with heart</h1>
            <p className="hero-desc" data-reveal data-delay="2">
              Browse our handcrafted collections — keychains, ring albums, frames,
              hampers and more. Every piece made with love, perfect for gifting.
            </p>
            <p className={`hero-quote-text${heroFading ? ' fading' : ''}`} data-reveal data-delay="3">
              {HERO_QUOTES[heroQuoteIdx]}
            </p>
          </div>
        </div>
      </div>

      {/* ── Offers ───────────────────────────── */}
      <div className="offers-section" data-reveal>
        <div className="offers-label"><span className="sparkle-star">✦</span> Current Offers</div>
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
        <div className="cat-tab-section" data-reveal>
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
      <div className="products-section" data-reveal>
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
              <>
                <div className="cat-overview-grid" ref={catRef}>
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
                {categories.length > 1 && (
                  <div className="scroll-dots">
                    {categories.map((_, i) => (
                      <button key={i} className={`scroll-dot${catDotIdx === i ? ' active' : ''}`} onClick={() => scrollToCat(i)} aria-label={`Go to collection ${i + 1}`} />
                    ))}
                  </div>
                )}
              </>
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
              <>
                <div className="products-grid" ref={prodRef}>
                  {visibleProducts.map(product => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      imageUrl={getProductImage(product)}
                      onCardClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
                {visibleProducts.length > 1 && (
                  <div className="scroll-dots">
                    {visibleProducts.map((_, i) => (
                      <button key={i} className={`scroll-dot${prodDotIdx === i ? ' active' : ''}`} onClick={() => scrollToProd(i)} aria-label={`Go to product ${i + 1}`} />
                    ))}
                  </div>
                )}
              </>
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
