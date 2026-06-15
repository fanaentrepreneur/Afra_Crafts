import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './utils/api.js';
import { getRole, loginAdmin, loginUser } from './utils/auth.js';

const QUOTES = [
  'Every gift tells a story. Let your next one be crafted by Afra.',
  'Handmade with love, gifted with heart — that\'s the Afra way.',
  'The most precious things come wrapped in creativity and care.',
  'A handcrafted gift is a piece of the maker\'s heart given away.',
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const role = getRole();
    if (role === 'admin') navigate('/admin');
    if (role === 'user') navigate('/shop');
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setQuoteIdx(i => (i + 1) % QUOTES.length);
        setFading(false);
      }, 500);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!username.trim()) {
      setMessage('Please enter your name to continue.');
      return;
    }
    try {
      const res = await api.post('/auth/login', { username, password });
      const { role, username: fullName } = res.data;
      if (role === 'admin') {
        loginAdmin();
        navigate('/admin');
      } else {
        if (!loginUser(fullName)) {
          setMessage('Unable to sign in. Please try again.');
          return;
        }
        navigate('/shop');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Sign in failed. Please try again.');
    }
  };

  return (
    <div className="login-page">

      {/* ── Left decorative panel ───────────── */}
      <div className="login-visual">
        <div className="login-deco-ring login-deco-1" />
        <div className="login-deco-ring login-deco-2" />

        <div className="login-visual-content">
          <div className="login-brand-badge">✦ Afra Crafts</div>

          <h1 className="login-visual-title">
            Handmade gifts,<br />
            <em>crafted with love.</em>
          </h1>

          <div className="login-quote-box">
            <span className="quote-mark">"</span>
            <p className={`login-rotating-quote${fading ? ' fading' : ''}`}>
              {QUOTES[quoteIdx]}
            </p>
          </div>

          <ul className="login-features">
            <li><span className="login-feat-dot" />Premium handcrafted keychains</li>
            <li><span className="login-feat-dot" />Personalized ring albums</li>
            <li><span className="login-feat-dot" />Custom photo frames</li>
            <li><span className="login-feat-dot" />Perfect for every occasion</li>
          </ul>
        </div>
      </div>

      {/* ── Right form panel ────────────────── */}
      <div className="login-form-panel">
        <div className="login-form-box">

          <div className="login-logo-row">
            <div className="login-logo-icon">A</div>
            <span className="login-logo-name">Afra Crafts</span>
          </div>

          <h2 className="login-form-heading">Welcome back</h2>
          <p className="login-form-sub">Sign in to continue to your shop</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Name / Username</label>
              <input
                className="form-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your name or admin username"
                autoFocus
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Password&nbsp;
                <span className="form-label-hint">(admin only)</span>
              </label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank if you're a customer"
              />
            </div>

            {message && <p className="form-msg">{message}</p>}

            <button className="btn-primary btn-full" type="submit">
              Continue →
            </button>
          </form>

          <p className="login-hint">
            Customers sign in with just their name — no password needed.
            <br />
            Admin accounts require a username and password.
          </p>
        </div>
      </div>

    </div>
  );
}
