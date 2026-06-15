import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { getUserName, getUsername, logout } from '../utils/auth.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ProfilePopup({ onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [view, setView] = useState('main');
  const [newPwd, setNewPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const name = getUserName();
  const username = getUsername();

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (!newPwd.trim()) return;
    setLoading(true);
    try {
      await api.put('/auth/change-password', { username, newPassword: newPwd });
      toast('Password updated!', 'success');
      setView('main');
      setNewPwd('');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    onClose();
    navigate('/shop');
  };

  return (
    <div className="profile-popup">
      {view === 'main' ? (
        <>
          <div className="profile-popup-avatar">{name?.[0]?.toUpperCase() || 'A'}</div>
          <div className="profile-popup-name">{name}</div>
          <div className="profile-popup-role">Administrator</div>
          <div className="profile-popup-divider" />
          <button className="profile-popup-action" onClick={() => setView('change')}>
            🔑 Change Password
          </button>
          <button className="profile-popup-action danger" onClick={handleSignOut}>
            ⎋ Sign Out
          </button>
        </>
      ) : (
        <form onSubmit={handleChangePwd}>
          <button type="button" className="profile-popup-back" onClick={() => setView('main')}>
            ← Back
          </button>
          <div className="profile-popup-name" style={{ marginTop: '0.3rem' }}>New Password</div>
          <div className="form-field" style={{ marginTop: '0.7rem' }}>
            <input className="form-input" type="password" value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="Enter new password" autoFocus />
          </div>
          <button className="btn-primary btn-full btn-sm" type="submit" disabled={loading}
            style={{ marginTop: '0.4rem' }}>
            {loading ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}
