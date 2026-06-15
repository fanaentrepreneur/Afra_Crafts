import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assests/Logo/WhatsApp Image 2026-06-13 at 21.45.14.jpeg';
import api from '../utils/api.js';
import { logout } from '../utils/auth.js';

export default function Sidebar({ isOpen, onClose, authRole, onAuthChange }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const isAdmin = authRole === 'admin';

  useEffect(() => {
    if (isOpen) {
      api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    }
  }, [isOpen]);

  const goTo = (path) => { navigate(path); onClose(); };

  const handleSignOut = () => {
    logout();
    onAuthChange();
    onClose();
    navigate('/shop');
  };

  const WA = 'https://wa.me/919999999999?text=Hello%20Afra%20Crafts%2C%20I%20would%20like%20to%20enquire%20about%20your%20handmade%20crafts.';

  return (
    <>
      <div className={`sidebar-overlay${isOpen ? ' visible' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar${isOpen ? ' open' : ''}`} aria-hidden={!isOpen}>

        {/* Brand */}
        <div className="sidebar-brand">
          <img src={logoImg} alt="Afra Crafts" className="sidebar-logo-img" />
          <div className="sidebar-brand-text">
            <strong>Afra Crafts</strong>
            <span>Handmade with love</span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">×</button>
        </div>

        {/* Collections */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Collections</div>
          <button className="sidebar-cat-item" onClick={() => goTo('/shop')}>
            <span className="sidebar-cat-icon">⊞</span>
            All Collections
          </button>
          {categories.map(cat => (
            <button key={cat._id} className="sidebar-cat-item" onClick={() => goTo(`/shop?cat=${cat._id}`)}>
              <span className="sidebar-cat-icon">✦</span>
              <span className="sidebar-cat-name">{cat.name}</span>
              <span className="sidebar-cat-badge">{cat.itemCount || 0}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-grow" />

        {/* Footer actions */}
        <div className="sidebar-footer">
          {isAdmin && (
            <button className="sidebar-action-btn admin-btn" onClick={() => goTo('/admin')}>
              <span className="sidebar-action-icon">⚙</span>
              Dashboard
            </button>
          )}
          <a className="sidebar-action-btn whatsapp-btn" href={WA} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            <span className="sidebar-action-icon">💬</span>
            WhatsApp us
          </a>
          {isAdmin && (
            <button className="sidebar-action-btn signout-btn" onClick={handleSignOut}>
              <span className="sidebar-action-icon">⎋</span>
              Sign Out
            </button>
          )}
        </div>

      </aside>
    </>
  );
}
