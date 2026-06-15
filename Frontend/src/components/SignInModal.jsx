import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { setAdminSession } from '../utils/auth.js';
import { useToast } from '../context/ToastContext.jsx';

export default function SignInModal({ onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) { setError('Username and password are required.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      const { role, username: fullName, rawUsername } = res.data;
      if (role === 'admin') {
        setAdminSession(rawUsername || username.trim(), fullName);
        toast(`Welcome back, ${fullName}!`, 'success');
        onClose();
        navigate('/admin');
      } else {
        setError('This account does not have admin access.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="signin-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="signin-modal-icon">A</div>
        <h2 className="signin-modal-title">Admin Sign In</h2>
        <p className="signin-modal-sub">Enter your credentials to access the dashboard</p>
        <form onSubmit={handleSubmit} style={{ marginTop: '1.2rem' }}>
          <div className="form-field">
            <label className="form-label">Username</label>
            <input className="form-input" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Admin username" autoFocus autoComplete="username" />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password" autoComplete="current-password" />
          </div>
          {error && <p className="form-msg">{error}</p>}
          <button className="btn-primary btn-full" type="submit" disabled={loading}
            style={{ marginTop: '0.8rem' }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );
}
