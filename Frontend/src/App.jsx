import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import logoImg from '../assests/Logo/WhatsApp Image 2026-06-13 at 21.45.14.jpeg';
import HomePage from './HomePage.jsx';
import AdminPage from './AdminPage.jsx';
import { getRole } from './utils/auth.js';
import Sidebar from './components/Sidebar.jsx';
import LogoPopup from './components/LogoPopup.jsx';

export default function App() {
  /* Reactive auth state — source of truth for all header/route logic */
  const [authRole,    setAuthRole]    = useState(() => getRole());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [popupOpen,   setPopupOpen]   = useState(false);

  const handleAuthChange = () => setAuthRole(getRole());

  return (
    <div className="app-shell">

      {/* ── Header ──────────────────────────── */}
      <header className="app-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <span className="ham-line" />
          <span className="ham-line" />
          <span className="ham-line" />
        </button>

        {/* Brand name — click to open sign-in / profile popup */}
        <div className="brand-popup-wrap">
          <div className="app-brand-display">
            <button
              className="app-brand-btn"
              onClick={() => setPopupOpen(p => !p)}
              aria-label="Open account menu"
            >
              <div className="brand-text">
                <strong>
                  {'Afra'.split('').map((ch, i) => (
                    <span
                      key={i}
                      className="brand-letter brand-letter-left"
                      style={{ animationDelay: `${0.05 + i * 0.07}s` }}
                    >{ch}</span>
                  ))}
                  <span className="brand-word-space" />
                  {'Crafts'.split('').map((ch, i) => (
                    <span
                      key={i + 5}
                      className="brand-letter brand-letter-right"
                      style={{ animationDelay: `${0.33 + i * 0.07}s` }}
                    >{ch}</span>
                  ))}
                </strong>
                <span className="brand-subtitle" style={{ animationDelay: '0.80s' }}>Handmade gifts</span>
              </div>
            </button>
          </div>

          {popupOpen && (
            <LogoPopup
              onClose={() => setPopupOpen(false)}
              onAuthChange={handleAuthChange}
              isLoggedIn={authRole === 'admin'}
            />
          )}
        </div>

      </header>

      {/* ── Sidebar ─────────────────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        authRole={authRole}
        onAuthChange={handleAuthChange}
      />

      {/* ── Routes ──────────────────────────── */}
      <Routes>
        <Route path="/"      element={<Navigate to="/shop" replace />} />
        <Route path="/shop"  element={<HomePage />} />
        <Route path="/admin" element={
          authRole === 'admin'
            ? <AdminPage />
            : <Navigate to="/shop" replace />
        } />
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>

      <footer className="app-footer">
        <p>© 2021 Afra Crafts · Handmade gifts for every occasion</p>
      </footer>
    </div>
  );
}
