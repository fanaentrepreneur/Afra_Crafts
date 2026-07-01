import { useEffect, useMemo, useRef, useState } from 'react';
import api from './utils/api.js';
import { getImageOptions } from './data/imageAssets.js';
import { fileToBase64 } from './utils/imageUpload.js';
import { useToast } from './context/ToastContext.jsx';

const CAT_LIMIT   = 5;
const OFFER_LIMIT = 3;
const PAGE_SIZE   = 5;

export default function AdminPage() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [offers,     setOffers]     = useState([]);

  const [newCategory, setNewCategory] = useState({ name: '', description: '', imageFile: null });
  const [newProduct,  setNewProduct]  = useState({
    name: '', categoryId: '', imageKey: '',
    images: [
      { imageFile: null, price: '', description: '' },
      { imageFile: null, price: '', description: '' },
      { imageFile: null, price: '', description: '' },
    ],
  });
  const [newOffer, setNewOffer] = useState({
    name: '', description: '', discountLabel: '', imageFile: null, productIds: [],
  });

  const [categoryEdit, setCategoryEdit] = useState({});
  const [productEdit,  setProductEdit]  = useState({});
  const [offerEdit,    setOfferEdit]    = useState({});
  const [expandedCat,  setExpandedCat]  = useState(null);
  const [expandedProd, setExpandedProd] = useState(null);
  const [expandedOffer,setExpandedOffer]= useState(null);

  const [catCreating,  setCatCreating]  = useState(false);
  const [prodCreating, setProdCreating] = useState(false);
  const [offerCreating, setOfferCreating] = useState(false);
  const [savingId,     setSavingId]     = useState(null);

  const [prodPage,        setProdPage]        = useState(1);
  const [prodTotal,       setProdTotal]       = useState(null);
  const [prodHasMore,     setProdHasMore]     = useState(false);
  const [prodLoadingMore, setProdLoadingMore] = useState(false);
  const [offerProductList, setOfferProductList] = useState([]);
  const loadMoreFnRef   = useRef(null);
  const prodListRef     = useRef(null);
  const dataLoadedRef   = useRef(false);

  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', onConfirm: null });

  const askConfirm = (message, fn) => setConfirmDialog({ open: true, message, onConfirm: fn });
  const closeConfirm = () => setConfirmDialog({ open: false, message: '', onConfirm: null });
  const handleConfirm = () => { confirmDialog.onConfirm?.(); closeConfirm(); };

  const [catsLoading,   setCatsLoading]   = useState(true);
  const [prodsLoading,  setProdsLoading]  = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [catSkelCount]  = useState(() => Math.min(8, Math.max(1, parseInt(localStorage.getItem('afra_cat_count')   || '3'))));
  const [prodSkelCount] = useState(() => Math.min(5,  Math.max(1, parseInt(localStorage.getItem('afra_prod_count')  || '3'))));
  const [offerSkelCount]= useState(() => Math.min(6,  Math.max(1, parseInt(localStorage.getItem('afra_offer_count') || '2'))));

  useEffect(() => {
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;
    loadData();
  }, []);

  useEffect(() => {
    loadMoreFnRef.current = () => {
      if (!prodHasMore || prodLoadingMore || prodsLoading) return;
      loadProducts(prodPage + 1, true);
    };
  });

  useEffect(() => {
    const container = prodListRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 80) {
        loadMoreFnRef.current?.();
      }
    };
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const loadProducts = (page = 1, append = false) => {
    if (!append) setProdsLoading(true);
    else setProdLoadingMore(true);
    return api.get(`/products?page=${page}&pageSize=${PAGE_SIZE}`)
      .then(res => {
        const { products: newProds, total, hasMore } = res.data;
        if (append) setProducts(prev => [...prev, ...newProds]);
        else setProducts(newProds);
        setProdPage(page);
        setProdTotal(total);
        setProdHasMore(hasMore);
        localStorage.setItem('afra_prod_count', String(total));
      })
      .catch(() => { toast('Unable to load products.', 'error'); })
      .finally(() => {
        if (!append) setProdsLoading(false);
        else setProdLoadingMore(false);
      });
  };

  const loadData = () => {
    api.get('/categories').then(res => {
      setCategories(res.data);
      setCatsLoading(false);
      localStorage.setItem('afra_cat_count', String(res.data.length));
    }).catch(() => { setCatsLoading(false); toast('Unable to load categories.', 'error'); });

    loadProducts(1);

    api.get('/products?slim=true').then(res => {
      setOfferProductList(res.data);
    }).catch(() => {});

    api.get('/offers/all').then(res => {
      setOffers(res.data);
      setOffersLoading(false);
      localStorage.setItem('afra_offer_count', String(res.data.length));
    }).catch(() => { setOffersLoading(false); toast('Unable to load offers.', 'error'); });
  };

  const categoryOptions = useMemo(
    () => categories.map(c => ({ label: c.name, value: c._id, slug: c.slug })),
    [categories]
  );

  const selectedImageOptions = getImageOptions(
    categories.find(c => c._id === newProduct.categoryId)?.slug?.replace(/-/g, '') || ''
  );

  /* ── Category CRUD ─────────────────────── */
  const createCategory = async (e) => {
    e.preventDefault();
    if (categories.length >= CAT_LIMIT) return;
    if (!newCategory.name?.trim())        { toast('Category name is required.', 'error'); return; }
    if (!newCategory.description?.trim()) { toast('Description is required.', 'error'); return; }
    if (!newCategory.imageFile)           { toast('Category image is required.', 'error'); return; }
    setCatCreating(true);
    try {
      const payload = { name: newCategory.name, description: newCategory.description };
      if (newCategory.imageFile) payload.imageData = await fileToBase64(newCategory.imageFile);
      await api.post('/categories', payload);
      setNewCategory({ name: '', description: '', imageFile: null });
      e.target.reset();
      toast('Category added!', 'success');
      await loadData();
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to create category.', 'error');
    } finally {
      setCatCreating(false);
    }
  };

  const updateCategory = async (id) => {
    const upd = categoryEdit[id];
    if (!upd) return;
    if (!upd.name?.trim())        { toast('Category name is required.', 'error'); return; }
    if (!upd.description?.trim()) { toast('Description is required.', 'error'); return; }
    const hasImage = (upd.existingImageData && !upd.imageRemoved) || upd.imageFile;
    if (!hasImage)                { toast('Category image is required.', 'error'); return; }
    setSavingId(id);
    try {
      const payload = { name: upd.name, description: upd.description };
      if (upd.imageFile) {
        payload.imageData = await fileToBase64(upd.imageFile);
      }
      await api.put(`/categories/${id}`, payload);
      toast('Category updated!', 'success');
      setCategoryEdit(p => ({ ...p, [id]: undefined }));
      setExpandedCat(null);
      await loadData();
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to update.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const deleteCategory = (id) => {
    askConfirm('Delete this category and all its products?', async () => {
      try {
        await api.delete(`/categories/${id}`);
        toast('Category removed.', 'success');
        loadData();
      } catch (err) {
        toast(err.response?.data?.error || 'Unable to delete.', 'error');
      }
    });
  };

  /* ── Product CRUD ──────────────────────── */
  const createProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.categoryId) { toast('Please select a category.', 'error'); return; }
    if (!newProduct.images[0].imageFile) { toast('Image 1: Photo is required.', 'error'); return; }
    if (!newProduct.images[0].price) { toast('Image 1: Price is required.', 'error'); return; }
    for (let i = 1; i < 3; i++) {
      const img = newProduct.images[i];
      const hasFile = !!img.imageFile;
      const hasPrice = !!img.price;
      if (hasFile || hasPrice) {
        if (!hasFile)  { toast(`Image ${i + 1}: Photo is required.`, 'error'); return; }
        if (!hasPrice) { toast(`Image ${i + 1}: Price is required.`, 'error'); return; }
      }
    }
    setProdCreating(true);
    try {
      const imagesPayload = [];
      for (const img of newProduct.images) {
        if (!img.imageFile) continue;
        const imageData = await fileToBase64(img.imageFile);
        imagesPayload.push({ imageData, price: Math.round(Number(img.price)) || 0, description: img.description || '' });
      }
      await api.post('/products', {
        name: newProduct.name,
        categoryId: newProduct.categoryId,
        imageKey: newProduct.imageKey,
        images: imagesPayload,
      });
      setNewProduct({
        name: '', categoryId: '', imageKey: '',
        images: [
          { imageFile: null, price: '', description: '' },
          { imageFile: null, price: '', description: '' },
          { imageFile: null, price: '', description: '' },
        ],
      });
      e.target.reset();
      toast('Product added!', 'success');
      await loadProducts(1);
      api.get('/products?slim=true').then(res => setOfferProductList(res.data)).catch(() => {});
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to add product.', 'error');
    } finally {
      setProdCreating(false);
    }
  };

  const updateProduct = async (id) => {
    const upd = productEdit[id];
    if (!upd) return;
    const slots = upd.imageSlots || [];
    if (!slots[0]?.existingImg && !slots[0]?.newFile) { toast('Image 1: Photo is required.', 'error'); return; }
    if (!slots[0]?.price) { toast('Image 1: Price is required.', 'error'); return; }
    for (let i = 1; i <= 2; i++) {
      const s = slots[i] || {};
      const hasImg = !!(s.existingImg || s.newFile);
      const hasPrice = !!s.price;
      if (s.existingImg) {
        if (!hasPrice) { toast(`Image ${i + 1}: Price is required.`, 'error'); return; }
      } else if (hasImg || hasPrice) {
        if (!hasImg)   { toast(`Image ${i + 1}: Photo is required.`, 'error'); return; }
        if (!hasPrice) { toast(`Image ${i + 1}: Price is required.`, 'error'); return; }
      }
    }
    setSavingId(id);
    try {
      const combined = [];
      for (const slot of slots) {
        if (slot.newFile) {
          const imageData = await fileToBase64(slot.newFile);
          combined.push({ imageData, price: Math.round(Number(slot.price)) || 0, description: slot.description || '' });
        } else if (slot.existingImg) {
          combined.push({ imageData: slot.existingImg.imageData, price: Math.round(Number(slot.price)) || 0, description: slot.description || '' });
        }
      }
      await api.put(`/products/${id}`, { name: upd.name, imageKey: upd.imageKey, images: combined });
      toast('Product updated!', 'success');
      setProductEdit(p => ({ ...p, [id]: undefined }));
      setExpandedProd(null);
      await loadProducts(1);
      api.get('/products?slim=true').then(res => setOfferProductList(res.data)).catch(() => {});
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to update.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const deleteProduct = (id) => {
    askConfirm('Delete this product?', async () => {
      try {
        await api.delete(`/products/${id}`);
        toast('Product removed.', 'success');
        loadProducts(1);
        api.get('/products?slim=true').then(res => setOfferProductList(res.data)).catch(() => {});
      } catch (err) {
        toast(err.response?.data?.error || 'Unable to delete.', 'error');
      }
    });
  };

  /* ── Offer CRUD ────────────────────────── */
  const createOffer = async (e) => {
    e.preventDefault();
    if (offers.length >= OFFER_LIMIT)    { toast(`Maximum ${OFFER_LIMIT} offers allowed.`, 'error'); return; }
    if (!newOffer.name?.trim())          { toast('Offer name is required.', 'error'); return; }
    if (!newOffer.description?.trim())   { toast('Description is required.', 'error'); return; }
    if (!newOffer.discountLabel?.trim()) { toast('Discount label is required.', 'error'); return; }
    if (!newOffer.imageFile)             { toast('Offer image is required.', 'error'); return; }
    setOfferCreating(true);
    try {
      const payload = {
        name: newOffer.name, description: newOffer.description,
        discountLabel: newOffer.discountLabel, productIds: newOffer.productIds,
      };
      if (newOffer.imageFile) payload.imageData = await fileToBase64(newOffer.imageFile);
      await api.post('/offers', payload);
      setNewOffer({ name: '', description: '', discountLabel: '', imageFile: null, productIds: [] });
      e.target.reset();
      toast('Offer created!', 'success');
      await loadData();
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to create offer.', 'error');
    } finally {
      setOfferCreating(false);
    }
  };

  const deleteOffer = (id) => {
    askConfirm('Delete this offer?', async () => {
      try {
        await api.delete(`/offers/${id}`);
        toast('Offer removed.', 'success');
        loadData();
      } catch {
        toast('Unable to delete.', 'error');
      }
    });
  };

  const toggleOfferProduct = (pid) =>
    setNewOffer(p => ({
      ...p,
      productIds: p.productIds.includes(pid)
        ? p.productIds.filter(id => id !== pid)
        : [...p.productIds, pid],
    }));

  const updateOffer = async (id) => {
    const upd = offerEdit[id];
    if (!upd) return;
    if (!upd.name?.trim())          { toast('Offer name is required.', 'error'); return; }
    if (!upd.description?.trim())   { toast('Description is required.', 'error'); return; }
    if (!upd.discountLabel?.trim()) { toast('Discount label is required.', 'error'); return; }
    const hasImage = (upd.existingImageData && !upd.imageRemoved) || upd.imageFile;
    if (!hasImage)                  { toast('Offer image is required.', 'error'); return; }
    setSavingId(id);
    try {
      const payload = { name: upd.name, description: upd.description, discountLabel: upd.discountLabel, productIds: upd.productIds };
      if (upd.imageFile) payload.imageData = await fileToBase64(upd.imageFile);
      await api.put(`/offers/${id}`, payload);
      toast('Offer updated!', 'success');
      setOfferEdit(p => ({ ...p, [id]: undefined }));
      setExpandedOffer(null);
      loadData();
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to update.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  /* ── Expand helpers ────────────────────── */
  const toggleCatExpand = (id, cat) => {
    if (expandedCat === id) { setExpandedCat(null); return; }
    setExpandedCat(id);
    if (!categoryEdit[id])
      setCategoryEdit(p => ({ ...p, [id]: { name: cat.name, description: cat.description, imageFile: null, existingImageData: cat.imageData || cat.imageUrl || '' } }));
  };

  const toggleProdExpand = (id, prod) => {
    if (expandedProd === id) { setExpandedProd(null); return; }
    setExpandedProd(id);
    if (!productEdit[id]) {
      const sourceImages = prod.images?.length > 0
        ? prod.images.map(img => ({ imageData: img.imageData, price: img.price, description: img.description }))
        : (prod.subImages || []).map((imgData, i) => ({
            imageData: imgData,
            price: i === 0 ? prod.price : '',
            description: i === 0 ? prod.description : '',
          }));
      const imageSlots = Array.from({ length: 3 }, (_, idx) => {
        const img = sourceImages[idx] || null;
        return { existingImg: img, newFile: null, clearKey: 0, price: img ? String(img.price ?? '') : '', description: img?.description || '' };
      });
      setProductEdit(p => ({ ...p, [id]: { name: prod.name, imageKey: prod.imageKey || '', imageSlots } }));
    }
  };

  const toggleOfferExpand = (id, offer) => {
    if (expandedOffer === id) { setExpandedOffer(null); return; }
    setExpandedOffer(id);
    if (!offerEdit[id])
      setOfferEdit(p => ({ ...p, [id]: {
        name: offer.name, description: offer.description || '',
        discountLabel: offer.discountLabel || '',
        existingImageData: offer.imageData || '', imageFile: null, imageRemoved: false,
        productIds: [...(offer.productIds || [])],
      }}));
  };

  const atCatLimit   = categories.length >= CAT_LIMIT;
  const atOfferLimit = offers.length >= OFFER_LIMIT;

  return (
    <div className="admin-page">

      {/* ── Hero ─────────────────────────────── */}
      <div className="hero-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="hero-tag">Admin Dashboard</div>
            <h1 className="hero-title">Manage your shop</h1>
            <p className="hero-desc">Add categories, products and offers to keep your shop fresh.</p>
            <div className="stats-row" style={{ marginTop: '1.2rem', marginBottom: 0 }}>
              <div className="stat-chip">
                <span className="stat-chip-num">
                  {catsLoading ? <span className="skeleton-line" style={{ display:'inline-block', width:'1.4rem', height:'1.1rem', verticalAlign:'middle' }} /> : categories.length}
                </span>
                <span className="stat-chip-label">Categories</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-num">
                  {prodsLoading ? <span className="skeleton-line" style={{ display:'inline-block', width:'1.8rem', height:'1.1rem', verticalAlign:'middle' }} /> : (prodTotal !== null ? prodTotal : products.length)}
                </span>
                <span className="stat-chip-label">Products</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-num">
                  {offersLoading ? <span className="skeleton-line" style={{ display:'inline-block', width:'1.4rem', height:'1.1rem', verticalAlign:'middle' }} /> : offers.length}
                </span>
                <span className="stat-chip-label">Offers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Forms ────────────────────────── */}
      <div className="admin-forms-grid">

        {/* Add Category */}
        <div className="admin-form-card">
          <div className="admin-form-card-head">
            <div className="admin-form-card-icon">⊞</div>
            <div>
              <div className="admin-form-card-title">Add Category</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                {atCatLimit ? `${CAT_LIMIT}/${CAT_LIMIT} — limit reached` : `${categories.length}/${CAT_LIMIT} used`}
              </div>
            </div>
          </div>
          {atCatLimit ? (
            <div className="admin-form-card-body">
              <div className="premium-block">
                <div className="premium-block-icon">👑</div>
                <div className="premium-block-title">Category limit reached</div>
                <p className="premium-block-sub">
                  You've used all 5 free categories. Upgrade to Premium to add unlimited categories.
                </p>
                <div className="premium-block-used">{CAT_LIMIT}/{CAT_LIMIT} slots used</div>
              </div>
            </div>
          ) : (
            <form className="admin-form-card-body" onSubmit={createCategory}>
              <div className="form-field">
                <label className="form-label">Category name</label>
                <input className="form-input" value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g. Keychain, Ring Album, Frame" required />
              </div>
              <div className="form-field">
                <label className="form-label">Description <span style={{ color: 'var(--accent)' }}>*</span></label>
                <textarea className="form-textarea" style={{ minHeight: '80px' }} value={newCategory.description}
                  onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Short description" required />
              </div>
              <div className="form-field">
                <label className="form-label">Category image <span style={{ color: 'var(--accent)' }}>*</span></label>
                <input className="form-input" type="file" accept="image/*" required
                  onChange={e => setNewCategory({ ...newCategory, imageFile: e.target.files?.[0] || null })} />
              </div>
              <div className="form-actions">
                <button className="btn-primary" type="submit" disabled={catCreating}>
                  {catCreating ? 'Creating…' : 'Save category'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Add Product */}
        <div className="admin-form-card">
          <div className="admin-form-card-head">
            <div className="admin-form-card-icon">✦</div>
            <div>
              <div className="admin-form-card-title">Add Product</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                Image 1 required · Images 2 &amp; 3 optional · each with own price &amp; description
              </div>
            </div>
          </div>
          <form className="admin-form-card-body" onSubmit={createProduct}>
            <div className="form-field">
              <label className="form-label">Product name <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input className="form-input" value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="e.g. Handmade keychain set" required />
            </div>
            <div className="form-field">
              <label className="form-label">Category <span style={{ color: 'var(--accent)' }}>*</span></label>
              <select className="form-select" value={newProduct.categoryId}
                onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value, imageKey: '' })} required>
                <option value="">Select category</option>
                {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {[0, 1, 2].map(i => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Image {i + 1}
                  {i === 0
                    ? <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500 }}>★ Required · shown on card</span>
                    : <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>— Optional</span>}
                </div>
                <div className="form-field">
                  <label className="form-label">Photo {i === 0 && <span style={{ color: 'var(--accent)' }}>*</span>}</label>
                  <input className="form-input" type="file" accept="image/*"
                    required={i === 0}
                    onChange={e => {
                      const imgs = newProduct.images.map((img, j) => j === i ? { ...img, imageFile: e.target.files?.[0] || null } : img);
                      setNewProduct({ ...newProduct, images: imgs });
                    }} />
                </div>
                <div className="form-field">
                  <label className="form-label">Price (₹) {i === 0 && <span style={{ color: 'var(--accent)' }}>*</span>}</label>
                  <input className="form-input" type="text" inputMode="numeric"
                    required={i === 0}
                    value={newProduct.images[i].price}
                    placeholder="200"
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const imgs = newProduct.images.map((img, j) => j === i ? { ...img, price: val } : img);
                      setNewProduct({ ...newProduct, images: imgs });
                    }} />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description {i === 0 && <span style={{ color: 'var(--accent)' }}>*</span>}</label>
                  <textarea className="form-textarea" style={{ minHeight: '70px' }}
                    required={i === 0}
                    value={newProduct.images[i].description}
                    placeholder={i === 0 ? 'Product details, materials, dimensions…' : 'Optional — describe this variant'}
                    onChange={e => {
                      const imgs = newProduct.images.map((img, j) => j === i ? { ...img, description: e.target.value } : img);
                      setNewProduct({ ...newProduct, images: imgs });
                    }} />
                </div>
              </div>
            ))}

            <div className="form-actions">
              <button className="btn-primary" type="submit" disabled={prodCreating}>
                {prodCreating ? 'Adding…' : 'Add product'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* ── Categories List ───────────────────── */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Categories</h2>
          <p className="section-sub">
            {catsLoading ? 'Loading…' : categories.length === 0 ? 'No categories yet.' : `${categories.length} collection${categories.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {catsLoading && (
          <div className="admin-list">
            {Array.from({ length: catSkelCount }).map((_, i) => (
              <div key={i} className="admin-item skeleton-item">
                <div className="admin-item-head">
                  <div className="admin-item-info">
                    <div className="skeleton-line" style={{ width: '42%', height: '1rem', marginBottom: '0.4rem' }} />
                    <div className="skeleton-line" style={{ width: '28%', height: '0.72rem' }} />
                  </div>
                  <div className="admin-item-btns" style={{ gap: '0.4rem' }}>
                    <div className="skeleton-line" style={{ width: '2rem', height: '2rem', borderRadius: '50%' }} />
                    <div className="skeleton-line" style={{ width: '2rem', height: '2rem', borderRadius: '50%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!catsLoading && categories.length > 0 && (
          <div className="admin-list">
            {categories.map(cat => {
              const isOpen = expandedCat === cat._id;
              const es = categoryEdit[cat._id] || { name: cat.name, description: cat.description, imageFile: null };
              return (
                <div key={cat._id} className="admin-item">
                  <div className="admin-item-head">
                    <div className="admin-item-info">
                      <div className="admin-item-name">{cat.name}</div>
                      <div className="admin-item-meta">
                        {cat.itemCount || 0} product{cat.itemCount !== 1 ? 's' : ''}
                        {cat.description ? ` · ${cat.description.slice(0, 55)}…` : ''}
                      </div>
                    </div>
                    <div className="admin-item-btns">
                      <button className="btn-icon btn-icon-edit" title={isOpen ? 'Close' : 'Edit'} onClick={() => toggleCatExpand(cat._id, cat)}>
                        {isOpen ? '✕' : '✏'}
                      </button>
                      <button className="btn-icon btn-icon-delete" title="Delete" onClick={() => deleteCategory(cat._id)}>🗑</button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="admin-item-form">
                      <div className="form-field">
                        <label className="form-label">Name</label>
                        <input className="form-input" value={es.name}
                          onChange={e => setCategoryEdit({ ...categoryEdit, [cat._id]: { ...es, name: e.target.value } })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" style={{ minHeight: '80px' }} value={es.description}
                          onChange={e => setCategoryEdit({ ...categoryEdit, [cat._id]: { ...es, description: e.target.value } })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Image</label>
                        {es.existingImageData && !es.imageRemoved ? (
                          <div className="existing-images-row" style={{ marginBottom: '0.5rem' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <div className="existing-image-thumb">
                                <img src={es.existingImageData} alt="Current" />
                              </div>
                              <button className="img-delete-btn" title="Remove"
                                onClick={() => setCategoryEdit({ ...categoryEdit, [cat._id]: { ...es, imageRemoved: true } })}>×</button>
                            </div>
                          </div>
                        ) : (
                          <input
                            key={es.imgClearKey || 0}
                            className="form-input"
                            type="file"
                            accept="image/*"
                            onChange={e => setCategoryEdit({ ...categoryEdit, [cat._id]: { ...es, imageFile: e.target.files?.[0] || null } })} />
                        )}
                      </div>
                      <div className="form-actions">
                        <button className="btn-primary btn-sm" disabled={savingId === cat._id} onClick={() => updateCategory(cat._id)}>
                          {savingId === cat._id ? 'Saving…' : 'Save'}
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => setExpandedCat(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Products List ─────────────────────── */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Products</h2>
          <p className="section-sub">
            {prodsLoading ? 'Loading…' : prodTotal === 0 ? 'No products yet.' : prodTotal !== null ? `${prodTotal} product${prodTotal !== 1 ? 's' : ''}` : 'No products yet.'}
          </p>
        </div>
        <div ref={prodListRef} style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {prodsLoading && (
          <div className="admin-list">
            {Array.from({ length: prodSkelCount }).map((_, i) => (
              <div key={i} className="admin-item skeleton-item">
                <div className="admin-item-head">
                  <div className="admin-item-info">
                    <div className="skeleton-line" style={{ width: '50%', height: '1rem', marginBottom: '0.4rem' }} />
                    <div className="skeleton-line" style={{ width: '35%', height: '0.72rem' }} />
                  </div>
                  <div className="admin-item-btns" style={{ gap: '0.4rem' }}>
                    <div className="skeleton-line" style={{ width: '2rem', height: '2rem', borderRadius: '50%' }} />
                    <div className="skeleton-line" style={{ width: '2rem', height: '2rem', borderRadius: '50%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!prodsLoading && products.length > 0 && (
          <div className="admin-list">
            {products.map(prod => {
              const isOpen = expandedProd === prod._id;
              const es = productEdit[prod._id] || {
                name: prod.name,
                imageKey: prod.imageKey || '',
                imageSlots: Array.from({ length: 3 }, (_, idx) => {
                  const img = (prod.subImages || [])[idx];
                  return { existingImg: img ? { imageData: img, price: '', description: '' } : null, newFile: null, clearKey: 0, price: '', description: '' };
                }),
              };
              return (
                <div key={prod._id} className="admin-item">
                  <div className="admin-item-head">
                    <div className="admin-item-info">
                      <div className="admin-item-name">{prod.name}</div>
                      <div className="admin-item-meta">
                        ₹{Number(prod.price)} · {prod.categoryName}
                        {(prod.subImages?.length || 0) > 0 ? ` · ${prod.subImages.length} image${prod.subImages.length !== 1 ? 's' : ''}` : ''}
                      </div>
                    </div>
                    <div className="admin-item-btns">
                      <button className="btn-icon btn-icon-edit" title={isOpen ? 'Close' : 'Edit'} onClick={() => toggleProdExpand(prod._id, prod)}>
                        {isOpen ? '✕' : '✏'}
                      </button>
                      <button className="btn-icon btn-icon-delete" title="Delete" onClick={() => deleteProduct(prod._id)}>🗑</button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="admin-item-form">
                      <div className="form-field">
                        <label className="form-label">Name</label>
                        <input className="form-input" value={es.name}
                          onChange={e => setProductEdit({ ...productEdit, [prod._id]: { ...es, name: e.target.value } })} />
                      </div>

                      {/* Image slots – always 3 visible; × removes existing, shows Choose File in place */}
                      <div className="form-field">
                        <label className="form-label">
                          Images <span className="form-label-hint">(★ = primary, required)</span>
                        </label>
                        {(es.imageSlots || []).map((slot, idx) => (
                          <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.6rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                              Image {idx + 1}{idx === 0 ? ' ★' : ''}
                            </div>
                            {slot.existingImg ? (
                              <div className="existing-images-row" style={{ marginBottom: '0.5rem' }}>
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <div className="existing-image-thumb">
                                    <img src={slot.existingImg.imageData} alt={`Image ${idx + 1}`} />
                                  </div>
                                  <button className="img-delete-btn" title="Remove" onClick={() => {
                                    const slots = [...es.imageSlots];
                                    slots[idx] = { ...slots[idx], existingImg: null };
                                    setProductEdit({ ...productEdit, [prod._id]: { ...es, imageSlots: slots } });
                                  }}>×</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                  key={slot.clearKey || 0}
                                  className="form-input"
                                  type="file"
                                  accept="image/*"
                                  style={{ flex: 1 }}
                                  onChange={e => {
                                    const slots = [...es.imageSlots];
                                    slots[idx] = { ...slots[idx], newFile: e.target.files?.[0] || null };
                                    setProductEdit({ ...productEdit, [prod._id]: { ...es, imageSlots: slots } });
                                  }} />
                                {slot.newFile && (
                                  <button className="img-delete-btn" style={{ position: 'static', flexShrink: 0 }} title="Clear"
                                    onClick={() => {
                                      const slots = [...es.imageSlots];
                                      slots[idx] = { ...slots[idx], newFile: null, clearKey: (slots[idx].clearKey || 0) + 1 };
                                      setProductEdit({ ...productEdit, [prod._id]: { ...es, imageSlots: slots } });
                                    }}>×</button>
                                )}
                              </div>
                            )}
                            <div className="form-field">
                              <label className="form-label">Price (₹)</label>
                              <input className="form-input" type="text" inputMode="numeric"
                                value={slot.price || ''}
                                placeholder="0"
                                onChange={e => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  const slots = [...es.imageSlots];
                                  slots[idx] = { ...slots[idx], price: val };
                                  setProductEdit({ ...productEdit, [prod._id]: { ...es, imageSlots: slots } });
                                }} />
                            </div>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                              <label className="form-label">Description</label>
                              <textarea className="form-textarea" style={{ minHeight: '60px' }}
                                value={slot.description || ''}
                                placeholder="Description for this variant"
                                onChange={e => {
                                  const slots = [...es.imageSlots];
                                  slots[idx] = { ...slots[idx], description: e.target.value };
                                  setProductEdit({ ...productEdit, [prod._id]: { ...es, imageSlots: slots } });
                                }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="form-actions">
                        <button className="btn-primary btn-sm" disabled={savingId === prod._id} onClick={() => updateProduct(prod._id)}>
                          {savingId === prod._id ? 'Saving…' : 'Save changes'}
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => setExpandedProd(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {prodLoadingMore && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--muted)', fontSize: '0.87rem' }}>
            Loading more…
          </div>
        )}
        </div>
        {!prodsLoading && !prodHasMore && prodTotal !== null && products.length > 0 && (
          <div style={{ textAlign: 'center', padding: '0.6rem 0 0.2rem', color: 'var(--muted)', fontSize: '0.78rem' }}>
            All {prodTotal} product{prodTotal !== 1 ? 's' : ''} shown
          </div>
        )}
      </div>

      {/* ── Offers Section ────────────────────── */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Offers</h2>
          <p className="section-sub">Promotional deals shown on the shop homepage</p>
        </div>
        <div className="admin-form-card" style={{ marginBottom: '1.4rem' }}>
          <div className="admin-form-card-head">
            <div className="admin-form-card-icon" style={{ background: 'var(--grad-gold)' }}>🏷</div>
            <div>
              <div className="admin-form-card-title">Create Offer</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                {atOfferLimit ? `${OFFER_LIMIT}/${OFFER_LIMIT} — limit reached` : `${offers.length}/${OFFER_LIMIT} used · Add a deal with image and linked products`}
              </div>
            </div>
          </div>
          {atOfferLimit ? (
            <div className="admin-form-card-body">
              <div className="premium-block">
                <div className="premium-block-icon">🏷</div>
                <div className="premium-block-title">Offer limit reached</div>
                <p className="premium-block-sub">You've used all {OFFER_LIMIT} offer slots. Delete an existing offer to create a new one.</p>
                <div className="premium-block-used">{OFFER_LIMIT}/{OFFER_LIMIT} slots used</div>
              </div>
            </div>
          ) : null}
          {!atOfferLimit && <form className="admin-form-card-body" onSubmit={createOffer}>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Offer name</label>
                <input className="form-input" value={newOffer.name}
                  onChange={e => setNewOffer({ ...newOffer, name: e.target.value })}
                  placeholder="e.g. Summer Sale" required />
              </div>
              <div className="form-field">
                <label className="form-label">Discount label</label>
                <input className="form-input" value={newOffer.discountLabel}
                  onChange={e => setNewOffer({ ...newOffer, discountLabel: e.target.value })}
                  placeholder="e.g. 20% OFF" />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" style={{ minHeight: '70px' }} value={newOffer.description}
                onChange={e => setNewOffer({ ...newOffer, description: e.target.value })}
                placeholder="Short description" />
            </div>
            <div className="form-field">
              <label className="form-label">Offer image</label>
              <input className="form-input" type="file" accept="image/*"
                onChange={e => setNewOffer({ ...newOffer, imageFile: e.target.files?.[0] || null })} />
            </div>
            <div className="form-field">
              <label className="form-label">
                Link products
                <span className="form-label-hint"> (products shown when offer is clicked)</span>
              </label>
              {offerProductList.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.87rem' }}>Add products first.</p>
              ) : (
                <div className="offer-product-check-grid">
                  {offerProductList.map(p => (
                    <label key={p._id} className="offer-check-item">
                      <input type="checkbox"
                        checked={newOffer.productIds.includes(p._id)}
                        onChange={() => toggleOfferProduct(p._id)} />
                      <span>{p.name} <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>₹{Number(p.price)}</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="form-actions">
              <button className="btn-primary" type="submit" disabled={offerCreating}>
                {offerCreating ? 'Creating…' : 'Create offer'}
              </button>
            </div>
          </form>}
        </div>
        {offersLoading && (
          <div className="admin-list">
            {Array.from({ length: offerSkelCount }).map((_, i) => (
              <div key={i} className="admin-item skeleton-item">
                <div className="admin-item-head">
                  <div className="admin-item-info">
                    <div className="skeleton-line" style={{ width: '38%', height: '1rem', marginBottom: '0.4rem' }} />
                    <div className="skeleton-line" style={{ width: '25%', height: '0.72rem' }} />
                  </div>
                  <div className="admin-item-btns" style={{ gap: '0.4rem' }}>
                    <div className="skeleton-line" style={{ width: '2rem', height: '2rem', borderRadius: '50%' }} />
                    <div className="skeleton-line" style={{ width: '2rem', height: '2rem', borderRadius: '50%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!offersLoading && offers.length > 0 && (
          <div className="admin-list">
            {offers.map(offer => {
              const isOpen = expandedOffer === offer._id;
              const eo = offerEdit[offer._id] || { name: offer.name, description: offer.description || '', discountLabel: offer.discountLabel || '', existingImageData: offer.imageData || '', imageFile: null, imageRemoved: false, productIds: [...(offer.productIds || [])] };
              return (
                <div key={offer._id} className="admin-item">
                  <div className="admin-item-head">
                    <div className="admin-item-info">
                      <div className="admin-item-name">{offer.name}</div>
                      <div className="admin-item-meta">
                        {offer.discountLabel ? `${offer.discountLabel} · ` : ''}
                        {offer.productIds?.length || 0} product{offer.productIds?.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="admin-item-btns">
                      <button className="btn-icon btn-icon-edit" title={isOpen ? 'Close' : 'Edit'} onClick={() => toggleOfferExpand(offer._id, offer)}>
                        {isOpen ? '✕' : '✏'}
                      </button>
                      <button className="btn-icon btn-icon-delete" title="Delete" onClick={() => deleteOffer(offer._id)}>🗑</button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="admin-item-form">
                      <div className="form-row">
                        <div className="form-field">
                          <label className="form-label">Offer name</label>
                          <input className="form-input" value={eo.name}
                            onChange={e => setOfferEdit({ ...offerEdit, [offer._id]: { ...eo, name: e.target.value } })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Discount label</label>
                          <input className="form-input" value={eo.discountLabel}
                            onChange={e => setOfferEdit({ ...offerEdit, [offer._id]: { ...eo, discountLabel: e.target.value } })}
                            placeholder="e.g. 20% OFF" />
                        </div>
                      </div>
                      <div className="form-field">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" style={{ minHeight: '70px' }} value={eo.description}
                          onChange={e => setOfferEdit({ ...offerEdit, [offer._id]: { ...eo, description: e.target.value } })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Image</label>
                        {eo.existingImageData && !eo.imageRemoved ? (
                          <div className="existing-images-row" style={{ marginBottom: '0.5rem' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <div className="existing-image-thumb">
                                <img src={eo.existingImageData} alt="Offer" />
                              </div>
                              <button className="img-delete-btn" title="Remove"
                                onClick={() => setOfferEdit({ ...offerEdit, [offer._id]: { ...eo, imageRemoved: true } })}>×</button>
                            </div>
                          </div>
                        ) : (
                          <input className="form-input" type="file" accept="image/*"
                            onChange={e => setOfferEdit({ ...offerEdit, [offer._id]: { ...eo, imageFile: e.target.files?.[0] || null } })} />
                        )}
                      </div>
                      <div className="form-field">
                        <label className="form-label">
                          Link products
                          <span className="form-label-hint"> (products shown when offer is clicked)</span>
                        </label>
                        {offerProductList.length === 0 ? (
                          <p style={{ color: 'var(--muted)', fontSize: '0.87rem' }}>No products available.</p>
                        ) : (
                          <div className="offer-product-check-grid">
                            {offerProductList.map(p => (
                              <label key={p._id} className="offer-check-item">
                                <input type="checkbox"
                                  checked={eo.productIds.includes(p._id)}
                                  onChange={() => {
                                    const ids = eo.productIds.includes(p._id)
                                      ? eo.productIds.filter(id => id !== p._id)
                                      : [...eo.productIds, p._id];
                                    setOfferEdit({ ...offerEdit, [offer._id]: { ...eo, productIds: ids } });
                                  }} />
                                <span>{p.name} <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>₹{Number(p.price)}</span></span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="form-actions">
                        <button className="btn-primary btn-sm" disabled={savingId === offer._id} onClick={() => updateOffer(offer._id)}>
                          {savingId === offer._id ? 'Saving…' : 'Save changes'}
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => setExpandedOffer(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Confirm Dialog ────────────────────── */}
      {confirmDialog.open && (
        <div className="confirm-overlay" onClick={closeConfirm}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <p className="confirm-msg">{confirmDialog.message}</p>
            <div className="confirm-btns">
              <button className="btn-ghost btn-sm" onClick={closeConfirm}>Cancel</button>
              <button className="btn-danger btn-sm" onClick={handleConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
