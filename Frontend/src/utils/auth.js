const ROLE_KEY     = 'afra_crafts_role';
const NAME_KEY     = 'afra_crafts_user_name';
const USERNAME_KEY = 'afra_crafts_username';

export const getRole     = () => localStorage.getItem(ROLE_KEY);
export const isAdmin     = () => getRole() === 'admin';
export const getUserName = () => localStorage.getItem(NAME_KEY) || '';
export const getUsername = () => localStorage.getItem(USERNAME_KEY) || '';

export const setAdminSession = (username, fullName) => {
  localStorage.setItem(ROLE_KEY, 'admin');
  localStorage.setItem(NAME_KEY, fullName);
  localStorage.setItem(USERNAME_KEY, username.trim().toLowerCase());
};

export const logout = () => {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(USERNAME_KEY);
};

export const logoutAdmin = logout;

// kept for backward compat if anything still calls it
export const loginAdmin = () => setAdminSession('afraadmin', 'Afra Admin');
export const loginUser  = () => {};
