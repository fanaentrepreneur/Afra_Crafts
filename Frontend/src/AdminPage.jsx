import { useEffect, useMemo, useState } from 'react';
import api from './utils/api.js';
import { getImageOptions } from './data/imageAssets.js';
import { fileToBase64 } from './utils/imageUpload.js';
import { useToast } from './context/ToastContext.jsx';

const CAT_LIMIT = 5;

export default function AdminPage() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [offers,     setOffers]     = useState([]);

  const [newCategory, setNewCategory] = useState({ name: '', description: '', imageFile: null });
  const [newProduct,  setNewProduct]  = useState({
    name: '', price: '', description: '', categoryId: '', imageKey: '',
    imageFiles: [null, null, null],
  });
  const [newOffer, setNewOffer] = useState({
    name: '', description: '', discountLabel: '', imageFile: null, productIds: [],
  });

  const [categoryEdit, setCategoryEdit] = useState({});
  const [productEdit,  setProductEdit]  = useState({});
  const [expandedCat,  setExpandedCat]  = useState(null);
  const [expandedProd, setExpandedProd] = useState(null);

  const [catCreating,  setCatCreating]  = useState(false);
  const [prodCreating, setProdCreating] = useState(false);
  const [offerCreating, setOfferCreating] = useState(false);
  const [savingId,     setSavingId]     = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [catRes, prodRes, offerRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products'),
        api.get('/offers/all'),
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      setOffers(offerRes.data);
    } catch {
      toast('Unable to load data. Please refresh.', 'error');
    }
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

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its products?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast('Category removed.', 'success');
      await loadData();
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to delete.', 'error');
    }
  };

  /* ── Product CRUD ──────────────────────── */
  const createProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.categoryId) { toast('Please select a category.', 'error'); return; }
    setProdCreating(true);
    try {
      const converted = await Promise.all(
        newProduct.imageFiles.map(f => f ? fileToBase64(f) : null)
      );
      const subImages = converted.filter(Boolean);
      if (subImages.length === 0) { toast('Please add at least 1 image.', 'error'); return; }

      await api.post('/products', {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        categoryId: newProduct.categoryId,
        imageKey: newProduct.imageKey,
        subImages,
      });
      setNewProduct({ name: '', price: '', description: '', categoryId: '', imageKey: '', imageFiles: [null, null, null] });
      e.target.reset();
      toast('Product added!', 'success');
      await loadData();
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to add product.', 'error');
    } finally {
      setProdCreating(false);
    }
  };

  const updateProduct = async (id) => {
    const upd = productEdit[id];
    if (!upd) return;
    setSavingId(id);
    try {
      const newConverted = await Promise.all(
        (upd.newImageFiles || []).map(f => f ? fileToBase64(f) : null)
      );
      const newFiltered = newConverted.filter(Boolean);
      const combined = [...(upd.existingImages || []), ...newFiltered].slice(0, 3);

      await api.put(`/products/${id}`, {
        name: upd.name,
        price: parseFloat(upd.price),
        description: upd.description,
        imageKey: upd.imageKey,
        subImages: combined,
      });
      toast('Product updated!', 'success');
      setProductEdit(p => ({ ...p, [id]: undefined }));
      setExpandedProd(null);
      await loadData();
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to update.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const deleteProductImage = async (productId, imgIndex) => {
    const upd = productEdit[productId];
    if (!upd) return;
    const updated = upd.existingImages.filter((_, i) => i !== imgIndex);
    setProductEdit(p => ({ ...p, [productId]: { ...upd, existingImages: updated } }));
    try {
      await api.put(`/products/${productId}`, { subImages: updated });
      toast('Image deleted.', 'success');
      await loadData();
    } catch {
      setProductEdit(p => ({ ...p, [productId]: upd }));
      toast('Could not delete image.', 'error');
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast('Product removed.', 'success');
      await loadData();
    } catch (err) {
      toast(err.response?.data?.error || 'Unable to delete.', 'error');
    }
  };

  /* ── Offer CRUD ────────────────────────── */
  const createOffer = async (e) => {
    e.preventDefault();
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

  const deleteOffer = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await api.delete(`/offers/${id}`);
      toast('Offer removed.', 'success');
      await loadData();
    } catch {
      toast('Unable to delete.', 'error');
    }
  };

  const toggleOfferProduct = (pid) =>
    setNewOffer(p => ({
      ...p,
      productIds: p.productIds.includes(pid)
        ? p.productIds.filter(id => id !== pid)
        : [...p.productIds, pid],
    }));

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
    if (!productEdit[id])
      setProductEdit(p => ({
        ...p,
        [id]: {
          name: prod.name, price: prod.price, description: prod.description,
          imageKey: prod.imageKey || '',
          existingImages: [...(prod.subImages || [])],
          newImageFiles: [null, null, null],
        },
      }));
  };

  const atCatLimit = categories.length >= CAT_LIMIT;

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
                  {categories.length}<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--muted)' }}></span>
                </span>
                <span className="stat-chip-label">Categories</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-num">{products.length}</span>
                <span className="stat-chip-label">Products</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-num">{offers.length}</span>
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
                <label className="form-label">Description</label>
                <textarea className="form-textarea" style={{ minHeight: '80px' }} value={newCategory.description}
                  onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Short description" />
              </div>
              <div className="form-field">
                <label className="form-label">Category image</label>
                <input className="form-input" type="file" accept="image/*"
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
                Add up to 3 images — first shown on card
              </div>
            </div>
          </div>
          <form className="admin-form-card-body" onSubmit={createProduct}>
            <div className="form-field">
              <label className="form-label">Product name</label>
              <input className="form-input" value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="e.g. Handmade keychain set" required />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Price (₹)</label>
                <input className="form-input" type="number" min="0" step="0.1" value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="200" required />
              </div>
              <div className="form-field">
                <label className="form-label">Category</label>
                <select className="form-select" value={newProduct.categoryId}
                  onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value, imageKey: '' })} required>
                  <option value="">Select category</option>
                  {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Product images
                <span className="form-label-hint"> (up to 3 · first shown on card)</span>
              </label>
              <div className="image-slots">
                {[0, 1, 2].map(i => (
                  <div key={i} className="image-slot">
                    <span className="image-slot-label">Image {i + 1}{i === 0 ? ' ★' : ''}</span>
                    <input className="form-input" type="file" accept="image/*"
                      onChange={e => {
                        const files = [...newProduct.imageFiles];
                        files[i] = e.target.files?.[0] || null;
                        setNewProduct({ ...newProduct, imageFiles: files });
                      }} />
                  </div>
                ))}
              </div>
            </div>

            {selectedImageOptions.length > 0 && (
              <div className="form-field">
                <label className="form-label">Or use preset image</label>
                <select className="form-select" value={newProduct.imageKey}
                  onChange={e => setNewProduct({ ...newProduct, imageKey: e.target.value })}>
                  <option value="">None</option>
                  {selectedImageOptions.map(img => <option key={img.key} value={img.key}>{img.label}</option>)}
                </select>
              </div>
            )}

            <div className="form-field">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" style={{ minHeight: '80px' }} value={newProduct.description}
                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Product details, materials, dimensions..." />
            </div>
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
            {categories.length === 0 ? 'No categories yet.' : `${categories.length} collection${categories.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {categories.length > 0 && (
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
                        <label className="form-label">
                          Image
                          <span className="form-label-hint"> (leave empty to keep current)</span>
                        </label>
                        {es.existingImageData && !es.imageFile && (
                          <div className="existing-images-row" style={{ marginBottom: '0.5rem' }}>
                            <div className="existing-image-thumb">
                              <img src={es.existingImageData} alt="Current" />
                            </div>
                          </div>
                        )}
                        <input className="form-input" type="file" accept="image/*"
                          onChange={e => setCategoryEdit({ ...categoryEdit, [cat._id]: { ...es, imageFile: e.target.files?.[0] || null } })} />
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
            {products.length === 0 ? 'No products yet.' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {products.length > 0 && (
          <div className="admin-list">
            {products.map(prod => {
              const isOpen = expandedProd === prod._id;
              const es = productEdit[prod._id] || {
                name: prod.name, price: prod.price, description: prod.description,
                imageKey: prod.imageKey || '',
                existingImages: [...(prod.subImages || [])],
                newImageFiles: [null, null, null],
              };
              const slotsAvailable = Math.max(0, 3 - (es.existingImages || []).length);
              return (
                <div key={prod._id} className="admin-item">
                  <div className="admin-item-head">
                    <div className="admin-item-info">
                      <div className="admin-item-name">{prod.name}</div>
                      <div className="admin-item-meta">
                        ₹{Number(prod.price).toFixed(0)} · {prod.categoryName}
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
                      <div className="form-row">
                        <div className="form-field">
                          <label className="form-label">Name</label>
                          <input className="form-input" value={es.name}
                            onChange={e => setProductEdit({ ...productEdit, [prod._id]: { ...es, name: e.target.value } })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Price (₹)</label>
                          <input className="form-input" type="number" min="0" step="0.1" value={es.price}
                            onChange={e => setProductEdit({ ...productEdit, [prod._id]: { ...es, price: e.target.value } })} />
                        </div>
                      </div>

                      {/* Existing images */}
                      {(es.existingImages || []).length > 0 && (
                        <div className="form-field">
                          <label className="form-label">
                            Current images
                            <span className="form-label-hint"> (click × to delete)</span>
                          </label>
                          <div className="existing-images-row">
                            {es.existingImages.map((img, idx) => (
                              <div key={idx} className="existing-image-thumb">
                                <img src={img} alt={`Image ${idx + 1}`} />
                                <button
                                  className="img-delete-btn"
                                  onClick={() => deleteProductImage(prod._id, idx)}
                                  title="Delete this image"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New image slots */}
                      {slotsAvailable > 0 && (
                        <div className="form-field">
                          <label className="form-label">
                            Add new images
                            <span className="form-label-hint"> ({slotsAvailable} slot{slotsAvailable !== 1 ? 's' : ''} available)</span>
                          </label>
                          <div className="image-slots">
                            {Array.from({ length: slotsAvailable }).map((_, i) => (
                              <div key={i} className="image-slot">
                                <span className="image-slot-label">Image {(es.existingImages || []).length + i + 1}</span>
                                <input className="form-input" type="file" accept="image/*"
                                  onChange={e => {
                                    const files = [...(es.newImageFiles || [null, null, null])];
                                    files[i] = e.target.files?.[0] || null;
                                    setProductEdit({ ...productEdit, [prod._id]: { ...es, newImageFiles: files } });
                                  }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="form-field">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" style={{ minHeight: '80px' }} value={es.description}
                          onChange={e => setProductEdit({ ...productEdit, [prod._id]: { ...es, description: e.target.value } })} />
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
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>Add a deal with image and linked products</div>
            </div>
          </div>
          <form className="admin-form-card-body" onSubmit={createOffer}>
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
              {products.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.87rem' }}>Add products first.</p>
              ) : (
                <div className="offer-product-check-grid">
                  {products.map(p => (
                    <label key={p._id} className="offer-check-item">
                      <input type="checkbox"
                        checked={newOffer.productIds.includes(p._id)}
                        onChange={() => toggleOfferProduct(p._id)} />
                      <span>{p.name} <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>₹{Number(p.price).toFixed(0)}</span></span>
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
          </form>
        </div>
        {offers.length > 0 && (
          <div className="admin-list">
            {offers.map(offer => (
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
                    <button className="btn-icon btn-icon-delete" title="Delete" onClick={() => deleteOffer(offer._id)}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
