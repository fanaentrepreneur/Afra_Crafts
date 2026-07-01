import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { setAdminSession, logout, getUserName, getUsername } from '../utils/auth.js';
import { useToast } from '../context/ToastContext.jsx';

export default function LogoPopup({ onClose, onAuthChange, isLoggedIn }) {
  const navigate  = useNavigate();
  const toast     = useToast();

  const [view,       setView]       = useState(isLoggedIn ? 'profile' : 'signin');
  const [username,   setUsername]   = useState('');
  const [password,   setPassword]   = useState('');
  const [signinErr,  setSigninErr]  = useState('');
  const [signinBusy, setSigninBusy] = useState(false);
  const [newPwd,     setNewPwd]     = useState('');
  const [pwdBusy,    setPwdBusy]    = useState(false);

  const name           = getUserName();
  const storedUsername = getUsername();

  useEffect(() => {
    setView(isLoggedIn ? 'profile' : 'signin');
  }, [isLoggedIn]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* ── Sign in ───────────────────────────── */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSigninErr('');
    if (!username.trim() || !password) { setSigninErr('Username and password are required.'); return; }
    setSigninBusy(true);
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      const { role, username: fullName, rawUsername } = res.data;
      if (role === 'admin') {
        setAdminSession(rawUsername || username.trim().toLowerCase(), fullName);
        toast(`Welcome, ${fullName}!`, 'success');
        onClose();
        onAuthChange();
        navigate('/admin');
      } else {
        setSigninErr('This account does not have admin access.');
      }
    } catch (err) {
      setSigninErr(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setSigninBusy(false);
    }
  };

  /* ── Change password ───────────────────── */
  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (!newPwd.trim()) return;
    if (!storedUsername) { toast('Session expired — please sign in again.', 'error'); return; }
    setPwdBusy(true);
    try {
      await api.put('/auth/change-password', { username: storedUsername, newPassword: newPwd });
      toast('Password updated successfully!', 'success');
      setView('profile');
      setNewPwd('');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update password.', 'error');
    } finally {
      setPwdBusy(false);
    }
  };

  /* ── Sign out — only called from explicit button click ── */
  const handleSignOut = () => {
    logout();
    onClose();
    onAuthChange();
    navigate('/shop');
  };

  const content = (
    <>
      <div className="logo-popup-backdrop" onClick={onClose} />
      <div className="logo-popup">

        {/* ── Sign in view ─────────────────── */}
        {view === 'signin' && (
          <div className="logo-popup-signin">
            <div className="lp-avatar">A</div>
            <p className="lp-title">Admin Sign In</p>
            <p className="lp-sub">Enter your credentials to access the dashboard</p>
            <form onSubmit={handleSignIn} style={{ marginTop: '1rem' }}>
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
              {signinErr && <p className="form-msg">{signinErr}</p>}
              <button className="btn-primary btn-full" type="submit" disabled={signinBusy}
                style={{ marginTop: '0.6rem' }}>
                {signinBusy ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>
          </div>
        )}

        {/* ── Profile view ─────────────────── */}
        {view === 'profile' && (
          <div className="logo-popup-profile">
            <div className="lp-avatar">{name?.[0]?.toUpperCase() || 'A'}</div>
            <p className="lp-title">{name}</p>
            <p className="lp-sub">Administrator</p>
            <div className="lp-divider" />
            <button className="lp-action" onClick={() => setView('change-password')}>
              🔑 Change Password
            </button>
            <button className="lp-action danger" onClick={handleSignOut}>
              ⎋ Sign Out
            </button>
          </div>
        )}

        {/* ── Change password view ─────────── */}
        {view === 'change-password' && (
          <div className="logo-popup-profile">
            <button type="button" className="lp-back" onClick={() => setView('profile')}>
              ← Back
            </button>
            <p className="lp-title" style={{ marginTop: '0.5rem' }}>Change Password</p>
            <form onSubmit={handleChangePwd} style={{ marginTop: '0.8rem' }}>
              <div className="form-field">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Enter new password" autoFocus />
              </div>
              <button className="btn-primary btn-full btn-sm" type="submit" disabled={pwdBusy}
                style={{ marginTop: '0.4rem' }}>
                {pwdBusy ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

      </div>
    </>
  );

  return createPortal(content, document.body);
}
