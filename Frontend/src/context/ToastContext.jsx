import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(null);

let _id = 0;

function ToastContainer({ toasts, remove }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className="toast-msg">{t.msg}</span>
          <button className="toast-close" onClick={() => remove(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((msg, type = 'success') => {
    const id = ++_id;
    setToasts(ts => [...ts, { id, msg, type }]);
    setTimeout(() => remove(id), 3800);
  }, [remove]);

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <ToastContainer toasts={toasts} remove={remove} />
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
