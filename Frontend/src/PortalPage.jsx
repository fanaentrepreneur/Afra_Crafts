import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './utils/api.js';
import { getImageOptions, getImageUrl } from './data/imageAssets.js';
import { getRole, getUserName, isAdmin, logout } from './utils/auth.js';
import { fileToBase64, getProductImageUrl } from './utils/imageUpload.js';
import CategoryCard from './components/CategoryCard.jsx';
import ProductCard from './components/ProductCard.jsx';

function PortalPage() {
  const navigate = useNavigate();
  const role = getRole();
  const admin = isAdmin();
  const username = getUserName();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', categoryId: '', imageKey: '', imageFile: null });
  const [editProduct, setEditProduct] = useState({});

  useEffect(() => {
    if (!role) {
      navigate('/');
      return;
    }
    loadData();
  }, [role]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([api.get('/categories'), api.get('/products')]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      if (!selectedCategory && catRes.data.length) setSelectedCategory(catRes.data[0]);
      if (selectedCategory) {
        const found = catRes.data.find((cat) => cat._id === selectedCategory._id);
        setSelectedCategory(found || catRes.data[0] || null);
      }
    } catch (err) {
      setMessage('Unable to load shop data right now.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ value: cat._id, label: cat.name, slug: cat.slug })),
    [categories]
  );

  const visibleProducts = selectedCategory
    ? products.filter((item) => item.category === selectedCategory._id)
    : products;

  const selectedCategorySlug = selectedCategory?.slug?.replace(/-/g, '') || '';
  const imageChoices = getImageOptions(selectedCategorySlug);
  const selectedCategoryCount = visibleProducts.length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setMessage('');
  };

  const createCategory = async (event) => {
    event.preventDefault();
    try {
      await api.post('/categories', newCategory);
      setNewCategory({ name: '', description: '' });
      setMessage('Category added successfully.');
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to add category.');
    }
  };

  const createProduct = async (event) => {
    event.preventDefault();
    try {
      const category = categories.find((cat) => cat._id === newProduct.categoryId);
      if (!category) {
        setMessage('Please select a category for the new product.');
        return;
      }
      
      let imageData = '';
      let imageUrl = '';
      
      if (newProduct.imageFile) {
        imageData = await fileToBase64(newProduct.imageFile);
      } else {
        const image = getImageOptions(category.slug.replace(/-/g, '')).find((item) => item.key === newProduct.imageKey);
        imageUrl = image?.src || '';
      }

      await api.post('/products', {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        categoryId: newProduct.categoryId,
        imageKey: newProduct.imageKey,
        imageUrl,
        imageData,
      });
      setNewProduct({ name: '', price: '', description: '', categoryId: '', imageKey: '', imageFile: null });
      setMessage('Product added successfully.');
      await loadData();
    } catch (err) {
      const error = err.response?.data?.error;
      setMessage(error || 'Unable to add product.');
    }
  };

  const updateProduct = async (productId) => {
    const updated = editProduct[productId];
    if (!updated) return;
    try {
      const category = categories.find((cat) => cat._id === updated.categoryId);
      const image = getImageOptions(category?.slug?.replace(/-/g, '') || '').find((item) => item.key === updated.imageKey);
      await api.put(`/products/${productId}`, {
        ...updated,
        price: parseFloat(updated.price),
        imageUrl: image?.src || updated.imageUrl || '',
      });
      setMessage('Product updated successfully.');
      setEditProduct((prev) => ({ ...prev, [productId]: undefined }));
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to update product.');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setMessage('Product deleted successfully.');
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Unable to delete product.');
    }
  };

  const productImageUrl = (product) => {
    if (product.imageData) return product.imageData;
    if (product.imageUrl) return product.imageUrl;
    return getImageUrl(product.categorySlug?.replace(/-/g, '') || '', product.imageKey);
  };

  return (
    <div className="page-shell sidebar-layout">
      <aside className="sidebar-panel section-card">
        <div className="sidebar-header">
          <h2>{admin ? 'Admin portal' : 'Customer portal'}</h2>
          <p className="text-muted">Browse categories and handcrafted designs.</p>
        </div>

        <div className="category-list">
          {loading ? (
            <p className="text-muted">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-muted">No categories yet. Admin can add categories.</p>
          ) : (
            categories.map((category) => (
              <CategoryCard
                key={category._id}
                category={category}
                onSelect={handleCategorySelect}
                selected={selectedCategory?._id === category._id}
                isAdmin={admin}
                onEdit={(cat) => {
                  setNewCategory({ name: cat.name, description: cat.description });
                  setMessage('Edit the category values above and save with the add button.');
                }}
              />
            ))
          )}
        </div>

        <div className="sidebar-box">
          <h3>{admin ? `Hi admin, ${username}` : `Hi ${username || 'guest'}`}</h3>
          <p className="text-muted">
            {admin
              ? 'Use the portal to manage products and categories in the same shop view.'
              : 'Tap a category to explore handmade items, then contact us on WhatsApp.'}
          </p>
          <button className="button-secondary" type="button" onClick={handleLogout}>
            Logout
          </button>

          {admin && selectedCategory && selectedCategoryCount >= 5 && (
            <p className="message">
              Premium option: category photo limit reached. Upgrade if you want more than 5 images per category.
            </p>
          )}
        </div>
      </aside>

      <section className="main-panel">
        <section className="section-card">
          <div className="control-row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2>{selectedCategory ? selectedCategory.name : 'All products'}</h2>
              <p className="text-muted">{selectedCategory?.description || 'Select a category to see available products.'}</p>
            </div>
            {admin && (
              <button className="button-primary" type="button" onClick={() => setMessage('Use the add sections below to create products and categories.')}>Add item</button>
            )}
          </div>
        </section>

        {admin && (
          <section className="section-card">
            <h2>Admin controls</h2>
            <div className="form-grid">
              <form onSubmit={createCategory}>
                <label>
                  New category name
                  <input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Keychain, Ring Album, Frame"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="Add a category description"
                  />
                </label>
                <div className="form-actions">
                  <button className="button-primary" type="submit">Save category</button>
                </div>
              </form>

              <form onSubmit={createProduct}>
                <label>
                  Product name
                  <input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Handmade keychain set"
                  />
                </label>
                <label>
                  Price
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="200"
                  />
                </label>
                <label>
                  Category
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value, imageKey: '' })}
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Upload image from phone/computer
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewProduct({ ...newProduct, imageFile: e.target.files?.[0] || null })}
                  />
                  <small className="text-muted">Or select from preset images below</small>
                </label>
                <label>
                  Image reference
                  <select
                    value={newProduct.imageKey}
                    onChange={(e) => setNewProduct({ ...newProduct, imageKey: e.target.value })}
                  >
                    <option value="">Select image</option>
                    {getImageOptions(
                      categories.find((cat) => cat._id === newProduct.categoryId)?.slug.replace(/-/g, '') || ''
                    ).map((image) => (
                      <option key={image.key} value={image.key}>{image.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Description
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Add product description"
                  />
                </label>
                <div className="form-actions">
                  <button className="button-primary" type="submit">Add product</button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className="section-card">
          <div className="grid-3">
            {loading ? (
              <p className="text-muted">Loading products...</p>
            ) : visibleProducts.length === 0 ? (
              <p className="text-muted">No products available. {admin ? 'Add one from the controls above.' : 'Please check back later.'}</p>
            ) : (
              visibleProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  imageUrl={productImageUrl(product)}
                  isAdmin={admin}
                  onEdit={() => setEditProduct({
                    ...editProduct,
                    [product._id]: {
                      name: product.name,
                      price: product.price,
                      description: product.description,
                      categoryId: product.category,
                      imageKey: product.imageKey,
                      imageUrl: product.imageUrl,
                    },
                  })}
                  onDelete={() => deleteProduct(product._id)}
                />
              ))
            )}
          </div>
        </section>

        {admin && Object.keys(editProduct).length > 0 && (
          <section className="section-card">
            <h2>Edit product</h2>
            {Object.entries(editProduct).map(([productId, productDraft]) => (
              productDraft ? (
                <div key={productId} className="form-grid">
                  <label>
                    Product name
                    <input
                      value={productDraft.name}
                      onChange={(e) => setEditProduct((prev) => ({
                        ...prev,
                        [productId]: { ...prev[productId], name: e.target.value },
                      }))}
                    />
                  </label>
                  <label>
                    Price
                    <input
                      type="number"
                      value={productDraft.price}
                      onChange={(e) => setEditProduct((prev) => ({
                        ...prev,
                        [productId]: { ...prev[productId], price: e.target.value },
                      }))}
                    />
                  </label>
                  <label>
                    Image reference
                    <select
                      value={productDraft.imageKey}
                      onChange={(e) => setEditProduct((prev) => ({
                        ...prev,
                        [productId]: { ...prev[productId], imageKey: e.target.value },
                      }))}
                    >
                      <option value="">Select image</option>
                      {getImageOptions(
                        categories.find((cat) => cat._id === productDraft.categoryId)?.slug.replace(/-/g, '') || ''
                      ).map((image) => (
                        <option key={image.key} value={image.key}>{image.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Description
                    <textarea
                      value={productDraft.description}
                      onChange={(e) => setEditProduct((prev) => ({
                        ...prev,
                        [productId]: { ...prev[productId], description: e.target.value },
                      }))}
                    />
                  </label>
                  <div className="form-actions">
                    <button className="button-primary" type="button" onClick={() => updateProduct(productId)}>Save changes</button>
                  </div>
                </div>
              ) : null
            ))}
          </section>
        )}

        {message && <p className="message">{message}</p>}
      </section>
    </div>
  );
}

export default PortalPage;
