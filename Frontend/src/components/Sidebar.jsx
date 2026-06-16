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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const goTo = (path) => { navigate(path); onClose(); };

  const handleSignOut = () => {
    logout();
    onAuthChange();
    onClose();
    navigate('/shop');
  };

  const WA = 'https://wa.me/918098621334?text=Hello%20Afra%20Crafts%2C%20I%20would%20like%20to%20enquire%20about%20your%20handmade%20crafts.';

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
            <span className="sidebar-action-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </span>
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
